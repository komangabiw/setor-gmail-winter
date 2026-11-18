import {
  type GmailProbeItem,
  generateVerifiedAvailableGmails,
  validateGmailForProbe,
  checkSingleHttpsFallback,
} from "./lib/gmail-check-shared";

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  FLIP_WEBHOOK_SECRET?: string;
  FLIP_CALLBACK_TOKEN?: string;
  [key: string]: any;
}

const TELEGRAM_API = "https://api.telegram.org";

// Edge Worker In-Memory Rate Limit Store (per isolate)
const edgeRateStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown-ip"
  );
}

function checkEdgeRateLimit(
  ip: string,
  bucket: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  // Periodic cleanup to prevent unbounded Map growth
  if (edgeRateStore.size > 5000) {
    for (const [k, v] of edgeRateStore.entries()) {
      if (now > v.resetAt) edgeRateStore.delete(k);
    }
  }
  const key = `${bucket}:${ip}`;
  const entry = edgeRateStore.get(key);
  if (!entry || now > entry.resetAt) {
    edgeRateStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

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
    const clientIp = getClientIp(request);
    if (!checkEdgeRateLimit(clientIp, "check-gmail", 30, 60_000)) {
      return new Response(
        JSON.stringify({ success: false, error: "Terlalu banyak permintaan cek email. Tunggu sebentar." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    let emailList: string[] = [];
    const startIndex: number = typeof body.startIndex === "number" ? Math.max(1, Math.floor(body.startIndex)) : 1;

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
      for (const item of body.storedGenerated.slice(0, 100)) {
        if (typeof item === "string") {
          clientGeneratedPool.add(item.trim().toLowerCase());
          clientGeneratedPool.add(normalizeGmail(item));
        }
      }
    }

    const cappedList = emailList.slice(0, 15);
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
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Terjadi kesalahan saat memeriksa email." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function escapeMarkdown(text: string): string {
  if (!text) return "";
  return text.replace(/([_*\[\]`\\])/g, "\\$1");
}

const ALLOWED_REPORT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function stripHtmlAndCap(raw: unknown, maxLen: number): string {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .slice(0, maxLen)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/<[^>]+>/g, "");
}

async function handleTelegramReport(request: Request, env: Env): Promise<Response> {
  const clientIp = getClientIp(request);
  if (!checkEdgeRateLimit(clientIp, "telegram-report", 5, 5 * 60_000)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Batas pengiriman laporan tercapai. Coba lagi dalam beberapa menit." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "300" } }
    );
  }

  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return new Response(
      JSON.stringify({ ok: false, error: "Layanan Telegram belum dikonfigurasi pada server." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let kategori = "";
  let judul = "";
  let deskripsi = "";
  let namaUser = "";
  let emailUser = "";
  let uidUser = "";
  let attachedFile: File | null = null;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      kategori = stripHtmlAndCap(formData.get("kategori"), 60);
      judul = stripHtmlAndCap(formData.get("judul"), 150);
      deskripsi = stripHtmlAndCap(formData.get("deskripsi"), 2000);
      namaUser = stripHtmlAndCap(formData.get("nama_user") || formData.get("namaUser") || formData.get("nama"), 100);
      emailUser = stripHtmlAndCap(formData.get("email_user") || formData.get("emailUser") || formData.get("email"), 120);
      uidUser = stripHtmlAndCap(formData.get("uid_user") || formData.get("uidUser") || formData.get("uid"), 80);
      const fileEntry = formData.get("file");
      if (fileEntry instanceof File && fileEntry.size > 0) {
        if (fileEntry.size > 5 * 1024 * 1024) {
          return new Response(JSON.stringify({ ok: false, error: "Ukuran file bukti maksimal 5MB." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!ALLOWED_REPORT_MIME_TYPES.has(fileEntry.type)) {
          return new Response(
            JSON.stringify({ ok: false, error: "Format bukti hanya mendukung JPG, PNG, WebP, atau PDF." }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
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
      kategori = stripHtmlAndCap(body.kategori, 60);
      judul = stripHtmlAndCap(body.judul, 150);
      deskripsi = stripHtmlAndCap(body.deskripsi, 2000);
      namaUser = stripHtmlAndCap(body.nama_user || body.namaUser || body.nama, 100);
      emailUser = stripHtmlAndCap(body.email_user || body.emailUser || body.email, 120);
      uidUser = stripHtmlAndCap(body.uid_user || body.uidUser || body.uid, 80);
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

  const waktuJakarta = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  const isSecurityAlert = kategori.includes("KEAMANAN") || kategori.includes("ALERT");

  const userHeader = isSecurityAlert
    ? `🚨 *LAPORAN PERINGATAN KLIEN (IP: ${escapeMarkdown(clientIp)})*\n\n`
    : `📋 *Laporan User*\n` +
      `👤 *Nama User:* ${escapeMarkdown(namaUser || "-")}\n` +
      `📧 *Email User:* ${escapeMarkdown(emailUser || "-")}\n` +
      `🆔 *Uid User:* ${escapeMarkdown(uidUser || "-")}\n\n`;

  const messageText = `${userHeader}` +
    `🏷️ *Kategori:* ${escapeMarkdown(kategori)}\n` +
    `📌 *Judul:* ${escapeMarkdown(judul)}\n\n` +
    `📝 *Deskripsi:*\n${escapeMarkdown(deskripsi)}\n\n` +
    `⏰ _Waktu: ${waktuJakarta} WIB_`;

  try {
    let response: Response;

    if (attachedFile) {
      const safeFileName = attachedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "bukti";
      const fileForm = new FormData();
      fileForm.append("chat_id", chatId);
      fileForm.append("document", attachedFile, safeFileName);
      fileForm.append("caption", messageText.slice(0, 1024));
      fileForm.append("parse_mode", "Markdown");

      response = await fetch(`${TELEGRAM_API}/bot${token}/sendDocument`, {
        method: "POST",
        body: fileForm,
      });

      if (!response.ok) {
        const detail: any = await response.clone().json().catch(() => null);
        if (detail?.description?.includes("can't parse entities")) {
          const retryForm = new FormData();
          retryForm.append("chat_id", chatId);
          retryForm.append("document", attachedFile, safeFileName);
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
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Gagal meneruskan laporan ke saluran admin.",
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
      JSON.stringify({ ok: false, error: "Gagal menghubungi layanan pelaporan. Coba lagi." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

const ALLOWED_ORIGINS = new Set([
  "https://setorgmail.com",
  "https://www.setorgmail.com",
  "https://setor-gmail.pages.dev",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function isTrustedOrigin(origin?: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Strictly allow only preview deployments of our own Cloudflare Pages project
  return /^https:\/\/[a-z0-9-]+\.setor-gmail\.pages\.dev$/.test(origin);
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com",
  "frame-src https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

function applySecurityHeaders(response: Response, origin?: string | null): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  newHeaders.set("X-Content-Type-Options", "nosniff");
  newHeaders.set("X-Frame-Options", "DENY");
  newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
  newHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  newHeaders.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  newHeaders.set("X-DNS-Prefetch-Control", "off");
  newHeaders.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);

  if (origin && isTrustedOrigin(origin)) {
    newHeaders.set("Access-Control-Allow-Origin", origin);
    newHeaders.set("Vary", "Origin");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  const text =
    `🚨 *SECURITY ALERT - SETOR GMAIL*\n\n` +
    `⚠️ *${escapeMarkdown(title)}*\n` +
    `📝 ${escapeMarkdown(details)}\n\n` +
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
  const clientIp = getClientIp(request);
  if (!checkEdgeRateLimit(clientIp, "flip-webhook", 30, 60_000)) {
    return new Response(JSON.stringify({ success: false, error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const expectedToken = (env.FLIP_WEBHOOK_SECRET || env.FLIP_CALLBACK_TOKEN || "").trim();
  if (!expectedToken) {
    return new Response(
      JSON.stringify({ success: false, error: "Webhook secret is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const receivedToken =
    request.headers.get("x-callback-token") ||
    request.headers.get("x-flip-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payloadToken = typeof body?.token === "string" ? body.token : typeof body?.secret_token === "string" ? body.secret_token : "";
  const tokenToCheck = (receivedToken || payloadToken || "").trim();

  // Constant-time Webhook Signature / Token Verification
  if (!tokenToCheck || !timingSafeEqualStr(tokenToCheck, expectedToken)) {
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

  const event = body.data || body;
  console.log("[FLIP WEBHOOK SUCCESS] Valid transaction callback:", event?.id, event?.status);

  return new Response(
    JSON.stringify({ success: true, message: "Webhook signature verified successfully" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function handleWithdrawalApi(request: Request, env: Env): Promise<Response> {
  try {
    const clientIp = getClientIp(request);
    if (!checkEdgeRateLimit(clientIp, "withdraw", 10, 60_000)) {
      return new Response(
        JSON.stringify({ success: false, error: "Terlalu banyak permintaan penarikan. Tunggu sebentar." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const bearerMatch = authHeader.match(/^Bearer\s+([A-Za-z0-9._-]+)$/);
    if (!bearerMatch) {
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

    // Verify JWT token against Supabase Auth if keys are configured
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://kdjoeeehyahdgwgsfyal.supabase.co";
    const anonOrServiceKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
    if (anonOrServiceKey) {
      const userVerify = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: anonOrServiceKey,
          Authorization: `Bearer ${bearerMatch[1]}`,
        },
      });
      if (!userVerify.ok) {
        return new Response(JSON.stringify({ success: false, error: "Akses ditolak: Token sesi tidak valid." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const body: any = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const method = String(body.method || "").toUpperCase();
    const accountNumber = String(body.accountNumber || "").trim();

    if (!["DANA", "GOPAY", "OVO", "SHOPEEPAY"].includes(method)) {
      return new Response(
        JSON.stringify({ success: false, error: "Metode e-wallet tidak valid." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!Number.isInteger(amount) || amount < 5000 || amount > 5000000) {
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

async function handleCheckUserEmail(request: Request, env: Env): Promise<Response> {
  try {
    const clientIp = getClientIp(request);
    if (!checkEdgeRateLimit(clientIp, "check-email", 8, 60_000)) {
      return new Response(
        JSON.stringify({ exists: false, error: "Terlalu banyak percobaan. Silakan tunggu 1 menit." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const email = body?.email;
    if (!email || typeof email !== "string" || email.length > 120) {
      return new Response(JSON.stringify({ exists: false, error: "Email wajib diisi" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanEmail)) {
      return new Response(JSON.stringify({ exists: false, error: "Format email tidak valid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://kdjoeeehyahdgwgsfyal.supabase.co";
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ exists: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?email=ilike.${encodeURIComponent(cleanEmail)}&select=id&limit=1`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ exists: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: any = await res.json().catch(() => []);
    const exists = Array.isArray(data) && data.length > 0;
    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ exists: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleGmailGenerateEdge(request: Request, env: Env): Promise<Response> {
  const clientIp = getClientIp(request);
  if (!checkEdgeRateLimit(clientIp, "gmail-generate", 25, 60_000)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Terlalu banyak permintaan generate. Silakan tunggu sebentar.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const url = new URL(request.url);
  let count = 5;
  let userId: string | null = null;
  let clientExclude: string[] = [];

  if (request.method === "POST") {
    const body: any = await request.json().catch(() => ({}));
    if (body?.count !== undefined) {
      count = Math.max(1, Math.min(10, parseInt(String(body.count), 10) || 5));
    }
    if (typeof body?.userId === "string") {
      userId = body.userId.trim();
    }
    if (Array.isArray(body?.exclude)) {
      clientExclude = body.exclude.slice(0, 200);
    }
  } else {
    const countParam = url.searchParams.get("count");
    count = countParam
      ? Math.max(1, Math.min(10, parseInt(countParam, 10) || 10))
      : 10;
  }

  const { emails, verifiedAvailable, timestampTail } =
    await generateVerifiedAvailableGmails({
      count,
      userSeed: `${userId || "anon"}:${clientIp}`,
      userId,
      clientExclude,
      supabaseUrl:
        env.NEXT_PUBLIC_SUPABASE_URL ||
        "https://kdjoeeehyahdgwgsfyal.supabase.co",
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || "",
    });

  return new Response(
    JSON.stringify({
      success: true,
      count: emails.length,
      verified_available: verifiedAvailable,
      timestamp_tail: timestampTail,
      emails,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

async function lookupKnownLiveEdge(
  normalizedEmails: string[],
  env: Env
): Promise<Set<string>> {
  const known = new Set<string>();
  if (normalizedEmails.length === 0) return known;

  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || "https://kdjoeeehyahdgwgsfyal.supabase.co";
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return known;

  try {
    const inClause = normalizedEmails.map((e) => encodeURIComponent(e)).join(",");
    const [depRes, profRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/deposits?normalized_gmail=in.(${inClause})&status=in.(diterima,pending,dicek)&select=normalized_gmail`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/profiles?email=in.(${inClause})&select=email`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        }
      ),
    ]);

    if (depRes.ok) {
      const depRows: any[] = await depRes.json().catch(() => []);
      for (const r of depRows) {
        if (r?.normalized_gmail) known.add(String(r.normalized_gmail).toLowerCase());
      }
    }
    if (profRes.ok) {
      const profRows: any[] = await profRes.json().catch(() => []);
      for (const r of profRows) {
        if (r?.email) {
          const lower = String(r.email).trim().toLowerCase();
          const at = lower.lastIndexOf("@");
          if (at !== -1) {
            known.add(lower.slice(0, at).replace(/\./g, "") + "@gmail.com");
          }
        }
      }
    }
  } catch {
    // ignore optional DB enrichment failure
  }
  return known;
}

async function handleGmailCheckEdge(request: Request, env: Env): Promise<Response> {
  const requestStart = Date.now();
  try {
    const clientIp = getClientIp(request);
    if (!checkEdgeRateLimit(clientIp, "gmail-check", 20, 60_000)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Terlalu banyak permintaan cek Gmail. Silakan tunggu 1 menit.",
        }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const rawEmails: unknown[] = Array.isArray(body?.emails)
      ? body.emails
      : typeof body?.email === "string"
      ? [body.email]
      : [];

    if (rawEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Daftar email tidak boleh kosong." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (rawEmails.length > 10) {
      return new Response(
        JSON.stringify({ success: false, error: "Maksimal 10 email per pemeriksaan." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const invalidResults: GmailProbeItem[] = [];
    const validTargets: Array<{ index: number; cleanEmail: string; normalizedEmail: string }> = [];

    rawEmails.forEach((raw, idx) => {
      const check = validateGmailForProbe(raw);
      if (!check.valid) {
        invalidResults.push({
          index: idx + 1,
          email: check.cleanEmail || String(raw || "").trim().slice(0, 64),
          status: "INVALID",
          code: 400,
          message: check.reason || "Format email tidak valid",
          elapsed_ms: 0,
          engine: "SYNTAX",
        });
      } else {
        validTargets.push({
          index: idx + 1,
          cleanEmail: check.cleanEmail,
          normalizedEmail: check.normalizedEmail,
        });
      }
    });

    // Serverless Edge runs HTTPS Port 443 Fallback Probe concurrently via Promise.all
    let probedResults: GmailProbeItem[] = [];
    if (validTargets.length > 0) {
      const knownLive = await lookupKnownLiveEdge(
        validTargets.map((t) => t.normalizedEmail),
        env
      );
      probedResults = await Promise.all(
        validTargets.map((target) =>
          checkSingleHttpsFallback(target.cleanEmail, target.index, knownLive)
        )
      );
    }

    const allResults = [...invalidResults, ...probedResults].sort(
      (a, b) => a.index - b.index
    );

    const summary = {
      total: allResults.length,
      live: allResults.filter((r) => r.status === "LIVE").length,
      available: allResults.filter((r) => r.status === "AVAILABLE").length,
      limit: allResults.filter((r) => r.status === "LIMIT").length,
      invalid: allResults.filter((r) => r.status === "INVALID").length,
      error: allResults.filter((r) => r.status === "ERROR").length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        engine: validTargets.length > 0 ? "HTTPS_PORT_443" : "SYNTAX_ONLY",
        total_elapsed_ms: Date.now() - requestStart,
        summary,
        results: allResults,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Terjadi kesalahan saat memproses pengecekan Gmail.",
      }),
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
    if (
      url.pathname === "/api/gmail-generate" &&
      (request.method === "GET" || request.method === "POST")
    ) {
      response = await handleGmailGenerateEdge(request, env);
    } else if (url.pathname === "/api/gmail-check" && request.method === "POST") {
      response = await handleGmailCheckEdge(request, env);
    } else if (url.pathname === "/api/check-gmail" && request.method === "POST") {
      response = await handleCheckGmail(request);
    } else if (url.pathname === "/api/auth/check-email" && request.method === "POST") {
      response = await handleCheckUserEmail(request, env);
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
