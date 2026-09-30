/**
 * Telegram report message formatting.
 *
 * Kept out of `route.ts` because App Router only allows route handlers to be
 * exported from a route module — and because the exact message text is worth
 * asserting in a plain unit test.
 */

/** Telegram caps a message at 4096 characters. */
export const MAX_DESCRIPTION = 2000;
export const MAX_SUBJECT = 100;
export const MAX_CATEGORY = 50;

/**
 * Escapes Markdown control characters in user input.
 *
 * The message is sent with `parse_mode: "Markdown"`. Without this, a `*` or `_`
 * in a report would open or close emphasis and Telegram answers 400
 * "can't parse entities", failing the submission through no fault of the user.
 * The template's own `*bold*` markers are added after escaping, so they survive.
 */
export function escapeMarkdown(value: string): string {
  return value.replace(/([_*`[\]\\])/g, "\\$1");
}

export interface ReportFields {
  kategori: string;
  judul: string;
  deskripsi: string;
}

/** Builds the Markdown body posted to `sendMessage`. */
export function buildReportMessage({
  kategori,
  judul,
  deskripsi,
}: ReportFields): string {
  return [
    "----------------------------------------",
    "🚨 *LAPORAN BARU - SETOR GMAIL WINTER*",
    "----------------------------------------",
    `📁 *Kategori:* ${escapeMarkdown(kategori)}`,
    `📝 *Judul:* ${escapeMarkdown(judul)}`,
    "💬 *Deskripsi:*",
    escapeMarkdown(deskripsi),
    "----------------------------------------",
  ].join("\n");
}
