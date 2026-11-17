"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Wallet,
  History,
  ShieldCheck,
  Scale,
  FileText,
  ChevronRight,
  Send,
  Sparkles,
  CheckCircle2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { StatusSummaryGrid, type StatusCardItem } from "@/components/ui/status-summary-cards";
import { PageShell, Reveal } from "@/components/layout/page-shell";
import { RulesModal } from "./setor/rules-modal";
import { TarikSaldoModal } from "./saldo/tarik-saldo-modal";
import {
  quickMenuItems,
  type QuickMenuIconName,
} from "@/lib/mock-data";
import { cn, formatIDR } from "@/lib/utils";
import { useUserProfile } from "@/context/user-profile-context";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<QuickMenuIconName, LucideIcon> = {
  send: Send,
  scale: Scale,
  "shield-check": ShieldCheck,
  "file-text": FileText,
};

const quickMenuThemes: Record<
  string,
  {
    bgGradient: string;
    shadow: string;
    hoverShadow: string;
    caption: string;
  }
> = {
  setor: {
    bgGradient: "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600",
    shadow: "shadow-lg shadow-sky-500/30",
    hoverShadow: "group-hover:shadow-sky-500/50",
    caption: "Kirim Akun",
  },
  rules: {
    bgGradient: "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600",
    shadow: "shadow-lg shadow-fuchsia-500/25",
    hoverShadow: "group-hover:shadow-fuchsia-500/45",
    caption: "Aturan Wajib",
  },
  checker: {
    bgGradient: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600",
    shadow: "shadow-lg shadow-emerald-500/25",
    hoverShadow: "group-hover:shadow-emerald-500/45",
    caption: "Cek Live",
  },
  laporan: {
    bgGradient: "bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500",
    shadow: "shadow-lg shadow-cyan-500/25",
    hoverShadow: "group-hover:shadow-cyan-500/45",
    caption: "Bantuan CS",
  },
};

