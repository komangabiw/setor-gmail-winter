"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Wallet,
  History,
  ShieldCheck,
  Scale,
  Trophy,
  Gift,
  FileText,
  ChevronRight,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { PageShell, Reveal } from "@/components/layout/page-shell";
import { RulesModal } from "./setor/rules-modal";
import { TarikSaldoModal } from "./saldo/tarik-saldo-modal";
import {
  quickMenuItems,
  type QuickMenuIconName,
} from "@/lib/mock-data";
import {
  getCurrentAuthUser,
  fetchUserWallet,
} from "@/lib/supabase";
import { cn, formatIDR } from "@/lib/utils";
import { useUserProfile } from "@/context/user-profile-context";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<QuickMenuIconName, LucideIcon> = {
  send: Send,
  scale: Scale,
  "shield-check": ShieldCheck,
  trophy: Trophy,
  gift: Gift,
  "file-text": FileText,
};

const quickMenuThemes: Record<
  string,
  {
    bgGradient: string;
    shadow: string;
    hoverShadow: string;
  }
> = {
  setor: {
    bgGradient: "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600",
    shadow: "shadow-md shadow-sky-500/25",
    hoverShadow: "group-hover:shadow-sky-500/40",
  },
  rules: {
    bgGradient: "bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600",
    shadow: "shadow-md shadow-purple-500/25",
    hoverShadow: "group-hover:shadow-purple-500/40",
  },
  checker: {
    bgGradient: "bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600",
    shadow: "shadow-md shadow-teal-500/25",
    hoverShadow: "group-hover:shadow-teal-500/40",
  },
  leaderboard: {
    bgGradient: "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500",
    shadow: "shadow-md shadow-amber-500/25",
    hoverShadow: "group-hover:shadow-amber-500/40",
  },
  referral: {
    bgGradient: "bg-gradient-to-br from-pink-400 via-rose-500 to-rose-600",
    shadow: "shadow-md shadow-rose-500/25",
    hoverShadow: "group-hover:shadow-rose-500/40",
  },
  laporan: {
    bgGradient: "bg-gradient-to-br from-cyan-400 via-cyan-500 to-sky-600",
    shadow: "shadow-md shadow-cyan-500/25",
    hoverShadow: "group-hover:shadow-cyan-500/40",
  },
};

