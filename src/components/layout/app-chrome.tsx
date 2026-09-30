"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

/**
 * Wraps every route and mounts the top bar and floating bottom navigation,
 * except on routes that opt out (e.g. the auth screen).
 */
export function AppChrome({
  children,
  hideNavOn = ["/login"],
}: {
  children: React.ReactNode;
  hideNavOn?: string[];
}) {
  const pathname = usePathname();
  const showNav = !hideNavOn.some((route) => pathname.startsWith(route));

  return (
    <>
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
    </>
  );
}
