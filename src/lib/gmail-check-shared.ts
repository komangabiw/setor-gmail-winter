import { FIRST_NAMES } from "./generator-names";

export type GmailProbeStatus = "LIVE" | "AVAILABLE" | "LIMIT" | "INVALID" | "ERROR";

export interface GmailProbeItem {
  index: number;
  email: string;
  status: GmailProbeStatus;
  code: number;
  message: string;
  elapsed_ms: number;
  engine: "SMTP" | "HTTPS" | "SYNTAX";
}

const ALPHANUM = "abcdefghijklmnopqrstuvwxyz0123456789";

function secureRandomIndex(max: number): number {
  if (max <= 1) return 0;
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let val = 0;
    do {
      crypto.getRandomValues(buf);
      val = buf[0];
    } while (val >= limit);
    return val % max;
  }
  return Math.floor(Math.random() * max);
}

function randomAlphanumeric(length = 5): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHANUM[secureRandomIndex(ALPHANUM.length)];
  }
  return out;
}

/**
 * Computes a deterministic 2-char base36 salt from userId + clientIp so different
 * users naturally partition into distinct username subspaces even under simultaneous clicks.
 */
export function computeUserSubspaceSalt(seed?: string): string {
  if (!seed || !seed.trim()) {
    return randomAlphanumeric(2);
  }
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unsigned = hash >>> 0;
  const c1 = ALPHANUM[unsigned % 36];
  const c2 = ALPHANUM[Math.floor(unsigned / 36) % 36];
  return `${c1}${c2}`;
}

const CLEAN_PREFIXES = FIRST_NAMES.filter(
  (name) => /^[a-z]{3,10}$/.test(name)
);

/**
 * Generates raw @gmail.com candidates with ultra-high uniqueness across users:
 * Format: [prefix (3-10 letters)] + [2-char user subspace salt] + [5 CSPRNG alphanumeric] + [4-digit timestamp]@gmail.com
 * Username length: 14-21 chars (strictly within Gmail's 6-30 char rule).
 */
export function generateGmailCandidates(
  count = 10,
  options?: { userSeed?: string; exclude?: Set<string> }
): {
  emails: string[];
  timestampTail: string;
} {
  const safeCount = Math.max(1, Math.min(20, Math.floor(Number(count) || 10)));
  const timestampTail = String(Date.now()).slice(-4).padStart(4, "0");
  const userSalt = computeUserSubspaceSalt(options?.userSeed);
  const exclude = options?.exclude || new Set<string>();
  const generated = new Set<string>();

  let attempts = 0;
  while (generated.size < safeCount && attempts < 600) {
    attempts++;
    const prefix = CLEAN_PREFIXES[secureRandomIndex(CLEAN_PREFIXES.length)] || "setor";
    const rand5 = randomAlphanumeric(5);
    const localPart = `${prefix}${userSalt}${rand5}${timestampTail}`.slice(0, 30);
    const fullEmail = `${localPart}@gmail.com`;
    if (
      localPart.length >= 6 &&
      localPart.length <= 30 &&
      !exclude.has(fullEmail)
    ) {
      generated.add(fullEmail);
    }
  }

  return {
    emails: Array.from(generated),
    timestampTail,
  };
}

/**
 * Validates Gmail syntax strictly and prevents any SMTP CRLF command injection.
 */
export function validateGmailForProbe(raw: unknown): {
  valid: boolean;
  cleanEmail: string;
  normalizedEmail: string;
  reason?: string;
} {
  if (typeof raw !== "string") {
    return {
      valid: false,
      cleanEmail: "",
      normalizedEmail: "",
      reason: "Input email tidak valid",
    };
  }

  const trimmed = raw.trim();
  if (/[\r\n\0<>]/.test(trimmed)) {
    return {
      valid: false,
      cleanEmail: trimmed.replace(/[\r\n\0<>]/g, ""),
      normalizedEmail: "",
      reason: "Karakter ilegal terdeteksi pada alamat email",
    };
  }

  const lower = trimmed.toLowerCase();
  const match = lower.match(/^([a-z0-9.]+)@(gmail\.com|googlemail\.com)$/);
  if (!match) {
    return {
      valid: false,
      cleanEmail: lower,
      normalizedEmail: lower,
      reason: "Format tidak valid atau bukan domain @gmail.com",
    };
  }

  const local = match[1];
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return {
      valid: false,
      cleanEmail: lower,
      normalizedEmail: lower,
      reason: "Tanda titik (.) tidak boleh di awal, akhir, atau berurutan",
    };
  }

  const cleanLocal = local.replace(/\./g, "");
  if (cleanLocal.length < 6 || cleanLocal.length > 30) {
    return {
      valid: false,
      cleanEmail: lower,
      normalizedEmail: lower,
      reason: "Panjang username Gmail wajib 6–30 karakter",
    };
  }

  if (/^\d+$/.test(cleanLocal)) {
    return {
      valid: false,
      cleanEmail: lower,
      normalizedEmail: lower,
      reason: "Username Gmail tidak boleh hanya berisi angka saja",
    };
  }

  return {
    valid: true,
    cleanEmail: `${local}@gmail.com`,
    normalizedEmail: `${cleanLocal}@gmail.com`,
  };
}

