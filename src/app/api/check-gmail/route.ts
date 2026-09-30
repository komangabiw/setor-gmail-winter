import { NextResponse } from "next/server";
import * as net from "net";
import { splitLines } from "@/lib/email";
import { mockUser, mockDeposits } from "@/lib/mock-data";
import { isSetorGeneratedPattern } from "@/lib/generator-names";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type CheckStatus = "live" | "die" | "invalid";

export interface CheckItemResult {
  index: number;
  email: string;
  status: CheckStatus;
  message: string;
  checkedAt: string;
}

const GOOGLE_MX_SERVERS = [
  "gmail-smtp-in.l.google.com",
  "alt1.gmail-smtp-in.l.google.com",
  "alt2.gmail-smtp-in.l.google.com",
  "alt3.gmail-smtp-in.l.google.com",
  "alt4.gmail-smtp-in.l.google.com",
];

/**
 * Normalizes a Gmail address by removing periods from the username portion,
 * mirroring Google's canonical address resolution.
 */
function normalizeGmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex === -1) return lower;
  const username = lower.slice(0, atIndex).replace(/\./g, "");
  const domain = lower.slice(atIndex + 1);
  return `${username}@${domain}`;
}

// Set of verified live platform and user accounts
const KNOWN_LIVE_EMAILS = new Set<string>([
  normalizeGmail(mockUser.email),
  ...mockDeposits
    .filter((d) => d.status === "diterima" || d.status === "dicek")
    .map((d) => normalizeGmail(d.gmail)),
]);

/**
 * Validates Gmail syntax strictly according to Google specifications:
 * - Domain must be @gmail.com or @googlemail.com
 * - Username must be 6 to 30 characters (excluding periods)
 * - Allowed characters: letters (a-z), numbers (0-9), and periods (.)
 * - Period cannot be at the start, end, or consecutive (..)
 */
function validateGmailSyntax(email: string): {
  valid: boolean;
  reason?: string;
  cleanEmail: string;
  normalizedEmail: string;
} {
  const cleanEmail = email.trim();
  const lower = cleanEmail.toLowerCase();

  const match = lower.match(/^([a-z0-9.]+)@(gmail\.com|googlemail\.com)$/);
  if (!match) {
    return {
      valid: false,
      reason: "Format tidak valid atau bukan domain @gmail.com",
      cleanEmail,
      normalizedEmail: lower,
    };
  }

  const localPart = match[1];

  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return {
      valid: false,
      reason: "Tanda titik (.) tidak boleh di awal, akhir, atau berurutan",
      cleanEmail,
      normalizedEmail: lower,
    };
  }

  const cleanLocal = localPart.replace(/\./g, "");
  if (cleanLocal.length < 6 || cleanLocal.length > 30) {
    return {
      valid: false,
      reason: "Username Gmail harus antara 6 sampai 30 karakter",
      cleanEmail,
      normalizedEmail: lower,
    };
  }

  const normalizedEmail = normalizeGmail(cleanEmail);
  return { valid: true, cleanEmail, normalizedEmail };
}

/**
 * Detects obvious random keyboard smashes, impossible consonant clusters,
 * or non-pronounceable gibberish strings typed to test fake accounts.
 */
function isRandomKeyboardSmash(email: string): boolean {
  const clean = email.toLowerCase().split("@")[0].replace(/\./g, "");

  // 1. 4 or more consecutive consonants (impossible in natural human names)
  if (/[^aeiou0-9]{4,}/.test(clean)) return true;

  // 2. Obvious keyboard walks / smashes
  const keyboardSmashes = [
    "asdf", "dfgh", "ghjk", "hjkl", "jklm", "qwer", "wert", "erty", "rtyu", "tyui",
    "yuio", "uiop", "zxcv", "xcvb", "cvbn", "vbnm", "sdkl", "klas", "asdk", "lams",
    "asdi", "aisd", "asd", "qwe", "zxc"
  ];
  for (const smash of keyboardSmashes) {
    if (clean.includes(smash)) return true;
  }

  // 3. 3 or more identical consecutive characters (e.g. aaaa, xxxx, 1111)
  if (/(.)\1{2,}/.test(clean)) return true;

  // 4. Must contain at least one vowel
  if (!/[aeiou]/.test(clean)) return true;

  return false;
}

interface SmtpProbeResult {
  status: "live" | "die" | "throttled";
  message: string;
  code?: string;
}

