"use client";

import * as React from "react";
import { DashboardView } from "./dashboard-view";
import { AuthCard } from "./login/auth-card";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let isSubscribed = true;

    async function checkAuth() {
      try {
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            if (isSubscribed) setIsAuthenticated(true);
            return;
          }
        }
        // Fallback check
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
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-sky-50/60 to-white">
        <Loader2 className="size-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthCard onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <DashboardView />;
}