export function DashboardView() {
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const [tarikModalOpen, setTarikModalOpen] = React.useState(false);
  const {
    userProfile,
    wallet,
    stats: userStats,
    siteConfig,
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

  const pricePerGmail = siteConfig?.price_per_gmail || 4500;
  const minWithdrawal = siteConfig?.min_withdrawal || wallet.minimumWithdrawal || 5000;
  const withdrawProgress = Math.min(100, Math.round((wallet.balance / Math.max(1, minWithdrawal)) * 100));
  const isReadyToWithdraw = wallet.balance >= minWithdrawal;

  const firstName = React.useMemo(() => {
    const raw = (userProfile?.name || "").trim();
    if (!raw || raw === "-" || raw === "Pengguna") return "Sobat";
    return raw.split(/\s+/)[0];
  }, [userProfile?.name]);

  const dashboardStatusItems: StatusCardItem[] = React.useMemo(
    () => [
      {
        title: "Total Setoran",
        value: userStats.total,
        bg: "bg-zinc-950",
        svgType: "circles",
      },
      {
        title: "Diterima",
        value: userStats.diterima,
        bg: "bg-emerald-600",
        svgType: "blur2",
      },
      {
        title: "Di Cek",
        value: userStats.pending,
        bg: "bg-sky-600",
        svgType: "blur4",
      },
      {
        title: "Ditolak",
        value: userStats.ditolak,
        bg: "bg-rose-600",
        svgType: "blur3",
      },
    ],
    [userStats],
  );

  return (
    <PageShell>
      <div className="flex flex-col justify-center min-h-[calc(100dvh-10rem)] py-5 sm:py-8">
        <div className="w-full my-auto space-y-5 sm:space-y-6">
          {/* Welcome & Security Strip */}
          <Reveal delay={30}>
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-0.5">
              <div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Halo,{" "}
                  <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    {firstName}
                  </span>{" "}
                  👋
                </h1>
                <p className="text-[0.73rem] text-zinc-400">
                  Siap ubah akun Gmail baru jadi saldo cair hari ini?
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-950/40 px-3 py-1 text-[0.68rem] font-bold text-emerald-300 backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
                <span>Proteksi Akun Aktif</span>
              </div>
            </div>
          </Reveal>

          {/* Hero row: balance card + setor CTA */}
          <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:items-stretch">
            {/* Balance card */}
            <Reveal delay={60}>
              <Card className="relative h-full overflow-hidden border-white/12 bg-gradient-to-b from-[#151824]/92 via-[#11131c]/95 to-[#0c0d14]/95 shadow-2xl backdrop-blur-2xl">
                {/* Top specular line */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"
                />
                {/* Decorative gradient wash */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-16 size-60 rounded-full bg-sky-500/15 blur-3xl"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-28 -left-20 size-56 rounded-full bg-indigo-500/12 blur-3xl"
                />

                <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.7rem] font-bold tracking-widest text-zinc-400 uppercase">
                          Saldo Dompet Kamu
                        </p>
                        {isWalletLoading ? (
                          <div className="mt-2 py-0.5">
                            <Skeleton className="h-9 w-40 rounded-lg bg-zinc-800" />
                          </div>
                        ) : (
                          <p className="mt-1.5 text-[2.1rem] leading-none font-black tracking-tight text-white tabular-nums sm:text-[2.45rem] md:text-[2.65rem] drop-shadow-[0_2px_18px_rgba(56,189,248,0.18)]">
                            {formatIDR(wallet.balance)}
                          </p>
                        )}
                      </div>
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/35 ring-1 ring-white/20">
                        <Wallet className="size-5.5" strokeWidth={2.2} aria-hidden="true" />
                      </span>
                    </div>

                    {/* Rate & E-Wallet badges */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/12 border border-sky-400/30 px-3 py-1 text-[0.73rem] font-bold text-sky-300">
                        <Zap className="size-3.5 text-sky-400 fill-sky-400/30" />
                        <span>Harga / Gmail: {formatIDR(pricePerGmail)}</span>
                      </div>
                      <div className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[0.68rem] font-semibold text-zinc-300">
                        DANA · GoPay · OVO · ShopeePay
                      </div>
                    </div>

                    {/* Withdrawal readiness progress bar */}
                    <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/35 px-3.5 py-2.5">
                      <div className="flex items-center justify-between text-[0.68rem] font-semibold">
                        <span className={cn(isReadyToWithdraw ? "text-emerald-300 font-bold" : "text-zinc-400")}>
                          {isReadyToWithdraw ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="size-3.5 text-emerald-400" />
                              Saldo siap dicairkan kapan saja!
                            </span>
                          ) : (
                            `Min. penarikan ${formatIDR(minWithdrawal)}`
                          )}
                        </span>
                        <span className="font-mono font-bold text-sky-300 tabular-nums">
                          {withdrawProgress}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            isReadyToWithdraw
                              ? "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                              : "bg-gradient-to-r from-sky-400 to-blue-500"
                          )}
                          style={{ width: `${Math.max(6, withdrawProgress)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTarikModalOpen(true)}
                      className="btn-shimmer inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 px-4 text-[0.92rem] font-bold text-white shadow-lg shadow-sky-500/30 transition-all duration-300 ease-out hover:from-sky-300 hover:to-blue-500 hover:shadow-sky-500/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 active:scale-[0.99] cursor-pointer"
                    >
                      <Wallet className="size-4" aria-hidden="true" />
                      Tarik Saldo
                    </button>
                    <Link
                      href="/riwayat"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 text-[0.92rem] font-bold text-zinc-200 shadow-sm transition-all duration-300 ease-out hover:bg-white/10 hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 active:scale-[0.99]"
                    >
                      <History className="size-4 text-sky-400" aria-hidden="true" />
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
                className="group relative flex h-full flex-col justify-between gap-4 rounded-3xl border border-sky-400/20 bg-gradient-to-br from-[#131826]/95 via-[#121521]/95 to-[#0b0d14]/95 p-5 text-white shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-out hover:border-sky-400/45 hover:shadow-[0_20px_50px_-12px_rgba(56,189,248,0.22)] active:scale-[0.995] sm:p-6 overflow-hidden"
              >
                {/* Top specular line */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
                />
                {/* Ambient Sky Glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 -right-12 size-52 rounded-full bg-sky-500/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-80"
                />

                <div className="relative min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/35 bg-sky-500/15 px-2.5 py-1 text-[0.68rem] font-extrabold tracking-wide uppercase text-sky-300">
                      <Sparkles className="size-3 text-sky-400" aria-hidden="true" />
                      Aksi Cepat
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[0.68rem] font-extrabold text-emerald-300">
                      +{formatIDR(pricePerGmail)} / Akun
                    </span>
                  </div>

                  <p className="mt-3 text-lg leading-tight font-black sm:text-xl text-white tracking-tight">
                    Siap Setor Gmail?
                  </p>
                  <p className="mt-1 text-[0.78rem] leading-relaxed text-zinc-300">
                    Generate Gmail dan setor sekarang. Proses cepat, saldo langsung masuk setelah Gmail diterima.
                  </p>

                  {/* Visual 3-Step Micro Guide so users immediately understand */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2">
                    {[
                      { num: "01", label: "Generate Nama" },
                      { num: "02", label: "Daftar Google" },
                      { num: "03", label: "Setor & Cair" },
                    ].map((st) => (
                      <div
                        key={st.num}
                        className="rounded-xl border border-white/10 bg-black/35 px-2.5 py-2 text-left transition-colors group-hover:border-sky-400/20"
                      >
                        <span className="block font-mono text-[0.62rem] font-black text-sky-400">
                          STEP {st.num}
                        </span>
                        <span className="mt-0.5 block truncate text-[0.68rem] font-bold text-zinc-200">
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <span className="btn-shimmer relative flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 px-4 py-3 text-[0.86rem] font-extrabold text-white shadow-lg shadow-sky-500/35 transition-all duration-300 group-hover:from-sky-300 group-hover:to-blue-500">
                  <span>Mulai Setor Sekarang</span>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform duration-300 ease-out group-hover:translate-x-1">
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </Reveal>
          </div>

          {/* Status summary */}
          <Reveal delay={140} className="mt-5">
            <SectionHeading
              title="Ringkasan Status"
              subtitle="Pantau progres verifikasi setoran kamu secara real-time"
              icon={<ShieldCheck className="size-4 text-sky-400" aria-hidden="true" />}
            />
            <StatusSummaryGrid items={dashboardStatusItems} isLoading={isStatsLoading} />
          </Reveal>

          {/* Quick menu grid */}
          <Reveal delay={180} className="mt-6">
            <SectionHeading
              title="Menu Cepat"
              subtitle="Pintasan fitur utama dalam 1 ketukan"
              icon={<Sparkles className="size-4 text-sky-400" aria-hidden="true" />}
            />
            <div className="mt-3.5 rounded-3xl border border-white/10 bg-[#11131c]/88 p-3.5 sm:p-5 shadow-2xl backdrop-blur-2xl">
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {quickMenuItems.map((item, index) => {
                  const Icon = iconMap[item.iconName];
                  const theme = quickMenuThemes[item.key] || {
                    bgGradient: "bg-gradient-to-br from-sky-400 to-blue-600",
                    shadow: "shadow-lg shadow-sky-500/25",
                    hoverShadow: "group-hover:shadow-sky-500/45",
                    caption: "Fitur",
                  };

                  const inner = (
                    <>
                      <span
                        className={cn(
                          "flex size-12 items-center justify-center rounded-2xl text-white ring-1 ring-white/20 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95 sm:size-14 md:rounded-[1.2rem]",
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
                      <span className="mt-2.5 text-center text-[0.72rem] leading-tight font-extrabold text-white transition-colors duration-200 group-hover:text-sky-300 sm:text-[0.8rem]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 hidden sm:block text-center text-[0.65rem] font-medium text-zinc-400">
                        {theme.caption}
                      </span>
                    </>
                  );
                  const style = { animationDelay: `${200 + index * 30}ms` };
                  const shared =
                    "group flex flex-1 min-w-0 flex-col items-center justify-center rounded-2xl py-2.5 px-1.5 transition-all duration-200 hover:bg-white/[0.05] border border-transparent hover:border-white/10 active:scale-95 animate-fade-up cursor-pointer";

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
        </div>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <TarikSaldoModal
        open={tarikModalOpen}
        onClose={() => setTarikModalOpen(false)}
        onSuccess={refreshWallet}
        balance={wallet.balance}
        minimum={minWithdrawal}
      />
    </PageShell>
  );
}
