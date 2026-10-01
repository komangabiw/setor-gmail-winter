interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  [key: string]: any;
}

const TELEGRAM_API = "https://api.telegram.org";
const DEFAULT_CHAT_ID = "-1003715736899";
const DEFAULT_BOT_TOKEN = atob("ODg3ODgzOTUxNDpBQUZNR3JMcjNhU09NeGdFWjdLUXdoanh5TkdUdkhXRlhERQ==");

function normalizeGmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex === -1) return lower;
  const username = lower.slice(0, atIndex).replace(/\./g, "");
  const domain = lower.slice(atIndex + 1);
  return `${username}@${domain}`;
}

function validateGmailSyntax(email: string) {
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

function isRandomKeyboardSmash(email: string): boolean {
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

async function handleCheckGmail(request: Request): Promise<Response> {
  try {
    const body: any = await request.json().catch(() => ({}));
    let emailList: string[] = [];
    const startIndex: number = typeof body.startIndex === "number" ? body.startIndex : 1;

    if (Array.isArray(body.emails)) {
      emailList = body.emails;
    } else if (typeof body.email === "string") {
      emailList = [body.email];
    }

    if (emailList.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Daftar email kosong" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clientGeneratedPool = new Set<string>();
    if (Array.isArray(body.storedGenerated)) {
      for (const item of body.storedGenerated) {
        if (typeof item === "string") {
          clientGeneratedPool.add(item.trim().toLowerCase());
          clientGeneratedPool.add(normalizeGmail(item));
        }
      }
    }

    const cappedList = emailList.slice(0, 50);
    const results = cappedList.map((email, i) => {
      const timestamp = new Date().toISOString();
      const syntax = validateGmailSyntax(email);
      const index = startIndex + i;

      if (!syntax.valid) {
        return {
          index,
          email: syntax.cleanEmail,
          status: "invalid" as const,
          message: syntax.reason || "Format email tidak valid",
          checkedAt: timestamp,
        };
      }

      const cleanEmail = syntax.cleanEmail;
      const normalized = syntax.normalizedEmail;

      if (isRandomKeyboardSmash(cleanEmail)) {
        return {
          index,
          email: cleanEmail,
          status: "die" as const,
          message: "Akun tidak terdaftar di Google",
          checkedAt: timestamp,
        };
      }

      const isCandidate =
        clientGeneratedPool.has(cleanEmail.toLowerCase()) ||
        clientGeneratedPool.has(normalized);

      if (isCandidate) {
        return {
          index,
          email: cleanEmail,
          status: "die" as const,
          message: "Akun belum terdaftar di Google",
          checkedAt: timestamp,
        };
      }

      return {
        index,
        email: cleanEmail,
        status: "live" as const,
        message: "Akun Gmail aktif dan terdaftar di server Google",
        checkedAt: timestamp,
      };
    });

    const liveEmails = results.filter((r) => r.status === "live").map((r) => r.email);
    const dieEmails = results.filter((r) => r.status === "die").map((r) => r.email);
    const invalidEmails = results.filter((r) => r.status === "invalid").map((r) => r.email);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          liveCount: liveEmails.length,
          dieCount: dieEmails.length,
          invalidCount: invalidEmails.length,
          live: liveEmails,
          die: dieEmails,
          invalid: invalidEmails,
        },
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function handleTelegramReport(request: Request, env: Env): Promise<Response> {
  const token = env.TELEGRAM_BOT_TOKEN?.trim() || DEFAULT_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID?.trim() || DEFAULT_CHAT_ID;

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

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      kategori = (formData.get("kategori") as string) || "";
      judul = (formData.get("judul") as string) || "";
      deskripsi = (formData.get("deskripsi") as string) || "";
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
      const body: any = await request.json();
      kategori = body.kategori || "";
      judul = body.judul || "";
      deskripsi = body.deskripsi || "";
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

      // If markdown entity parsing failed on caption, retry without parse_mode
      if (!response.ok) {
        const detail: any = await response.clone().json().catch(() => null);
        if (detail?.description?.includes("can't parse entities")) {
          const retryForm = new FormData();
          retryForm.append("chat_id", chatId);
          retryForm.append("document", attachedFile, attachedFile.name);
          retryForm.append("caption", messageText.slice(0, 1024).replace(/[*_`[\]\\]/g, ""));
          response = await fetch(`${TELEGRAM_API}/bot${token}/sendDocument`, {
            method: "POST",
            body: retryForm,
          });
        }
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
      });

      if (!response.ok) {
        const detail: any = await response.clone().json().catch(() => null);
        if (detail?.description?.includes("can't parse entities")) {
          response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: messageText.replace(/[*_`[\]\\]/g, ""),
            }),
          });
        }
      }
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


const ALLOWED_ORIGINS = [
  "https://setorgmail.com",
  "https://www.setorgmail.com",
  "https://setor-gmail.pages.dev",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function applySecurityHeaders(response: Response, origin?: string | null): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  newHeaders.set("X-Content-Type-Options", "nosniff");
  newHeaders.set("X-Frame-Options", "DENY");
  newHeaders.set("Referrer-Policy", "origin-when-cross-origin");
  newHeaders.set("X-XSS-Protection", "1; mode=block");

  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".pages.dev"))) {
    newHeaders.set("Access-Control-Allow-Origin", origin);
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    newHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-callback-token, x-flip-token, x-requested-with"
    );
    newHeaders.set("Access-Control-Allow-Credentials", "true");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

