"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LandingView } from "@/app/landing-view";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export function LoginViewClient() {
  const router = useRouter();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    async function verifyExistingAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            try {
              localStorage.setItem("setorgmail_auth", "true");
            } catch {}
            window.location.href = "/";
            return;
          }
        }
        const localAuth =
          typeof window !== "undefined"
            ? localStorage.getItem("setorgmail_auth")
            : null;
        if (localAuth === "true") {
          window.location.href = "/";
          return;
        }
      } catch (err) {
        console.warn("Auth check error in login page:", err);
      } finally {
        if (isMounted) setChecking(false);
      }
    }

    verifyExistingAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#09090b]">
        <Loader2 className="size-8 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <LandingView
      defaultModalMode="login"
      onAuthSuccess={() => {
        window.location.href = "/";
      }}
    />
  );
}