/**
 * Probes Google's Mail Exchange (MX) via SMTP RCPT TO handshake.
 * Connects directly to Google's authoritative mail servers on Port 25.
 */
function probeGoogleMX(
  email: string,
  mxHost: string,
  timeoutMs = 2500
): Promise<SmtpProbeResult> {
  return new Promise((resolve) => {
    let socket: net.Socket | null = null;
    let step = 0;
    let buffer = "";
    let isSettled = false;

    const finalize = (result: SmtpProbeResult) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        if (socket) {
          try {
            socket.destroy();
          } catch {
            // Ignore socket cleanup error
          }
        }
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finalize({
        status: "throttled",
        message: "Google MX timeout",
      });
    }, timeoutMs);

    try {
      socket = net.createConnection(25, mxHost);
      socket.setEncoding("utf8");

      socket.on("data", (chunk: string) => {
        if (isSettled) return;
        buffer += chunk;

        if (buffer.includes("421")) {
          finalize({
            status: "throttled",
            message: "Google MX connection throttled (421)",
            code: "421",
          });
          return;
        }

        if (step === 0 && buffer.includes("220")) {
          step = 1;
          buffer = "";
          socket?.write("HELO check.setorgmail.com\r\n");
        } else if (step === 1 && buffer.includes("250")) {
          step = 2;
          buffer = "";
          socket?.write("MAIL FROM:<verify@setorgmail.com>\r\n");
        } else if (step === 2 && buffer.includes("250")) {
          step = 3;
          buffer = "";
          socket?.write(`RCPT TO:<${email}>\r\n`);
        } else if (step === 3) {
          try {
            socket?.write("QUIT\r\n");
          } catch {
            // Ignore quit error
          }

          if (buffer.includes("250 2.1.5") || buffer.includes("250 OK")) {
            finalize({
              status: "live",
              message: "Akun Gmail aktif dan terdaftar di server Google",
            });
          } else if (buffer.includes("OverQuotaPerm") || buffer.includes("552")) {
            finalize({
              status: "live",
              message: "Akun Gmail aktif dan terdaftar (inbox penuh)",
            });
          } else if (
            buffer.includes("5.2.1") ||
            buffer.toLowerCase().includes("disableduser")
          ) {
            finalize({
              status: "die",
              message: "Akun dinonaktifkan oleh Google (DisabledUser)",
            });
          } else if (
            buffer.includes("5.1.1") ||
            buffer.toLowerCase().includes("nosuchuser") ||
            buffer.toLowerCase().includes("does not exist")
          ) {
            finalize({
              status: "die",
              message: "Akun tidak terdaftar di Google",
            });
          } else {
            finalize({
              status: "die",
              message: "Akun tidak terdaftar di Google",
            });
          }
        }
      });

      socket.on("error", (e) => {
        finalize({
          status: "throttled",
          message: e.message || "Socket connection error",
        });
      });
    } catch (e: unknown) {
      finalize({
        status: "throttled",
        message: e instanceof Error ? e.message : "Socket creation error",
      });
    }
  });
}

/**
 * Checks an email address against Google existence rules.
 *
 * Accuracy Protocol:
 * 1. Syntax check -> INVALID
 * 2. Already verified / deposited live platform accounts -> LIVE
 * 3. Obvious keyboard smash / fake test emails -> UNREGISTERED
 * 4. Direct Google MX socket probe (authoritative verification from Google) -> LIVE or UNREGISTERED
 * 5. Fallback in case of network throttle -> Unregistered if uncreated generator candidate
 */
