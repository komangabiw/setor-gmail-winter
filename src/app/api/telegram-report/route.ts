import { NextResponse } from "next/server";
import {
  MAX_CATEGORY,
  MAX_DESCRIPTION,
  MAX_SUBJECT,
  buildReportMessage,
} from "@/lib/telegram";

/**
 * POST /api/telegram-report
 *
 * Forwards a support report to a Telegram channel through the Bot API.
 *
 * Body: `{ kategori, judul, deskripsi }`
 *
 * The bot token is read from `TELEGRAM_BOT_TOKEN` and never leaves the server.
 * Error responses are sanitised: Telegram echoes nothing secret, but its
 * request URL contains the token, so the raw upstream body is never forwarded
 * verbatim — only the human-readable `description`.
 */

const TELEGRAM_API = "https://api.telegram.org";
const DEFAULT_CHAT_ID = "-1003715736899";

/** The placeholder from the docs, so a missing token fails loudly not silently. */
const TOKEN_PLACEHOLDER = "<TOKEN_BOT_ANDA>";

const REQUEST_TIMEOUT_MS = 60_000;

type ReportPayload = {
  kategori?: unknown;
  judul?: unknown;
  deskripsi?: unknown;
};

/** Trims, coerces to string and drops control characters. */
function normalise(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Description keeps its newlines — it is the only multi-line field. */
function normaliseMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || DEFAULT_CHAT_ID;

  if (!token || token === TOKEN_PLACEHOLDER) {
    console.error(
      "[telegram-report] TELEGRAM_BOT_TOKEN is not configured. Set it in .env.local",
    );
    return NextResponse.json(
      { ok: false, error: "Layanan Telegram belum dikonfigurasi. Coba lagi nanti." },
      { status: 503 },
    );
  }

  let kategoriRaw: unknown = "";
  let judulRaw: unknown = "";
  let deskripsiRaw: unknown = "";
  let attachedFile: File | null = null;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      kategoriRaw = formData.get("kategori");
      judulRaw = formData.get("judul");
      deskripsiRaw = formData.get("deskripsi");
      const fileEntry = formData.get("file");
      if (fileEntry instanceof File && fileEntry.size > 0) {
        attachedFile = fileEntry;
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Data formulir tidak valid." },
        { status: 400 },
      );
    }
  } else {
    try {
      const body = (await request.json()) as ReportPayload;
      kategoriRaw = body.kategori;
      judulRaw = body.judul;
      deskripsiRaw = body.deskripsi;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Body permintaan harus berupa JSON yang valid." },
        { status: 400 },
      );
    }
  }

  const kategori = normalise(kategoriRaw, MAX_CATEGORY);
  const judul = normalise(judulRaw, MAX_SUBJECT);
  const deskripsi = normaliseMultiline(deskripsiRaw, MAX_DESCRIPTION);

  const missing = [
    !kategori && "kategori",
    !judul && "judul",
    !deskripsi && "deskripsi",
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Field wajib tidak boleh kosong: ${missing.join(", ")}.` },
      { status: 400 },
    );
  }

  const messageText = buildReportMessage({
    kategori,
    judul,
    deskripsi,
  });

  try {
    let response: Response;

    if (attachedFile) {
      // Telegram caption limit is 1024 characters for sendDocument
      let captionText = messageText;
      if (captionText.length > 1024) {
        const safeDesc = deskripsi.slice(0, 700) + "...";
        captionText = buildReportMessage({
          kategori,
          judul,
          deskripsi: safeDesc,
        });
        if (captionText.length > 1024) {
          captionText = captionText.slice(0, 1020) + "...";
        }
      }

      try {
        const fileForm = new FormData();
        fileForm.append("chat_id", chatId);
        fileForm.append("document", attachedFile, attachedFile.name);
        fileForm.append("caption", captionText);
        fileForm.append("parse_mode", "Markdown");

        response = await fetch(`${TELEGRAM_API}/bot${token}/sendDocument`, {
          method: "POST",
          body: fileForm,
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        // If markdown entity parsing failed on caption, retry without parse_mode
        if (!response.ok) {
          const detail = await response.clone().json().catch(() => null);
          if (detail?.description?.includes("can't parse entities")) {
            const fallbackForm = new FormData();
            fallbackForm.append("chat_id", chatId);
            fallbackForm.append("document", attachedFile, attachedFile.name);
            fallbackForm.append("caption", captionText.replace(/[*_`[\]\\]/g, ""));
            response = await fetch(`${TELEGRAM_API}/bot${token}/sendDocument`, {
              method: "POST",
              body: fallbackForm,
              cache: "no-store",
              signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
          }
        }
      } catch (fileErr) {
        console.warn(
          "[telegram-report] sendDocument failed or timed out. Falling back to sendMessage text:",
          fileErr,
        );
        // Fallback: send text report to Telegram so the user report is not lost
        const fallbackText = `${messageText}\n\n⚠️ _[Lampiran ${attachedFile.name} (${Math.round(attachedFile.size / 1024)} KB) tidak dapat terunggah ke Telegram karena batas waktu jaringan]_`;
        response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: fallbackText,
            parse_mode: "Markdown",
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(20_000),
        });
      }
    } else {
      response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: "Markdown",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
    }

    if (!response.ok) {
      const detail = await response
        .json()
        .then((payload: { description?: string }) => payload?.description)
        .catch(() => undefined);

      console.error(`[telegram-report] Telegram error ${response.status}: ${detail ?? "-"}`);
      return NextResponse.json(
        {
          ok: false,
          error:
            detail ??
            "Telegram menolak laporan. Periksa konfigurasi bot dan channel.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    console.error("[telegram-report] Request to Telegram failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: isTimeout
          ? "Telegram tidak merespons tepat waktu. Coba lagi."
          : "Gagal menghubungi Telegram. Coba lagi.",
      },
      { status: 502 },
    );
  }
}
