"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, ShieldCheck, User, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

const leftItems: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/riwayat", label: "Riwayat", icon: History },
];

const rightItems: NavItem[] = [
  { href: "/checker", label: "Checker", icon: ShieldCheck },
  { href: "/profil", label: "Profil", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[0.63rem] font-semibold transition-all duration-300 ease-out focus-visible:outline-none",
        active
          ? "text-sky-300 border border-sky-400/35 bg-gradient-to-b from-sky-400/18 to-sky-500/5 shadow-[0_0_18px_rgba(56,189,248,0.28)] font-bold"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"
        />
      )}
      <span className="flex items-center justify-center">
        <Icon
          className={cn(
            "size-[1.32rem] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-90",
            active
              ? "scale-110 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              : "text-zinc-400 group-hover:text-zinc-200 group-hover:-translate-y-0.5",
          )}
          strokeWidth={active ? 2.4 : 2}
          aria-hidden="true"
        />
      </span>
      <span className="leading-none tracking-tight">{item.label}</span>
    </Link>
  );
}

/** Floating bottom navigation: Beranda · Riwayat · [Setor] · Checker · Profil */
export function BottomNav() {
  const pathname = usePathname();
  const setorActive = isActive(pathname, "/setor");

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 pointer-events-none px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:px-6"
    >
      <div className="mx-auto w-full max-w-md pointer-events-auto">
        <div className="relative">
          {/* Elevated circular Setor button with ambient pulse ring */}
          <Link
            href="/setor"
            aria-label="Setor Gmail"
            aria-current={setorActive ? "page" : undefined}
            className={cn(
              "group absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[58%] rounded-full p-[4px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95",
              setorActive
                ? "bg-gradient-to-tr from-sky-300 via-cyan-400 to-blue-600 shadow-[0_0_32px_rgba(56,189,248,0.75)]"
                : "bg-gradient-to-tr from-sky-400 via-sky-500 to-blue-600 shadow-[0_0_24px_rgba(56,189,248,0.5)]",
            )}
          >
            {/* Outer subtle pulse halo */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-full border border-sky-400/35 animate-pulse"
            />
            <span
              className={cn(
                "relative flex size-12 items-center justify-center rounded-full text-white transition-all duration-300 sm:size-14",
                "bg-gradient-to-tr from-sky-500 via-sky-400 to-blue-600 group-hover:from-sky-400 group-hover:to-blue-500 shadow-inner",
              )}
            >
              <Send
                className="size-[1.35rem] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2.3}
                aria-hidden="true"
              />
            </span>
          </Link>

          <div className="flex items-center gap-1 rounded-[1.85rem] border border-white/[0.12] bg-[#101118]/92 px-2 pt-2.5 pb-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl sm:gap-2 sm:px-3">
            {leftItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            {/* Centre slot */}
            <div
              className="flex w-14 shrink-0 flex-col items-center gap-1 py-2 sm:w-16"
              aria-hidden="true"
            >
              <span className="size-[1.32rem]" />
              <span
                className={cn(
                  "text-[0.63rem] font-semibold leading-none tracking-tight transition-colors duration-300",
                  setorActive ? "text-sky-300 font-extrabold" : "text-zinc-300",
                )}
              >
                Setor
              </span>
            </div>
            {rightItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
