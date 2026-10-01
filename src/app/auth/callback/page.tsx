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
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

        const idToken = params.get("id_token") || hashParams.get("id_token");
        const code = params.get("code") || hashParams.get("code");
        const email = params.get("email") || hashParams.get("email");

        // 1. Direct Google Auth ID token session creation
        if (idToken && supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: idToken,
            });
            if (data?.session) {
              try {
                localStorage.setItem("setorgmail_auth", "true");
              } catch {}
              router.replace("/");
              return;
            }
            if (error) {
              console.warn("Supabase signInWithIdToken error:", error);
            }
          } catch (e) {
            console.warn("signInWithIdToken exception:", e);
          }
        }

        // 2. PKCE code exchange if code parameter exists
        if (code && supabase) {
          try {
            const { data } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.session) {
              try {
                localStorage.setItem("setorgmail_auth", "true");
              } catch {}
              router.replace("/");
              return;
            }
          } catch (e) {
            console.warn("exchangeCodeForSession exception:", e);
          }
        }

        // 3. Check existing session or email confirmation
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            try {
              localStorage.setItem("setorgmail_auth", "true");
            } catch {}
            router.replace("/");
            return;
          }
        }

        if (email) {
          try {
            localStorage.setItem("setorgmail_auth", "true");
          } catch {}
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