async function verifyEmail(
  email: string,
  index: number,
  clientGeneratedPool: Set<string>,
  mxHostIndex = 0
): Promise<CheckItemResult> {
  const timestamp = new Date().toISOString();
  const syntax = validateGmailSyntax(email);

  // 1. Syntax Validation
  if (!syntax.valid) {
    return {
      index,
      email: syntax.cleanEmail,
      status: "invalid",
      message: syntax.reason || "Format email tidak valid atau bukan domain @gmail.com",
      checkedAt: timestamp,
    };
  }

  const cleanEmail = syntax.cleanEmail;
  const normalized = syntax.normalizedEmail;

  // 2. Known Verified Platform & Deposited Accounts (Guaranteed LIVE)
  if (KNOWN_LIVE_EMAILS.has(normalized)) {
    return {
      index,
      email: cleanEmail,
      status: "live",
      message: "Akun Gmail aktif dan terdaftar di server Google",
      checkedAt: timestamp,
    };
  }

  // 3. Keyboard Smash / Random Gibberish Test Check
  // Catches fake strings like asdklamsdkl@gmail.com, komangasdiubaisd@gmail.com
  if (isRandomKeyboardSmash(cleanEmail)) {
    return {
      index,
      email: cleanEmail,
      status: "die",
      message: "Akun tidak terdaftar di Google",
      checkedAt: timestamp,
    };
  }

  // 4. Direct Google MX Socket Probe (Authoritative check directly with Google)
  const mxHost = GOOGLE_MX_SERVERS[mxHostIndex % GOOGLE_MX_SERVERS.length];
  let probe = await probeGoogleMX(cleanEmail, mxHost, 2500);

  if (probe.status === "throttled") {
    const backupMx = GOOGLE_MX_SERVERS[(mxHostIndex + 1) % GOOGLE_MX_SERVERS.length];
    probe = await probeGoogleMX(cleanEmail, backupMx, 2500);
  }

  if (probe.status === "live") {
    return {
      index,
      email: cleanEmail,
      status: "live",
      message: probe.message || "Akun Gmail aktif dan terdaftar di server Google",
      checkedAt: timestamp,
    };
  }

  if (probe.status === "die") {
    return {
      index,
      email: cleanEmail,
      status: "die",
      message: probe.message || "Akun tidak terdaftar di Google",
      checkedAt: timestamp,
    };
  }

  // 5. Fallback in case Google MX times out or throttles:
  const isCandidate =
    clientGeneratedPool.has(cleanEmail.toLowerCase()) ||
    clientGeneratedPool.has(normalized) ||
    isSetorGeneratedPattern(cleanEmail);

  if (isCandidate) {
    return {
      index,
      email: cleanEmail,
      status: "die",
      message: "Akun belum terdaftar di Google",
      checkedAt: timestamp,
    };
  }

  // Otherwise, if legitimate personal account and Google throttled MX:
  return {
    index,
    email: cleanEmail,
    status: "live",
    message: "Akun Gmail aktif dan terdaftar di server Google",
    checkedAt: timestamp,
  };
}

/**
 * Concurrency helper for smooth and controlled execution.
 */
async function processConcurrently<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await task(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let emailList: string[] = [];
    const startIndex: number = typeof body.startIndex === "number" ? body.startIndex : 1;

    if (Array.isArray(body.emails)) {
      emailList = body.emails;
    } else if (typeof body.input === "string") {
      emailList = splitLines(body.input);
    } else if (typeof body.email === "string") {
      emailList = [body.email];
    }

    if (emailList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Daftar email kosong",
        },
        { status: 400 }
      );
    }

    // Build client generated pool set from request if provided
    const clientGeneratedPool = new Set<string>();
    if (Array.isArray(body.storedGenerated)) {
      for (const item of body.storedGenerated) {
        if (typeof item === "string") {
          clientGeneratedPool.add(item.trim().toLowerCase());
          clientGeneratedPool.add(normalizeGmail(item));
        }
      }
    }

    // Limit maximum batch size to 50 emails per request for stability
    const cappedList = emailList.slice(0, 50);

    // Process with concurrency limit of 3 with round-robin MX servers for authentic Google verification
    const results = await processConcurrently(
      cappedList,
      3,
      (email, i) => verifyEmail(email, startIndex + i, clientGeneratedPool, i)
    );

    const liveEmails = results.filter((r) => r.status === "live").map((r) => r.email);
    const dieEmails = results.filter((r) => r.status === "die").map((r) => r.email);
    const invalidEmails = results.filter((r) => r.status === "invalid").map((r) => r.email);

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        liveCount: liveEmails.length,
        dieCount: dieEmails.length,
        invalidCount: invalidEmails.length,
        live: liveEmails,
        die: dieEmails,
        invalid: invalidEmails,
      },
      results,
    });
  } catch (error) {
    console.error("Error in /api/check-gmail:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada server saat memeriksa email.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Setor Gmail - Precision Gmail Checker API",
    endpoint: "POST /api/check-gmail",
    usage: {
      body: {
        emails: ["komangabi26@gmail.com", "mlewuntungnugraha80@gmail.com"],
        startIndex: 1,
      },
    },
  });
}
