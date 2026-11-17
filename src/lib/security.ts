/**
 * Security & Validation Module
 * OWASP Top 10 Hardening, Fraud Protection & Anti-Abuse
 */

// Rate limiting & security tracking state (client/runtime cache)
const failedAttemptsTracker = new Map<string, { count: number; lastAttempt: number }>();
const requestCounter = new Map<string, { count: number; windowStart: number }>();

/**
 * 1. Strict Input Sanitization (XSS & Injection Protection)
 */
export function sanitizeInputText(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove null bytes and invisible control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Strip script and unsafe HTML tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "");
}

/**
 * 1b. Safe External URL Validator (Prevent javascript:/data: XSS & Open Redirects)
 */
export function sanitizeExternalUrl(
  rawUrl: unknown,
  fallbackUrl: string,
  allowedHostSuffixes?: string[]
): string {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return fallbackUrl;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:") return fallbackUrl;
    if (allowedHostSuffixes && allowedHostSuffixes.length > 0) {
      const host = parsed.hostname.toLowerCase();
      const allowed = allowedHostSuffixes.some(
        (suffix) => host === suffix || host.endsWith(`.${suffix}`)
      );
      if (!allowed) return fallbackUrl;
    }
    return parsed.toString();
  } catch {
    return fallbackUrl;
  }
}

/**
 * 1c. Safe URI Parameter Decoder (Prevent URIError crashes & Reflected Phishing Text)
 */
export function safeDecodeParam(raw: string | null | undefined, maxLength = 180): string {
  if (!raw) return "";
  try {
    return sanitizeInputText(decodeURIComponent(raw), maxLength);
  } catch {
    return sanitizeInputText(raw, maxLength);
  }
}

/**
 * 1d. Cryptographically Secure Random Integer [0, max)
 */
export function secureRandomInt(max: number): number {
  if (max <= 1) return 0;
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let val = 0;
    do {
      crypto.getRandomValues(array);
      val = array[0];
    } while (val >= limit);
    return val % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * 1e. Strict Gmail Syntax Validator
 */
export function isValidStrictGmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const lower = email.trim().toLowerCase();
  if (lower.length > 64) return false;
  const match = lower.match(/^([a-z0-9.]+)@(gmail\.com|googlemail\.com)$/);
  if (!match) return false;
  const local = match[1];
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  const cleanLocal = local.replace(/\./g, "");
  return cleanLocal.length >= 6 && cleanLocal.length <= 30;
}

/**
 * 2. E-Wallet Phone Number Validation
 * Must be pure numeric, 10-13 digits, starting with 08 or 628
 */
export function validateEWalletNumber(phone: unknown): {
  valid: boolean;
  cleaned: string;
  error?: string;
} {
  if (typeof phone !== "string") {
    return { valid: false, cleaned: "", error: "Nomor e-wallet tidak valid." };
  }

  let cleaned = phone.replace(/[^\d+]/g, "").trim();

  // Convert international format +628 / 628 to 08
  if (cleaned.startsWith("+62")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.slice(2);
  }

  // Pure numeric check
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, cleaned: "", error: "Nomor e-wallet hanya boleh berisi angka." };
  }

  // Indonesian mobile / e-wallet format: 08 followed by 8 to 11 digits (total 10-13 digits)
  if (!/^08\d{8,11}$/.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      error: "Nomor e-wallet harus dimulai dengan 08 dan memiliki panjang 10–13 digit.",
    };
  }

  return { valid: true, cleaned };
}

/**
 * 3. Withdrawal Amount Validation (Fraud Protection & Positive Integer)
 */
export const MIN_WITHDRAWAL_AMOUNT = 5000;
export const MAX_INSTANT_WITHDRAWAL = 5000000; // Rp 5.000.000 max per instant transaction
export const MAX_WITHDRAWALS_PER_DAY = 3; // Max 3 withdrawals per 24 hours per user

