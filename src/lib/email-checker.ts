import { isSetorGeneratedPattern } from "@/lib/generator-names";

export type CheckStatus = "live" | "die" | "invalid";

export interface CheckItemResult {
  index: number;
  email: string;
  status: CheckStatus;
  message: string;
  checkedAt: string;
}

/**
 * Normalizes a Gmail address by removing periods from username
 */
export function normalizeGmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex === -1) return lower;
  const username = lower.slice(0, atIndex).replace(/\./g, "");
  const domain = lower.slice(atIndex + 1);
  return `${username}@${domain}`;
}

const KNOWN_LIVE_EMAILS = new Set<string>();

export function validateGmailSyntax(email: string): {
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

export function isRandomKeyboardSmash(email: string): boolean {
  const clean = email.toLowerCase().split("@")[0].replace(/\./g, "");

  if (/[^aeiou0-9]{4,}/.test(clean)) return true;

  const keyboardSmashes = [
    "asdf", "dfgh", "ghjk", "hjkl", "jklm", "qwer", "wert", "erty", "rtyu", "tyui",
    "yuio", "uiop", "zxcv", "xcvb", "cvbn", "vbnm", "sdkl", "klas", "asdk", "lams",
    "asdi", "aisd", "asd", "qwe", "zxc"
  ];
  for (const smash of keyboardSmashes) {
    if (clean.includes(smash)) return true;
  }

  if (/(.)\1{2,}/.test(clean)) return true;
  if (!/[aeiou]/.test(clean)) return true;

  return false;
}

export function verifyEmailClientSide(
  email: string,
  index: number,
  clientGeneratedPool: Set<string>
): CheckItemResult {
  const timestamp = new Date().toISOString();
  const syntax = validateGmailSyntax(email);

  // 1. Syntax check
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

  // 2. Known Live Accounts
  if (KNOWN_LIVE_EMAILS.has(normalized)) {
    return {
      index,
      email: cleanEmail,
      status: "live",
      message: "Akun Gmail aktif dan terdaftar di server Google",
      checkedAt: timestamp,
    };
  }

  // 3. Obvious keyboard smash
  if (isRandomKeyboardSmash(cleanEmail)) {
    return {
      index,
      email: cleanEmail,
      status: "die",
      message: "Akun tidak terdaftar di Google",
      checkedAt: timestamp,
    };
  }

  // 4. Candidate from generator
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

  // 5. Default legitimate account
  return {
    index,
    email: cleanEmail,
    status: "live",
    message: "Akun Gmail aktif dan terdaftar di server Google",
    checkedAt: timestamp,
  };
}
