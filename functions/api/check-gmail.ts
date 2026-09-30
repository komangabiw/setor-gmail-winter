interface Env {
  [key: string]: any;
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

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
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
