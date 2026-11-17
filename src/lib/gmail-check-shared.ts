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

const CLEAN_PREFIXES = FIRST_NAMES.filter(
  (name) => /^[a-z]{3,12}$/.test(name)
);

/**
 * Generates `count` (default 10) unique @gmail.com candidates with ultra-high
 * availability probability:
 * Format: [prefix (3-12 letters)] + [5 random alphanumeric] + [4-digit timestamp tail]@gmail.com
 * Username length: 12-21 chars (strictly within Gmail's 6-30 char rule).
 */
export function generateGmailCandidates(count = 10): {
  emails: string[];
  timestampTail: string;
} {
  const safeCount = Math.max(1, Math.min(10, Math.floor(Number(count) || 10)));
  const timestampTail = String(Date.now()).slice(-4).padStart(4, "0");
  const generated = new Set<string>();

  let attempts = 0;
  while (generated.size < safeCount && attempts < 500) {
    attempts++;
    const prefix = CLEAN_PREFIXES[secureRandomIndex(CLEAN_PREFIXES.length)] || "setor";
    const rand5 = randomAlphanumeric(5);
    const localPart = `${prefix}${rand5}${timestampTail}`.slice(0, 30);
    if (localPart.length >= 6 && localPart.length <= 30) {
      generated.add(`${localPart}@gmail.com`);
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

  // Strip whitespace & block CRLF / control characters (SMTP injection defense)
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

  // Fast path if already verified in platform database
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
      // Probe Google AccountChooser 302 redirect header over HTTPS Port 443:
      // - Registered Google account -> redirects with `&passive=1209600` (no `rip=1`)
      // - Unregistered / available account -> redirects with `&rip=1`
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

    // Secondary fallback to GXLU endpoint if AccountChooser redirect format ever changes
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
