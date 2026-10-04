"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let resolved = false;

    const navigateHome = () => {
      if (!resolved) {
        resolved = true;
        try {
          localStorage.setItem("setorgmail_auth", "true");
        } catch {}
        window.location.href = "/";
      }
    };

    async function handleAuth() {
      try {
        // Parse both query search (?...) and hash fragment (#...)
        const searchParams = new URLSearchParams(window.location.search);
        const rawHash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);

        // Check for error in query or hash
        const error = hashParams.get("error") || searchParams.get("error");
        const errorDescription =
          hashParams.get("error_description") || searchParams.get("error_description");

        if (error || errorDescription) {
          console.error("[OAuth Error]", error, errorDescription);
          setErrorMessage(decodeURIComponent(errorDescription || error || "Otentikasi gagal."));
          setTimeout(() => {
            window.location.href = "/login";
          }, 3500);
          return;
        }

        // 1. If access_token & refresh_token are in hash (Implicit Grant)
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!setSessionError && data?.session?.user) {
            navigateHome();
            return;
          }
        }

        // 2. If code in query (PKCE flow)
        const code = searchParams.get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError && data?.session?.user) {
            navigateHome();
            return;
          }
        }

        // 3. Check existing session / onAuthStateChange
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          navigateHome();
          return;
        }

        // 4. Listen for auth change
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            navigateHome();
          }
        });

        // Timeout fallback after 3 seconds
        setTimeout(() => {
          if (!resolved) {
            navigateHome();
          }
        }, 3000);

        return () => {
          listener?.subscription?.unsubscribe();
        };
      } catch (err: any) {
        console.error("[Callback Exception]", err);
        setErrorMessage(err?.message || "Terjadi kesalahan saat memproses login.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3500);
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm">
        <Loader2 className="size-7 animate-spin" />
      </div>
      <p className="mt-4 text-base font-semibold text-ink-900">
        Menghubungkan akun Google...
      </p>
      {errorMessage ? (
        <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-3 max-w-sm">
          <p className="text-xs font-semibold text-rose-700">
            {errorMessage}
          </p>
          <p className="text-[11px] text-rose-500 mt-1">
            Mengalihkan kembali ke halaman login...
          </p>
        </div>
      ) : (
        <p className="mt-1 text-xs text-ink-500">
          Mohon tunggu sebentar, Anda akan dialihkan ke beranda.
        </p>
      )}
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
