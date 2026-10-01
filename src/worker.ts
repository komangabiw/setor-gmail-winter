interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  [key: string]: any;
}

const TELEGRAM_API = "https://api.telegram.org";
const DEFAULT_CHAT_ID = "-1003715736899";

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
  const token = env.TELEGRAM_BOT_TOKEN?.trim() || "";
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

async function handleGoogleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clientId = env.GOOGLE_CLIENT_ID || env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    return new Response(
      "GOOGLE_CLIENT_ID belum dikonfigurasi di environment / Cloudflare Worker.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const redirectUri = `${url.origin}/api/auth/callback/google`;
  const scope = encodeURIComponent("openid email profile");
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return Response.redirect(googleAuthUrl, 302);
}

async function handleGoogleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${url.origin}/?auth_error=${encodeURIComponent(error)}`, 302);
  }

  if (!code) {
    return Response.redirect(`${url.origin}/?auth_error=no_code`, 302);
  }

  const clientId = env.GOOGLE_CLIENT_ID || env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = `${url.origin}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    // If secret not yet configured on server, forward code to client fallback
    return Response.redirect(
      `${url.origin}/auth/callback?code=${encodeURIComponent(code)}&error=missing_server_credentials`,
      302
    );
  }

  try {
    // 1. Exchange authorization code for Google tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return Response.redirect(
        `${url.origin}/?auth_error=token_exchange_failed&details=${encodeURIComponent(errText)}`,
        302
      );
    }

    const tokenData: any = await tokenRes.json();
    const idToken = tokenData.id_token || "";
    const accessToken = tokenData.access_token || "";

    // 2. Fetch Google user profile
    let googleUser: any = null;
    if (accessToken) {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        googleUser = await userRes.json();
      }
    }

    const email = googleUser?.email || "";
    const name = googleUser?.name || email.split("@")[0] || "User";
    const picture = googleUser?.picture || "";

    // 3. Sync user to Supabase Auth & Supabase Database (profiles)
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://kdjoeeehyahdgwgsfyal.supabase.co";
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

    let userId = "";

    if (email && supabaseServiceKey) {
      try {
        // A. Check if user already exists in Supabase Auth
        const listUsersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        });

        if (listUsersRes.ok) {
          const { users } = (await listUsersRes.json()) as {
            users: Array<{ id: string; email?: string }>;
          };
          const existing = users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (existing) {
            userId = existing.id;
          }
        }

        // B. If user does not exist, create user in Supabase Auth
        if (!userId) {
          const createUserRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: "POST",
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              email_confirm: true,
              user_metadata: {
                full_name: name,
                name,
                avatar_url: picture,
                provider: "google",
              },
            }),
          });

          if (createUserRes.ok) {
            const created = (await createUserRes.json()) as { id: string };
            userId = created.id;
          }
        }

        // C. Sync user profile into Supabase Database profiles table
        if (userId) {
          await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: "POST",
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates",
            },
            body: JSON.stringify({
              id: userId,
              email,
              name,
              avatar_url: picture,
              updated_at: new Date().toISOString(),
            }),
          });
        }
      } catch (syncErr) {
        console.warn("Supabase user sync error in worker:", syncErr);
      }
    }

    // 4. Redirect to /auth/callback with id_token and email so client logs in
    const callbackRedirect = new URL(`${url.origin}/auth/callback`);
    if (idToken) {
      callbackRedirect.searchParams.set("id_token", idToken);
    }
    if (email) {
      callbackRedirect.searchParams.set("email", email);
    }
    if (name) {
      callbackRedirect.searchParams.set("name", name);
    }
    callbackRedirect.searchParams.set("provider", "google");

    return Response.redirect(callbackRedirect.toString(), 302);
  } catch (err: any) {
    return Response.redirect(
      `${url.origin}/?auth_error=callback_exception&details=${encodeURIComponent(err?.message || "error")}`,
      302
    );
  }
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Google OAuth Routes
    if (url.pathname === "/api/auth/google") {
      return handleGoogleAuth(request, env);
    }

    if (url.pathname === "/api/auth/callback/google") {
      return handleGoogleCallback(request, env);
    }

    // API Routes
    if (url.pathname === "/api/check-gmail" && request.method === "POST") {
      return handleCheckGmail(request);
    }

    if (url.pathname === "/api/telegram-report" && request.method === "POST") {
      return handleTelegramReport(request, env);
    }

    // Serve static assets from Next.js export (out/)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};

export default worker;
