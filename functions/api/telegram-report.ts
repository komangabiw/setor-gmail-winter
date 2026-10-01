interface Env {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  [key: string]: any;
}

const TELEGRAM_API = "https://api.telegram.org";
const DEFAULT_CHAT_ID = "-1003715736899";
const DEFAULT_BOT_TOKEN = atob("ODg3ODgzOTUxNDpBQUZNR3JMcjNhU09NeGdFWjdLUXdoanh5TkdUdkhXRlhERQ==");

function normalise(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normaliseMultiline(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const token = context.env.TELEGRAM_BOT_TOKEN?.trim() || DEFAULT_BOT_TOKEN;
  const chatId = context.env.TELEGRAM_CHAT_ID?.trim() || DEFAULT_CHAT_ID;

  if (!token) {
    return new Response(
      JSON.stringify({ ok: false, error: "Layanan Telegram belum dikonfigurasi." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let kategori = "";
  let judul = "";
  let deskripsi = "";
  let attachedFile: File | null = null;

  const contentType = context.request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await context.request.formData();
      kategori = normalise(formData.get("kategori"), 64);
      judul = normalise(formData.get("judul"), 120);
      deskripsi = normaliseMultiline(formData.get("deskripsi"), 2000);
      const fileEntry = formData.get("file");
      if (fileEntry instanceof File && fileEntry.size > 0) {
        attachedFile = fileEntry;
      }
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Data formulir tidak valid." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    try {
      const body: any = await context.request.json();
      kategori = normalise(body.kategori, 64);
      judul = normalise(body.judul, 120);
      deskripsi = normaliseMultiline(body.deskripsi, 2000);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "JSON tidak valid." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (!kategori || !judul || !deskripsi) {
    return new Response(
      JSON.stringify({ ok: false, error: "Kategori, judul, dan deskripsi wajib diisi." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const messageText = `📬 *LAPORAN PENGGUNA BARU*\n\n` +
    `🏷️ *Kategori:* ${kategori}\n` +
    `📌 *Judul:* ${judul}\n\n` +
    `📝 *Deskripsi:*\n${deskripsi}\n\n` +
    `⏰ _Waktu: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB_`;

  try {
    let response: Response;

    if (attachedFile) {
      const fileForm = new FormData();
      fileForm.append("chat_id", chatId);
      fileForm.append("document", attachedFile, attachedFile.name);
      fileForm.append("caption", messageText.slice(0, 1024));
      fileForm.append("parse_mode", "Markdown");

      response = await fetch(`${TELEGRAM_API}/bot${token}/sendDocument`, {
        method: "POST",
        body: fileForm,
      });
    } else {
      response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: "Markdown",
        }),
      });
    }

    if (!response.ok) {
      const detail: any = await response.json().catch(() => null);
      return new Response(
        JSON.stringify({
          ok: false,
          error: detail?.description || "Telegram menolak laporan.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Gagal menghubungi Telegram. Coba lagi." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
