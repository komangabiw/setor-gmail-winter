/**
 * Email Checker — simulated liveness check.
 *
 * The rules mirror the real Setor flow:
 *  1. One address per line, split and trimmed.
 *  2. A line must be a *complete* Gmail address (`@gmail.com`) to be checked
 *     at all — anything else is reported as `invalid` and never "checked".
 *  3. Valid addresses are then classified `live` (AKTIF) or `die` (TIDAK AKTIF).
 *
 * The live/die outcome is a **pure function of the address**, not of
 * `Math.random()`. The same Gmail therefore always reports the same status, so
 * re-running the checker (or re-opening the page) never flips a result and the
 * user can trust a "Salin Gmail Live" list.
 */

import { isValidGmail, splitLines } from "./email";

export type CheckStatus = "live" | "die" | "invalid";

export interface CheckResult {
  /** 1-based position in the original input, for stable React keys. */
  index: number;
  email: string;
  status: CheckStatus;
  message?: string;
  checkedAt?: string;
}

/** Share of well-formed addresses simulated as active. */
const LIVE_RATIO = 0.62;

/**
 * Deterministic 32-bit string hash (djb2 xor variant). FNV-style hashes spread
 * short, similar addresses such as `user1@gmail.com` / `user2@gmail.com` far
 * enough apart to avoid clustering the whole list as live or dead.
 */
function hashAddress(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Classifies a single line. Pure and deterministic. */
export function classifyEmail(value: string): CheckStatus {
  if (!isValidGmail(value)) return "invalid";
  return hashAddress(value.trim().toLowerCase()) % 100 < LIVE_RATIO * 100
    ? "live"
    : "die";
}

/** Validates every non-empty line, preserving input order. */
export function checkGmailEmails(value: string): CheckResult[] {
  return splitLines(value).map((email, position) => ({
    index: position + 1,
    email,
    status: classifyEmail(email),
  }));
}

export interface CheckSummary {
  total: number;
  live: string[];
  die: string[];
  invalid: string[];
  liveCount: number;
  dieCount: number;
  invalidCount: number;
}

export function summarizeCheck(results: CheckResult[]): CheckSummary {
  const live: string[] = [];
  const die: string[] = [];
  const invalid: string[] = [];

  for (const result of results) {
    if (result.status === "live") live.push(result.email);
    else if (result.status === "die") die.push(result.email);
    else invalid.push(result.email);
  }

  return {
    total: results.length,
    live,
    die,
    invalid,
    liveCount: live.length,
    dieCount: die.length,
    invalidCount: invalid.length,
  };
}

export const checkStatusMeta: Record<
  CheckStatus,
  { label: string; tone: "success" | "danger" | "neutral" }
> = {
  live: { label: "LIVE", tone: "success" },
  die: { label: "UNREGISTERED", tone: "danger" },
  invalid: { label: "INVALID", tone: "neutral" },
};

/**
 * How many rows to reveal per animation tick. Long lists are revealed in
 * chunks so a 500-line paste still finishes in a couple of seconds instead of
 * taking half a minute.
 */
export function rowsPerTick(total: number, maxTicks = 40): number {
  if (total <= 0) return 0;
  return Math.max(1, Math.ceil(total / maxTicks));
}
