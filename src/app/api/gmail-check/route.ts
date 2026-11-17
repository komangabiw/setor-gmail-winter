import net from "net";
import dns from "dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/security";
import {
  type GmailProbeItem,
  validateGmailForProbe,
  checkSingleHttpsFallback,
} from "@/lib/gmail-check-shared";

const SMTP_TIMEOUT = 3500;
const MAX_EMAILS_PER_REQUEST = 10;

async function getGmailMx(): Promise<string> {
  try {
    const records = await dns.resolveMx("gmail.com");
    records.sort((a, b) => a.priority - b.priority);
    return records[0]?.exchange || "gmail-smtp-in.l.google.com";
  } catch {
    return "gmail-smtp-in.l.google.com";
  }
}

/**
 * Engine 1: Single-Connection SMTP Connection-Reuse Check (Port 25)
 * Sends EHLO -> MAIL FROM:<verify@setorgmail.com> -> sequential RCPT TO:<email>
 * for up to 10 emails over 1 reused TCP socket.
 */
function checkBatchSmtp(
  items: Array<{ index: number; cleanEmail: string }>,
  mxHost: string
): Promise<GmailProbeItem[]> {
  return new Promise((resolve, reject) => {
    const results: GmailProbeItem[] = [];
    let currentIdx = 0;
    let step: "BANNER" | "EHLO" | "MAIL_FROM" | "RCPT_TO" | "QUIT" = "BANNER";
    let buffer = "";
    let cmdStartTime = Date.now();
    let settled = false;

    const socket = net.createConnection(25, mxHost);
    socket.setTimeout(SMTP_TIMEOUT);

    const safeReject = (err: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(err);
    };

    const safeResolve = (res: GmailProbeItem[]) => {
      if (settled) return;
      settled = true;
      resolve(res);
    };

    const sendCmd = (cmd: string) => {
      cmdStartTime = Date.now();
      socket.write(cmd + "\r\n");
    };

    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf-8");
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.length < 3) continue;
        // Wait until final line of multi-line SMTP response (4th char is space)
        if (line.length >= 4 && line[3] === "-") continue;

        const code = parseInt(line.substring(0, 3), 10);
        if (Number.isNaN(code)) continue;

        if (step === "BANNER") {
          if (code === 220) {
            step = "EHLO";
            sendCmd("EHLO setorgmail.com");
          } else {
            return safeReject(new Error(`SMTP Banner Rejected (${code})`));
          }
        } else if (step === "EHLO") {
          if (code === 250) {
            step = "MAIL_FROM";
            sendCmd("MAIL FROM:<verify@setorgmail.com>");
          } else {
            return safeReject(new Error(`EHLO Failed (${code})`));
          }
        } else if (step === "MAIL_FROM") {
          if (code === 250) {
            step = "RCPT_TO";
            sendCmd(`RCPT TO:<${items[currentIdx].cleanEmail}>`);
          } else {
            return safeReject(new Error(`MAIL FROM Failed (${code})`));
          }
        } else if (step === "RCPT_TO") {
          const elapsed = Date.now() - cmdStartTime;
          const target = items[currentIdx];

          if (code === 250) {
            results.push({
              index: target.index,
              email: target.cleanEmail,
              status: "LIVE",
              code: 250,
              message: "Email aktif / sudah terdaftar (SMTP)",
              elapsed_ms: elapsed,
              engine: "SMTP",
            });
          } else if (code === 550 || code === 551 || code === 553) {
            results.push({
              index: target.index,
              email: target.cleanEmail,
              status: "AVAILABLE",
              code: 550,
              message: "Belum pernah dibuat / Tersedia (SMTP)",
              elapsed_ms: elapsed,
              engine: "SMTP",
            });
          } else {
            results.push({
              index: target.index,
              email: target.cleanEmail,
              status: "LIMIT",
              code,
              message: `SMTP Response ${code}`,
              elapsed_ms: elapsed,
              engine: "SMTP",
            });
          }

          currentIdx++;
          if (currentIdx < items.length) {
            sendCmd(`RCPT TO:<${items[currentIdx].cleanEmail}>`);
          } else {
            step = "QUIT";
            sendCmd("QUIT");
            socket.end();
            return safeResolve(results);
          }
        }
      }
    });

    socket.on("timeout", () => {
      safeReject(new Error("PORT_25_TIMEOUT"));
    });

    socket.on("error", (err: Error) => {
      safeReject(err);
    });

    socket.on("close", () => {
      if (!settled) {
        if (results.length === items.length) {
          safeResolve(results);
        } else {
          safeReject(new Error("SMTP_CONNECTION_CLOSED_EARLY"));
        }
      }
    });
  });
}

