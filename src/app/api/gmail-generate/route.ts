import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security";
import {
  generateGmailCandidates,
  generateVerifiedAvailableGmails,
} from "@/lib/gmail-check-shared";

// Required so `next build` with `output: "export"` succeeds cleanly;
// POST is always dynamic in Next.js, and Cloudflare Worker (`src/worker.ts`)
// dynamically handles both GET and POST at the edge.
export const dynamic = "force-static";

export async function GET() {
  const { emails, timestampTail } = generateGmailCandidates(10);

  return NextResponse.json(
    {
      success: true,
      count: emails.length,
      verified_available: true,
      timestamp_tail: timestampTail,
      emails,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local-ip";

  const rate = checkRateLimit(`gmail-generate:${ip}`, 25, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak permintaan generate. Silakan tunggu sebentar." },
      { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const count = body?.count
    ? Math.max(1, Math.min(10, parseInt(String(body.count), 10) || 5))
    : 5;
  const userId = typeof body?.userId === "string" ? body.userId.trim() : null;
  const clientExclude = Array.isArray(body?.exclude) ? body.exclude.slice(0, 200) : [];

  const { emails, verifiedAvailable, timestampTail } =
    await generateVerifiedAvailableGmails({
      count,
      userSeed: `${userId || "anon"}:${ip}`,
      userId,
      clientExclude,
      supabaseUrl:
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        "https://kdjoeeehyahdgwgsfyal.supabase.co",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    });

  return NextResponse.json(
    {
      success: true,
      count: emails.length,
      verified_available: verifiedAvailable,
      timestamp_tail: timestampTail,
      emails,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
