"use client";

import * as React from "react";
import { DashboardView } from "./dashboard-view";
import { LandingView } from "./landing-view";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { safeDecodeParam } from "@/lib/security";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let isSubscribed = true;

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const rawHash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(rawHash);
      const err =
        hashParams.get("error_description") ||
        searchParams.get("error_description") ||
        hashParams.get("error") ||
        searchParams.get("error");
      if (err) {
        toast.error("Gagal Login", {
          description: safeDecodeParam(err, 160) || "Sesi autentikasi gagal atau kedaluwarsa.",
        });
        // Clean sensitive error/token fragments from URL history
        try {
          window.history.replaceState(null, "", window.location.pathname);
        } catch {}
      }
    }

    async function checkAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            try {
              localStorage.setItem("setorgmail_auth", "true");
            } catch {}
            if (isSubscribed) setIsAuthenticated(true);
            return;
          }

          const localAuth =
            typeof window !== "undefined"
              ? localStorage.getItem("setorgmail_auth")
              : null;
          if (localAuth === "true") {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              if (isSubscribed) setIsAuthenticated(true);
              return;
            }
          }

          try {
            localStorage.removeItem("setorgmail_auth");
          } catch {}
          if (isSubscribed) setIsAuthenticated(false);
          return;
        }
        const localAuth = localStorage.getItem("setorgmail_auth");
        if (localAuth === "true") {
          if (isSubscribed) setIsAuthenticated(true);
          return;
        }
        if (isSubscribed) setIsAuthenticated(false);
      } catch {
        if (isSubscribed) setIsAuthenticated(false);
      }
    }

    checkAuth();

    let authListener: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          try {
            localStorage.setItem("setorgmail_auth", "true");
          } catch {}
          if (isSubscribed) setIsAuthenticated(true);
        } else if (event === "SIGNED_OUT") {
          try {
            localStorage.removeItem("setorgmail_auth");
          } catch {}
          if (isSubscribed) setIsAuthenticated(false);
        }
      });
      authListener = data.subscription;
    }

    return () => {
      isSubscribed = false;
      authListener?.unsubscribe?.();
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#07080d]">
        <div className="relative flex size-14 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
          <Loader2 className="size-7 animate-spin text-sky-400" />
        </div>
        <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase animate-pulse">
          Memuat Sesi Aman...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingView onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return <DashboardView />;
}
