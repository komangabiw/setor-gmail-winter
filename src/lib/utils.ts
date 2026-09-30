import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** "Rp4.000" — no space between prefix and digits. */
export function formatIDR(value: number): string {
  return `Rp${formatRupiah(value)}`;
}

/** Indonesian 3-letter month abbreviations, as used by the mock timestamps. */
const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

/**
 * "13 Jan 2026, 19:20"
 *
 * Deliberately avoids `Intl.DateTimeFormat("id-ID")` + string surgery. Its
 * output is implementation dependent: Node and Chromium disagree on the
 * hour/minute separator (`19.20` vs `19. 20`), which caused a server/client
 * hydration mismatch on /saldo and /riwayat. Building the string from
 * `formatToParts` and pinning the zone to WIB makes the markup identical no
 * matter where it runs.
 */
export function formatDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const month = MONTHS_ID[Number(get("month")) - 1] ?? get("month");

  return `${get("day")} ${month} ${get("year")}, ${get("hour")}:${get("minute")}`;
}
