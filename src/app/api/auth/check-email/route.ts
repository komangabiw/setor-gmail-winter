import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "local-ip";

    const rate = checkRateLimit(`check-email:${ip}`, 8, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { exists: false, error: "Terlalu banyak percobaan. Silakan tunggu 1 menit." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string" || email.length > 120) {
      return NextResponse.json({ exists: false, error: "Email wajib diisi" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanEmail)) {
      return NextResponse.json({ exists: false, error: "Format email tidak valid" }, { status: 400 });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kdjoeeehyahdgwgsfyal.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json({ exists: true });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", cleanEmail)
      .limit(1);

    if (error) {
      return NextResponse.json(
        { exists: false, error: "Gagal memeriksa ketersediaan email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ exists: Boolean(data && data.length > 0) });
  } catch {
    return NextResponse.json(
      { exists: false, error: "Terjadi kesalahan sistem." },
      { status: 500 }
    );
  }
}
