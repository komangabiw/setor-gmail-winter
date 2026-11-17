import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security";
import { generateGmailCandidates } from "@/lib/gmail-check-shared";

// Required so `next build` with `output: "export"` succeeds cleanly;
// in Cloudflare production, `src/worker.ts` intercepts `GET /api/gmail-generate` dynamically before static assets.
export const dynamic = "force-static";

export async function GET() {
  const { emails, timestampTail } = generateGmailCandidates(10);

  return NextResponse.json(
    {
      success: true,
      count: emails.length,
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

  const rate = checkRateLimit(`gmail-generate:${ip}`, 30, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: "Terlalu banyak permintaan generate. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const count = body?.count
    ? Math.max(1, Math.min(10, parseInt(String(body.count), 10) || 10))
    : 10;
  const { emails, timestampTail } = generateGmailCandidates(count);

  return NextResponse.json(
    {
      success: true,
      count: emails.length,
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