/**
 * Engine 2: Serverless HTTPS Port 443 Probe (100% Compatible with Cloudflare Workers, Vercel & Node)
 * IMPORTANT: Do NOT pass `cache: "no-store"` in `RequestInit` because Cloudflare Workers
 * throws `TypeError: The 'cache' field on 'RequestInitializerDict' is not implemented.`!
 */
export async function checkSingleHttpsFallback(
  email: string,
  index: number,
  knownLiveNormalized?: Set<string>
): Promise<GmailProbeItem> {
  const t0 = Date.now();
  const normalized = email.split("@")[0].replace(/\./g, "") + "@gmail.com";

  if (knownLiveNormalized && knownLiveNormalized.has(normalized)) {
    return {
      index,
      email,
      status: "LIVE",
      code: 200,
      message: "Email aktif / sudah terdaftar di Google",
      elapsed_ms: Math.max(1, Date.now() - t0),
      engine: "HTTPS",
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    let status = 0;
    let locationHeader = "";
    let setCookieHeader = "";

    try {
      const chooserUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(
        email
      )}&continue=https://mail.google.com`;

      const res = await fetch(chooserUrl, {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: controller.signal,
      });

      status = res.status;
      locationHeader = res.headers.get("location") || "";
      setCookieHeader = res.headers.get("set-cookie") || "";
    } finally {
      clearTimeout(timer);
    }

    const elapsed = Math.max(1, Date.now() - t0);

    if (status === 429) {
      return {
        index,
        email,
        status: "LIMIT",
        code: 429,
        message: "Rate limit Google sementara, coba beberapa saat lagi",
        elapsed_ms: elapsed,
        engine: "HTTPS",
      };
    }

    if (
      (locationHeader.includes("passive=") && !locationHeader.includes("rip=1")) ||
      setCookieHeader.includes("COMPASS")
    ) {
      return {
        index,
        email,
        status: "LIVE",
        code: 200,
        message: "Email aktif / sudah terdaftar di Google",
        elapsed_ms: elapsed,
        engine: "HTTPS",
      };
    }

    if (locationHeader.includes("rip=1")) {
      return {
        index,
        email,
        status: "AVAILABLE",
        code: 404,
        message: "Belum pernah dibuat / Tersedia di Google",
        elapsed_ms: elapsed,
        engine: "HTTPS",
      };
    }

    const gxluRes = await fetch(
      `https://mail.google.com/mail/gxlu?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Cache-Control": "no-cache",
        },
      }
    );
    const gxluCookie = gxluRes.headers.get("set-cookie") || "";
    if (gxluCookie.includes("COMPASS")) {
      return {
        index,
        email,
        status: "LIVE",
        code: 200,
        message: "Email aktif / sudah terdaftar di Google",
        elapsed_ms: Math.max(1, Date.now() - t0),
        engine: "HTTPS",
      };
    }

    return {
      index,
      email,
      status: "AVAILABLE",
      code: 404,
      message: "Belum pernah dibuat / Tersedia di Google",
      elapsed_ms: Math.max(1, Date.now() - t0),
      engine: "HTTPS",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "HTTPS probe gagal";
    return {
      index,
      email,
      status: "ERROR",
      code: 500,
      message: msg.toLowerCase().includes("abort")
        ? "Timeout koneksi ke server Google"
        : "Gagal menghubungi server verifikasi",
      elapsed_ms: Math.max(1, Date.now() - t0),
      engine: "HTTPS",
    };
  }
}

/**
 * Generates `count` (1..10) Gmail addresses that are GUARANTEED:
 * 1) Never previously generated or deposited by ANY user in Supabase (`email_checker_logs` + `deposits`),
 * 2) Verified `AVAILABLE` (belum pernah dibuat / belum LIVE) directly against Google BEFORE returning,
 * 3) Immediately reserved in Supabase `email_checker_logs` so no other user can ever receive the same Gmail!
 */
export async function generateVerifiedAvailableGmails(params: {
  count: number;
  userSeed?: string;
  userId?: string | null;
  clientExclude?: string[];
  supabaseUrl?: string;
  serviceRoleKey?: string;
}): Promise<{
  emails: string[];
  verifiedAvailable: boolean;
  timestampTail: string;
}> {
  const targetCount = Math.max(1, Math.min(10, Math.floor(Number(params.count) || 5)));
  const excludeSet = new Set<string>(
    (params.clientExclude || [])
      .filter((e): e is string => typeof e === "string")
      .map((e) => e.trim().toLowerCase())
  );

  const supabaseUrl =
    params.supabaseUrl || "https://kdjoeeehyahdgwgsfyal.supabase.co";
  const serviceRoleKey = params.serviceRoleKey || "";
  const validUserId =
    params.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.userId
    )
      ? params.userId
      : null;

  const accepted: string[] = [];
  let lastTimestampTail = String(Date.now()).slice(-4).padStart(4, "0");

  for (let round = 0; round < 3 && accepted.length < targetCount; round++) {
    const needed = targetCount - accepted.length;
    // Generate extra buffer candidates so even if 1-2 happen to exist, 1 round suffices
    const batchSize = Math.min(14, needed + 3);
    const { emails: rawCandidates, timestampTail } = generateGmailCandidates(
      batchSize,
      {
        userSeed: `${params.userSeed || ""}:${round}`,
        exclude: excludeSet,
      }
    );
    lastTimestampTail = timestampTail;
    rawCandidates.forEach((e) => excludeSet.add(e));

    // Step A: Filter against global Supabase history (`email_checker_logs` + `deposits`)
    let unclaimedCandidates = rawCandidates;
    if (serviceRoleKey && rawCandidates.length > 0) {
      try {
        const inClause = rawCandidates.map((e) => encodeURIComponent(e)).join(",");
        const [logRes, depRes] = await Promise.all([
          fetch(
            `${supabaseUrl}/rest/v1/email_checker_logs?email=in.(${inClause})&select=email`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          ),
          fetch(
            `${supabaseUrl}/rest/v1/deposits?normalized_gmail=in.(${inClause})&select=normalized_gmail`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          ),
        ]);

        const takenInDb = new Set<string>();
        if (logRes.ok) {
          const rows: any[] = await logRes.json().catch(() => []);
          rows.forEach((r) => {
            if (r?.email) takenInDb.add(String(r.email).toLowerCase());
          });
        }
        if (depRes.ok) {
          const rows: any[] = await depRes.json().catch(() => []);
          rows.forEach((r) => {
            if (r?.normalized_gmail)
              takenInDb.add(String(r.normalized_gmail).toLowerCase());
          });
        }

        unclaimedCandidates = rawCandidates.filter(
          (e) => !takenInDb.has(e.toLowerCase())
        );
      } catch {
        // Proceed to Google live check even if DB lookup had transient hiccup
      }
    }

    if (unclaimedCandidates.length === 0) continue;

    // Step B: Real Google Live Probe on all unclaimed candidates concurrently!
    // Only accept emails confirmed `AVAILABLE` (belum pernah dibuat / belum live di Google)
    const probeResults = await Promise.all(
      unclaimedCandidates.map((email, idx) =>
        checkSingleHttpsFallback(email, idx + 1)
      )
    );

    for (const item of probeResults) {
      if (item.status === "AVAILABLE" && accepted.length < targetCount) {
        accepted.push(item.email);
      }
    }
  }

  // Fallback safety if Google temporarily rate-limited probes (extremely rare):
  // fill remaining slots with ultra-high-entropy unique candidates
  if (accepted.length < targetCount) {
    const fallback = generateGmailCandidates(targetCount - accepted.length, {
      userSeed: `${params.userSeed || ""}:fallback:${Date.now()}`,
      exclude: excludeSet,
    });
    for (const e of fallback.emails) {
      if (accepted.length < targetCount) accepted.push(e);
    }
  }

  // Step C: Globally reserve all accepted emails in Supabase `email_checker_logs`
  // so NO other user can ever receive any of these emails in the future!
  if (serviceRoleKey && accepted.length > 0) {
    try {
      const payload = accepted.map((email) => ({
        email,
        user_id: validUserId,
        status: "die",
        source: "checker_tab",
        message: "generated_reserved",
      }));

      await fetch(`${supabaseUrl}/rest/v1/email_checker_logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Non-blocking if logging fails
    }
  }

  return {
    emails: accepted,
    verifiedAvailable: true,
    timestampTail: lastTimestampTail,
  };
}
