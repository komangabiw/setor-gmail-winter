export const SETOR_LATEST_GENERATED_KEY = "setor_latest_generated_gmails_v1";
export const SETOR_SUBMITTED_GMAILS_KEY = "setor_submitted_gmails_v1";
export const SETOR_CHECK_STATUS_KEY = "setor_email_check_status_v1";

/**
 * Retrieves the currently active generated emails from the Setor page.
 * Returns only the exact batch currently generated in Setor (e.g. 6 akun),
 * never the accumulated history.
 */
export function getStoredGeneratedGmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const rawLatest = localStorage.getItem(SETOR_LATEST_GENERATED_KEY);
    if (rawLatest) {
      const parsed = JSON.parse(rawLatest);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((e) => typeof e === "string" && e.trim().length > 0);
      }
    }
  } catch {
    // ignore parsing errors
  }
  return [];
}

/**
 * Saves the current active generated batch to localStorage.
 */
export function saveStoredGeneratedGmails(emails: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETOR_LATEST_GENERATED_KEY, JSON.stringify(emails));
  } catch {
    // ignore
  }
}

/**
 * Retrieves all submitted/deposited Gmails.
 */
export function getStoredSubmittedGmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SETOR_SUBMITTED_GMAILS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((e) => typeof e === "string" && e.trim().length > 0);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Saves submitted/deposited Gmails to localStorage.
 */
export function saveStoredSubmittedGmails(emails: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETOR_SUBMITTED_GMAILS_KEY, JSON.stringify(emails));
  } catch {
    // ignore
  }
}

/**
 * Retrieves cached check statuses for generated emails (LIVE / UNREGISTERED).
 */
export function getStoredCheckStatusMap(): Record<string, "LIVE" | "UNREGISTERED"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SETOR_CHECK_STATUS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Saves cached check statuses for generated emails to localStorage.
 */
export function saveStoredCheckStatusMap(map: Record<string, "LIVE" | "UNREGISTERED">): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETOR_CHECK_STATUS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export const SETOR_EWALLET_PREF_KEY = "setor_ewallet_preference_v1";

export interface StoredEWalletData {
  defaultMethod: "DANA" | "OVO" | "GOPAY" | "SHOPEEPAY";
  accounts: {
    DANA: string;
    OVO: string;
    GOPAY: string;
    SHOPEEPAY: string;
  };
}

export function getStoredEWalletData(): StoredEWalletData {
  const fallback: StoredEWalletData = {
    defaultMethod: "DANA",
    accounts: {
      DANA: "",
      OVO: "",
      GOPAY: "",
      SHOPEEPAY: "",
    },
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(SETOR_EWALLET_PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const rawAccounts = (parsed.accounts || {}) as Record<string, string>;
        const cleanAccounts: Record<string, string> = {};
        for (const [k, v] of Object.entries(rawAccounts)) {
          const s = typeof v === "string" ? v.trim() : "";
          cleanAccounts[k] = (s === "081234567890" || s === "08123456789") ? "" : s;
        }
        return {
          defaultMethod: "DANA",
          accounts: {
            ...fallback.accounts,
            ...cleanAccounts,
          },
        };
      }
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function saveStoredEWalletData(data: StoredEWalletData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETOR_EWALLET_PREF_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

