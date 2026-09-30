"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      try {
        if (supabase) {
          // 1. If code parameter exists in URL search params (PKCE flow)
          const params = new URLSearchParams(window.location.search);
          const code = params.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          } else {
            // 2. If access_token in hash fragment or session already stored
            await supabase.auth.getSession();
          }
        }
      } catch (err) {
        console.warn("Auth callback processing error:", err);
      } finally {
        router.replace("/");
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm">
        <Loader2 className="size-7 animate-spin" />
      </div>
      <p className="mt-4 text-base font-semibold text-ink-900">
        Menghubungkan akun Google...
      </p>
      <p className="mt-1 text-xs text-ink-500">
        Mohon tunggu sebentar, Anda akan dialihkan ke beranda.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="size-7 animate-spin text-sky-600" />
        </div>
      }
    >
      <CallbackHandler />
    </React.Suspense>
  );
}
