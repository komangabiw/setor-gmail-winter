"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();

  React.useEffect(() => {
    let resolved = false;

    const navigateHome = () => {
      if (!resolved) {
        resolved = true;
        try {
          localStorage.setItem("setorgmail_auth", "true");
        } catch {}
        // Full navigation to ensure all auth contexts re-initialize cleanly
        window.location.href = "/";
      }
    };

    // 1. Listen for auth state change (Supabase parses hash automatically with detectSessionInUrl)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigateHome();
      }
    });

    // 2. Check PKCE code in query search params if present
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (!error && data?.session?.user) {
          navigateHome();
        }
      });
    }

    // 3. Check if session is already present or extracted from hash fragment
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        navigateHome();
      }
    });

    // 4. Fallback timeout if no auth found after 3 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.location.href = "/";
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      listener?.subscription?.unsubscribe();
    };
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