export function DashboardView() {
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const [tarikModalOpen, setTarikModalOpen] = React.useState(false);
  const {
    wallet,
    stats: userStats,
    isWalletLoading,
    isStatsLoading,
    refreshWallet,
  } = useUserProfile();

  const handleMenuClick = (label: string, href: string) => {
    if (href.startsWith("/")) return;
    toast.info(`Menu "${label}"`, {
      description: "Fitur sedang dalam proses integrasi.",
    });
  };

  return (
    <PageShell>
      {/* Hero row: balance card + setor CTA (stacked on mobile, 2 cols on desktop) */}
      <div className="pt-4 sm:pt-6 grid gap-4 md:gap-5 lg:grid-cols-2 lg:items-stretch">
        {/* Balance card */}
        <Reveal delay={60}>
          <Card className="relative h-full overflow-hidden">
            {/* Decorative gradient wash */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-gradient-to-br from-sky-200/60 to-brand-200/40 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 -left-20 size-56 rounded-full bg-sky-100/80 blur-2xl"
            />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold tracking-wide text-ink-500 uppercase">
                    Saldo Kamu
                  </p>
                  {isWalletLoading ? (
                    <div className="mt-2 py-0.5">
                      <Skeleton className="h-8 w-36 rounded-lg" />
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[2rem] leading-none font-bold tracking-tight text-ink-900 tabular-nums sm:text-[2.35rem] md:text-[2.6rem]">
                      {formatIDR(wallet.balance)}
                    </p>
                  )}
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-brand-600 text-white shadow-md">
                  <Wallet className="size-5" strokeWidth={2.2} aria-hidden="true" />
                </span>
              </div>

              {/* Harga / Gmail tanpa ikon dan tanpa badge Min. Tarik */}
              <div className="mt-3.5 flex items-center">
                <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-[0.75rem] font-semibold text-sky-700">
                  Harga / Gmail: Rp4.500
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTarikModalOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 px-4 text-[0.98rem] font-medium text-white shadow-sm shadow-brand-600/20 transition-[transform,box-shadow,background-color] duration-300 ease-out hover:bg-brand-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 active:scale-[0.995]"
                >
                  <Wallet className="size-4" aria-hidden="true" />
                  Tarik Saldo
                </button>
                <Link
                  href="/riwayat"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white px-4 text-[0.98rem] font-medium text-ink-800 shadow-sm transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out hover:bg-slate-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 active:scale-[0.995]"
                >
                  <History className="size-4" aria-hidden="true" />
                  Riwayat
                </Link>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Setor CTA */}
        <Reveal delay={110}>
          <Link
            href="/setor"
            className="group flex h-full flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-sky-400 to-brand-600 p-5 text-white shadow-float transition-[transform,box-shadow] duration-300 ease-out hover:shadow-[0_14px_36px_-8px_rgb(2_132_199/0.45)] active:scale-[0.99] sm:p-6"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[0.68rem] font-bold tracking-wide uppercase">
                <Sparkles className="size-3" aria-hidden="true" />
                Aksi Cepat
              </span>
              <p className="mt-3 text-lg leading-tight font-bold sm:text-xl">
                Siap Setor Gmail?
              </p>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-white/85">
                Generate Gmail dan kirim sekarang. Proses cepat, saldo langsung masuk setelah
                dicek.
              </p>
            </div>
            <span className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 py-3 text-[0.85rem] font-semibold transition-colors duration-300 group-hover:bg-white/25">
              Mulai Setor Sekarang
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 ease-out group-hover:translate-x-1">
                <ChevronRight className="size-4" aria-hidden="true" />
              </span>
            </span>
          </Link>
        </Reveal>
      </div>

      {/* Status summary — sama persis dengan tabel statistik di tab Profil (Total Setoran, Diterima, Ditolak, Pending) */}
      <Reveal delay={140} className="mt-5">
        <SectionHeading
          title="Ringkasan Status"
          subtitle="Pantau aktivitas setoran kamu"
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total Setoran */}
          <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-sky-200/80 bg-sky-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
            {isStatsLoading ? (
              <div className="flex flex-col items-center py-0.5 w-full">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-7 w-12 mt-1.5" />
              </div>
            ) : (
              <>
                <p className="text-[0.68rem] font-bold tracking-wider text-sky-800 uppercase text-center">
                  Total Setoran
                </p>
                <p className="mt-1 text-2xl font-black text-sky-700 tabular-nums sm:text-3xl text-center">
                  {userStats.total}
                </p>
              </>
            )}
          </div>

          {/* Diterima */}
          <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
            {isStatsLoading ? (
              <div className="flex flex-col items-center py-0.5 w-full">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-7 w-12 mt-1.5" />
              </div>
            ) : (
              <>
                <p className="text-[0.68rem] font-bold tracking-wider text-emerald-800 uppercase text-center">
                  Diterima
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-600 tabular-nums sm:text-3xl text-center">
                  {userStats.diterima}
                </p>
              </>
            )}
          </div>

          {/* Ditolak */}
          <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
            {isStatsLoading ? (
              <div className="flex flex-col items-center py-0.5 w-full">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-7 w-12 mt-1.5" />
              </div>
            ) : (
              <>
                <p className="text-[0.68rem] font-bold tracking-wider text-rose-800 uppercase text-center">
                  Ditolak
                </p>
                <p className="mt-1 text-2xl font-black text-rose-600 tabular-nums sm:text-3xl text-center">
                  {userStats.ditolak}
                </p>
              </>
            )}
          </div>

          {/* Pending */}
          <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
            {isStatsLoading ? (
              <div className="flex flex-col items-center py-0.5 w-full">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-7 w-12 mt-1.5" />
              </div>
            ) : (
              <>
                <p className="text-[0.68rem] font-bold tracking-wider text-amber-800 uppercase text-center">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-black text-amber-600 tabular-nums sm:text-3xl text-center">
                  {userStats.pending}
                </p>
              </>
            )}
          </div>
        </div>
      </Reveal>

      {/* Quick menu grid */}
      <Reveal delay={180} className="mt-7">
        <SectionHeading
          title="Menu Cepat"
          subtitle="Akses fitur utama saja"
          icon={<Sparkles className="size-4" aria-hidden="true" />}
        />
        {/* Quick menu card wrapper */}
        <div className="mt-4 rounded-3xl border border-slate-100/90 bg-white p-4 sm:p-5 shadow-card">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {quickMenuItems.map((item, index) => {
              const Icon = iconMap[item.iconName];
              const theme = quickMenuThemes[item.key] || {
                bgGradient: "bg-gradient-to-br from-sky-400 to-blue-600",
                shadow: "shadow-md shadow-sky-500/25",
                hoverShadow: "group-hover:shadow-sky-500/40",
              };

              const inner = (
                <>
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl text-white transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-90 sm:size-14 md:rounded-[1.2rem]",
                      theme.bgGradient,
                      theme.shadow,
                      theme.hoverShadow,
                    )}
                  >
                    <Icon
                      className="size-5 sm:size-6 stroke-[2.2]"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-2 text-center text-[0.68rem] leading-tight font-bold text-ink-700 transition-colors duration-200 group-hover:text-ink-950 sm:text-[0.74rem]">
                    {item.label}
                  </span>
                </>
              );
              const style = { animationDelay: `${200 + index * 30}ms` };
              const shared =
                "group flex min-w-0 flex-col items-center justify-center rounded-2xl py-2 px-1 transition-all duration-200 hover:bg-slate-50/70 active:scale-95 animate-fade-up";

              if (item.action === "rules") {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRulesOpen(true)}
                    aria-haspopup="dialog"
                    className={cn(shared)}
                    style={style}
                  >
                    {inner}
                  </button>
                );
              }

              return item.href.startsWith("/") ? (
                <Link key={item.key} href={item.href} className={cn(shared)} style={style}>
                  {inner}
                </Link>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleMenuClick(item.label, item.href)}
                  className={cn(shared)}
                  style={style}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <TarikSaldoModal
        open={tarikModalOpen}
        onClose={() => setTarikModalOpen(false)}
        onSuccess={refreshWallet}
        balance={wallet.balance}
        minimum={wallet.minimumWithdrawal}
      />
    </PageShell>
  );
}
