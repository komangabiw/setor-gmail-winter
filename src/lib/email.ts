/**
 * Strict Gmail address validation for the Setor form.
 *
 * Only lines that are a *complete* Gmail address are counted. Anything else
 * — fragments such as `mskadmka@`, plain words such as `klasmda` or `kmsd`,
 * or any address on a non-Gmail domain — is rejected and must never reach the
 * detected-line counter nor the price total.
 */

/** Gmail caps the local part at 6–30 characters. */
const MIN_LOCAL_LENGTH = 6;
const MAX_LOCAL_LENGTH = 30;

/**
 * Local part: only letters, digits and single dots between groups. Rejects
 * leading/trailing dots, consecutive dots and every other punctuation.
 */
const LOCAL_PART = /^[a-z0-9]+(?:\.[a-z0-9]+)*$/i;

/** Exact domain — no subdomain tricks such as `user@mail.gmail.com`. */
const GMAIL_DOMAIN = "gmail.com";

/**
 * Returns `true` only for a complete, well-formed Gmail address.
 * Surrounding whitespace is tolerated; internal whitespace is not.
 */
export function isValidGmail(value: string): boolean {
  const candidate = value.trim();
  if (!candidate) return false;

  // Reject internal whitespace and any embedded control characters.
  if (/\s/.test(candidate)) return false;

  const separator = candidate.lastIndexOf("@");
  if (separator === -1) return false;

  const local = candidate.slice(0, separator);
  const domain = candidate.slice(separator + 1).toLowerCase();

  if (domain !== GMAIL_DOMAIN) return false;
  if (local.length < MIN_LOCAL_LENGTH || local.length > MAX_LOCAL_LENGTH) {
    return false;
  }
  return LOCAL_PART.test(local);
}

/** Splits a textarea value into trimmed, non-empty lines. */
export function splitLines(value: string): string[] {
  if (!value) return [];
  return value
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export interface GmailLineStats {
  /** Every non-empty line the user typed. */
  total: number;
  /** Lines that are complete, valid Gmail addresses. */
  valid: string[];
  /** Lines that failed validation, trimmed. */
  invalid: string[];
  validCount: number;
  invalidCount: number;
}

/** Classifies every pasted line so the UI can report what was rejected. */
export function analyzeGmailLines(value: string): GmailLineStats {
  const lines = splitLines(value);
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const line of lines) {
    if (isValidGmail(line)) valid.push(line);
    else invalid.push(line);
  }

  return {
    total: lines.length,
    valid,
    invalid,
    validCount: valid.length,
    invalidCount: invalid.length,
  };
}
