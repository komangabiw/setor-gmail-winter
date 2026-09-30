"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, Wallet, User, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

const leftItems: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/checker", label: "Checker", icon: ShieldCheck },
];

const rightItems: NavItem[] = [
  { href: "/saldo", label: "Saldo", icon: Wallet },
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
        "group relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[0.62rem] font-semibold transition-colors duration-300 ease-out",
        active ? "text-brand-600" : "text-ink-400 hover:text-ink-600",
      )}
    >
      <span className="flex items-center justify-center">
        <Icon
          className={cn(
            "size-[1.35rem] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-90",
            active && "scale-105",
          )}
          strokeWidth={active ? 2.4 : 2}
          aria-hidden="true"
        />
      </span>
      <span className="leading-none">{item.label}</span>
    </Link>
  );
}

/** Floating bottom navigation: Beranda · Riwayat · [Setor] · Saldo · Profil */
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
          {/* Elevated circular Setor button */}
          <Link
            href="/setor"
            aria-label="Setor"
            aria-current={setorActive ? "page" : undefined}
            className={cn(
              "group absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[58%] rounded-full p-[5px] shadow-float transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
              setorActive
                ? "bg-gradient-to-br from-brand-500 to-brand-700"
                : "bg-gradient-to-br from-sky-400 to-brand-600",
            )}
          >
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-full text-white transition-colors duration-300 sm:size-14",
                "bg-gradient-to-br from-sky-400 to-brand-600 group-hover:from-sky-300 group-hover:to-brand-500",
                setorActive && "from-transparent to-transparent",
              )}
            >
              <Send
                className="size-[1.35rem] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </span>
          </Link>

          <div className="flex items-center gap-1 rounded-[1.75rem] border border-white/70 bg-white/85 px-2 pt-2.5 pb-2 shadow-nav backdrop-blur-xl sm:gap-2 sm:px-3">
            {leftItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            {/* Centre slot: mirrors the NavLink box (py-2 + icon row + gap-1 + label)
                so "Setor" lands on the same baseline as the other four labels. */}
            <div
              className="flex w-14 shrink-0 flex-col items-center gap-1 py-2 sm:w-16"
              aria-hidden="true"
            >
              <span className="size-[1.35rem]" />
              <span
                className={cn(
                  "text-[0.62rem] font-semibold leading-none transition-colors duration-300",
                  setorActive ? "text-brand-600" : "text-ink-400",
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
