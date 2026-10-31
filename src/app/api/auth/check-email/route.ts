import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") {
      return NextResponse.json({ exists: false, error: "Email wajib diisi" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kdjoeeehyahdgwgsfyal.supabase.co";
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
      return NextResponse.json({ exists: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exists: Boolean(data && data.length > 0) });
  } catch (err: any) {
    return NextResponse.json({ exists: false, error: err?.message }, { status: 500 });
  }
}