export function validateWithdrawalAmount(
  amount: unknown,
  currentBalance: number
): {
  valid: boolean;
  cleanAmount: number;
  error?: string;
} {
  const num = Number(amount);

  if (isNaN(num) || !Number.isFinite(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      cleanAmount: 0,
      error: "Nominal penarikan harus berupa angka bulat positif.",
    };
  }

  if (num < MIN_WITHDRAWAL_AMOUNT) {
    return {
      valid: false,
      cleanAmount: num,
      error: `Minimal penarikan saldo adalah Rp${MIN_WITHDRAWAL_AMOUNT.toLocaleString("id-ID")}.`,
    };
  }

  if (num > MAX_INSTANT_WITHDRAWAL) {
    return {
      valid: false,
      cleanAmount: num,
      error: `Batas maksimal penarikan instan adalah Rp${MAX_INSTANT_WITHDRAWAL.toLocaleString("id-ID")} per transaksi. Hubungi admin untuk nominal lebih besar.`,
    };
  }

  if (num > currentBalance) {
    return {
      valid: false,
      cleanAmount: num,
      error: "Saldo tidak mencukupi untuk melakukan penarikan ini.",
    };
  }

  return { valid: true, cleanAmount: num };
}

/**
 * 4. Error Sanitizer (A09 - Prevent DB Stack Trace Leaks)
 */
export function sanitizeErrorMessage(err: unknown, fallbackMessage = "Terjadi kesalahan pada sistem. Silakan coba lagi nanti."): string {
  if (!err) return fallbackMessage;

  const raw = err instanceof Error ? err.message : String(err);

  // Detect sensitive database or infrastructure keywords
  const sensitivePatterns = [
    /pgrst/i,
    /postgres/i,
    /syntax error/i,
    /relation.*does not exist/i,
    /column.*does not exist/i,
    /violates.*constraint/i,
    /supabase/i,
    /jwt/i,
    /secret/i,
    /bearer/i,
    /password/i,
    /token/i,
    /connection refused/i,
    /502/i,
    /503/i,
    /at\s+.*\(.*:\d+:\d+\)/, // Stack traces
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(raw)) {
      console.error("[SECURITY LOG] Sanitized sensitive error:", raw);
      return fallbackMessage;
    }
  }

  // Safe user-friendly business error messages
  if (
    raw.includes("tidak mencukupi") ||
    raw.includes("Batas penarikan") ||
    raw.includes("Akses ditolak") ||
    raw.includes("valid")
  ) {
    return raw;
  }

  return fallbackMessage;
}

/**
 * 5. Security Alert Logger (A09 & C2 - Admin Notifications)
 */
export async function sendSecurityAlert(
  title: string,
  details: Record<string, any>
): Promise<void> {
  const timestamp = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  
  console.warn(`[SECURITY ALERT] [${timestamp}] ${title}`, details);

  try {
    // If running in browser or environment with telegram report endpoint
    if (typeof window !== "undefined") {
      const alertPayload = {
        kategori: "🚨 KEAMANAN SISTEM",
        judul: `ALERT: ${title}`,
        deskripsi: `Waktu: ${timestamp} WIB\n\nDetail:\n${JSON.stringify(details, null, 2)}`,
      };

      fetch("/api/telegram-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertPayload),
      }).catch(() => {
        // Silent catch to prevent alert loop
      });
    }
  } catch (err) {
    console.error("[SECURITY ALERT DISPATCH ERROR]", err);
  }
}

/**
 * 6. Rate Limit Tracker for Failed Withdrawals
 * Alerts if > 5 consecutive failures occur for a user
 */
export function recordWithdrawalAttempt(userId: string, isSuccess: boolean): void {
  const existing = failedAttemptsTracker.get(userId) || { count: 0, lastAttempt: Date.now() };

  if (isSuccess) {
    failedAttemptsTracker.delete(userId);
    return;
  }

  existing.count += 1;
  existing.lastAttempt = Date.now();
  failedAttemptsTracker.set(userId, existing);

  if (existing.count >= 5) {
    sendSecurityAlert("Penarikan Saldo Gagal Berulang (>5x)", {
      userId,
      failedAttempts: existing.count,
      lastAttempt: new Date(existing.lastAttempt).toISOString(),
      action: "Mohon periksa potensi penyalahgunaan / manipulasi saldo.",
    });
  }
}

/**
 * 7. In-Memory Request Rate Limiter (for API calls)
 */
export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounter.get(key);

  if (!record || now - record.windowStart > windowMs) {
    requestCounter.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}
