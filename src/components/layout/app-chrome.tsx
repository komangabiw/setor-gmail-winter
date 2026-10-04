"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { UserProfileProvider } from "@/context/user-profile-context";

const PUBLIC_ROUTES = ["/login", "/auth/callback"];

/**
 * Wraps every route, provides route protection, and mounts the top bar
 * and floating bottom navigation for authenticated sessions.
 */
export function AppChrome({
  children,
  hideNavOn = ["/login", "/auth/callback"],
}: {
  children: React.ReactNode;
  hideNavOn?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            if (active) setIsAuthenticated(true);
            return;
          }
          try {
            localStorage.removeItem("setorgmail_auth");
          } catch {}
          if (active) setIsAuthenticated(false);
          return;
        }
        const localAuth = localStorage.getItem("setorgmail_auth");
        if (localAuth === "true") {
          if (active) setIsAuthenticated(true);
          return;
        }
        if (active) setIsAuthenticated(false);
      } catch {
        if (active) setIsAuthenticated(false);
      }
    }

    checkAuth();

    let sub: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          try {
            localStorage.setItem("setorgmail_auth", "true");
          } catch {}
          if (active) setIsAuthenticated(true);
        } else {
          try {
            localStorage.removeItem("setorgmail_auth");
          } catch {}
          if (active) setIsAuthenticated(false);
        }
      });
      sub = data.subscription;
    }

    return () => {
      active = false;
      sub?.unsubscribe?.();
    };
  }, [pathname]);

  // Route protection: redirect unauthenticated users to /login on internal routes
  React.useEffect(() => {
    if (isAuthenticated === false) {
      const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) || pathname === "/";
      if (!isPublic) {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, pathname, router]);

  // Hide nav on auth routes or homepage when not authenticated
  const isAuthScreen =
    hideNavOn.some((route) => pathname.startsWith(route)) ||
    (pathname === "/" && isAuthenticated === false);

  const showNav = !isAuthScreen;

  return (
    <UserProfileProvider>
      {showNav && <TopBar />}
      {children}
      <div
        className={cn(
          "transition-opacity duration-300",
          showNav ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {showNav && <BottomNav />}
      </div>
    </UserProfileProvider>
  );
}