async function lookupKnownLiveEmails(normalizedEmails: string[]): Promise<Set<string>> {
  const known = new Set<string>();
  if (normalizedEmails.length === 0) return known;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kdjoeeehyahdgwgsfyal.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return known;

  try {
    const sb = createClient(supabaseUrl, serviceRoleKey);
    const [depRes, profRes] = await Promise.all([
      sb
        .from("deposits")
        .select("normalized_gmail")
        .in("normalized_gmail", normalizedEmails)
        .in("status", ["diterima", "pending", "dicek"]),
      sb.from("profiles").select("email").in("email", normalizedEmails),
    ]);

    for (const row of depRes.data || []) {
      if (row.normalized_gmail) known.add(String(row.normalized_gmail).toLowerCase());
    }
    for (const row of profRes.data || []) {
      if (row.email) {
        const lower = String(row.email).trim().toLowerCase();
        const at = lower.lastIndexOf("@");
        if (at !== -1) {
          known.add(lower.slice(0, at).replace(/\./g, "") + "@gmail.com");
        }
      }
    }
  } catch {
    // ignore optional DB enrichment failure
  }
  return known;
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();

  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local-ip";

    const rate = checkRateLimit(`gmail-check:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Terlalu banyak permintaan cek Gmail. Silakan tunggu 1 menit.",
        },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawEmails: unknown[] = Array.isArray(body?.emails)
      ? body.emails
      : typeof body?.email === "string"
      ? [body.email]
      : [];

    if (rawEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: "Daftar email tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (rawEmails.length > MAX_EMAILS_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          error: `Maksimal ${MAX_EMAILS_PER_REQUEST} email per pemeriksaan.`,
        },
        { status: 400 }
      );
    }

    const invalidResults: GmailProbeItem[] = [];
    const validTargets: Array<{ index: number; cleanEmail: string; normalizedEmail: string }> = [];

    rawEmails.forEach((raw, idx) => {
      const check = validateGmailForProbe(raw);
      if (!check.valid) {
        invalidResults.push({
          index: idx + 1,
          email: check.cleanEmail || String(raw || "").trim().slice(0, 64),
          status: "INVALID",
          code: 400,
          message: check.reason || "Format email tidak valid",
          elapsed_ms: 0,
          engine: "SYNTAX",
        });
      } else {
        validTargets.push({
          index: idx + 1,
          cleanEmail: check.cleanEmail,
          normalizedEmail: check.normalizedEmail,
        });
      }
    });

    let probedResults: GmailProbeItem[] = [];
    let usedEngine: "SMTP_PORT_25" | "HTTPS_PORT_443" | "SYNTAX_ONLY" = "SYNTAX_ONLY";

    if (validTargets.length > 0) {
      try {
        // Primary Mode: Single-Connection SMTP Port 25 Reuse
        const mxHost = await getGmailMx();
        probedResults = await checkBatchSmtp(validTargets, mxHost);
        usedEngine = "SMTP_PORT_25";
      } catch {
        // Automatic Fallback Mode: HTTPS Port 443 Probe (No VPS needed)
        const knownLive = await lookupKnownLiveEmails(
          validTargets.map((t) => t.normalizedEmail)
        );
        probedResults = await Promise.all(
          validTargets.map((target) =>
            checkSingleHttpsFallback(target.cleanEmail, target.index, knownLive)
          )
        );
        usedEngine = "HTTPS_PORT_443";
      }
    }

    const allResults = [...invalidResults, ...probedResults].sort(
      (a, b) => a.index - b.index
    );

    const summary = {
      total: allResults.length,
      live: allResults.filter((r) => r.status === "LIVE").length,
      available: allResults.filter((r) => r.status === "AVAILABLE").length,
      limit: allResults.filter((r) => r.status === "LIMIT").length,
      invalid: allResults.filter((r) => r.status === "INVALID").length,
      error: allResults.filter((r) => r.status === "ERROR").length,
    };

    return NextResponse.json(
      {
        success: true,
        engine: usedEngine,
        total_elapsed_ms: Date.now() - requestStart,
        summary,
        results: allResults,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memproses pengecekan Gmail." },
      { status: 500 }
    );
  }
}