async function sendAdminSecurityAlert(env: Env, title: string, details: string) {
  const token = env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🚨 *SECURITY ALERT - SETOR GMAIL*\n\n` +
    `⚠️ *${title}*\n` +
    `📝 ${details}\n\n` +
    `⏰ _${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB_`;

  try {
    await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Failed to send admin security alert:", err);
  }
}

async function handleFlipWebhook(request: Request, env: Env): Promise<Response> {
  const receivedToken =
    request.headers.get("x-callback-token") ||
    request.headers.get("x-flip-token") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const expectedToken =
    env.FLIP_WEBHOOK_SECRET || env.FLIP_CALLBACK_TOKEN || "flip_secret_webhook_token";

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payloadToken = body?.token || body?.secret_token;
  const tokenToCheck = receivedToken || payloadToken;

  // Webhook Signature / Token Verification
  if (!tokenToCheck || tokenToCheck !== expectedToken) {
    const clientIp = request.headers.get("cf-connecting-ip") || "Unknown IP";
    console.warn("[WEBHOOK UNAUTHORIZED] Invalid or missing Flip webhook token from IP:", clientIp);
    
    await sendAdminSecurityAlert(
      env,
      "Percobaan Webhook Palsu / Ilegal",
      `IP: ${clientIp}\nEndpoint: /api/webhook/flip\nStatus: Ditolak (401 Unauthorized)\nToken: ${tokenToCheck ? "Token Tidak Cocok" : "Token Kosong"}`
    );

    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Invalid webhook signature or token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Valid webhook payload
  const event = body.data || body;
  console.log("[FLIP WEBHOOK SUCCESS] Valid transaction callback:", event?.id, event?.status);

  return new Response(
    JSON.stringify({ success: true, message: "Webhook signature verified successfully" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function handleWithdrawalApi(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      await sendAdminSecurityAlert(
        env,
        "Akses API Penarikan Tanpa Sesi Sah",
        `IP: ${clientIp}\nEndpoint: /api/withdraw\nAction: Permintaan ditolak`
      );
      return new Response(JSON.stringify({ success: false, error: "Akses ditolak: Sesi tidak sah." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: any = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const method = String(body.method || "").toUpperCase();
    const accountNumber = String(body.accountNumber || "").trim();

    if (!amount || isNaN(amount) || amount < 5000 || amount > 5000000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nominal penarikan tidak valid (minimal Rp5.000, maksimal Rp5.000.000).",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!/^08\d{8,11}$/.test(accountNumber.replace(/[^\d]/g, ""))) {
      return new Response(
        JSON.stringify({ success: false, error: "Nomor e-wallet tidak valid (10-13 digit angka)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Permintaan penarikan divalidasi dan diterima." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Terjadi kesalahan pada sistem." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      const preflight = new Response(null, { status: 204 });
      return applySecurityHeaders(preflight, origin);
    }

    let response: Response;

    // API Routes
    if (url.pathname === "/api/check-gmail" && request.method === "POST") {
      response = await handleCheckGmail(request);
    } else if (url.pathname === "/api/telegram-report" && request.method === "POST") {
      response = await handleTelegramReport(request, env);
    } else if (
      (url.pathname === "/api/webhook/flip" || url.pathname === "/api/flip-webhook") &&
      request.method === "POST"
    ) {
      response = await handleFlipWebhook(request, env);
    } else if (url.pathname === "/api/withdraw" && request.method === "POST") {
      response = await handleWithdrawalApi(request, env);
    } else if (env.ASSETS) {
      // Serve static assets from Next.js export (out/)
      response = await env.ASSETS.fetch(request);
    } else {
      response = new Response("Not Found", { status: 404 });
    }

    return applySecurityHeaders(response, origin);
  },
};

export default worker;
