"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn, formatIDR } from "@/lib/utils";
import { type SiteConfig, DEFAULT_SITE_CONFIG } from "@/lib/supabase";
import {
  LogIn,
  UserPlus,
  Zap,
  Banknote,
  ShieldCheck,
  Users,
  Clock,
  Wrench,
  PlayCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', var(--font-sans), sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --foreground: #f8fafc;
  --background: #07080d;
  --primary: #38bdf8;
  --secondary: #818cf8;
  --destructive: #ef4444;
  --muted-foreground: #a1a1aa;
  --border: rgba(255, 255, 255, 0.1);

  --pill-bg-1: rgba(255, 255, 255, 0.06);
  --pill-bg-2: rgba(255, 255, 255, 0.02);
  --pill-shadow: rgba(0, 0, 0, 0.65);
  --pill-highlight: rgba(255, 255, 255, 0.16);
  --pill-inset-shadow: rgba(0, 0, 0, 0.6);
  --pill-border: rgba(255, 255, 255, 0.1);
  
  --pill-bg-1-hover: rgba(255, 255, 255, 0.11);
  --pill-bg-2-hover: rgba(255, 255, 255, 0.04);
  --pill-border-hover: rgba(56, 189, 248, 0.4);
  --pill-shadow-hover: rgba(0, 0, 0, 0.85);
  --pill-highlight-hover: rgba(255, 255, 255, 0.28);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(0.98); opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.95; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes float-subtle-1 {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-7px) rotate(0.7deg); }
}

@keyframes float-subtle-2 {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(7px) rotate(-0.7deg); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 30s linear infinite;
  display: flex;
  width: max-content;
  will-change: transform;
}

.animate-float-1 {
  animation: float-subtle-1 5s ease-in-out infinite;
}

.animate-float-2 {
  animation: float-subtle-2 6s ease-in-out infinite;
}

.footer-bg-grid {
  background-size: 52px 52px;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.038) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.038) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(56, 189, 248, 0.18) 0%, 
    rgba(99, 102, 241, 0.12) 42%, 
    transparent 72%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 12px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  color: var(--foreground);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: #ffffff;
}

.footer-primary-cta {
  background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 45%, #2563eb 100%);
  box-shadow:
    0 14px 34px -6px rgba(14, 165, 233, 0.55),
    inset 0 1px 1px rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(125, 211, 252, 0.45);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  color: #ffffff;
}

.footer-primary-cta:hover {
  box-shadow:
    0 20px 44px -6px rgba(56, 189, 248, 0.72),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  filter: brightness(1.06);
}

.footer-giant-bg-text {
  font-size: clamp(3.1rem, 15vw, 13rem);
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.075);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.11) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
  pointer-events: none;
  user-select: none;
}

.footer-text-glow {
  background: linear-gradient(180deg, #ffffff 15%, rgba(226, 232, 240, 0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 24px rgba(255, 255, 255, 0.18));
}

.floating-showcase-card {
  background: linear-gradient(180deg, rgba(22, 24, 33, 0.9) 0%, rgba(13, 14, 20, 0.94) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.11);
  box-shadow:
    0 24px 52px -12px rgba(0, 0, 0, 0.78),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transition: all 0.35s ease;
}

.floating-showcase-card:hover {
  border-color: rgba(56, 189, 248, 0.35);
  box-shadow:
    0 28px 56px -12px rgba(56, 189, 248, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window !== "undefined") {
        const element = localRef.current;
        if (!element) return;

        const ctx = gsap.context(() => {
          const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const h = rect.width / 2;
            const w = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - w;

            gsap.to(element, {
              x: x * 0.28,
              y: y * 0.28,
              rotationX: -y * 0.1,
              rotationY: x * 0.1,
              scale: 1.03,
              ease: "power2.out",
              duration: 0.35,
            });
          };

          const handleMouseLeave = () => {
            gsap.to(element, {
              x: 0,
              y: 0,
              rotationX: 0,
              rotationY: 0,
              scale: 1,
              ease: "elastic.out(1, 0.35)",
              duration: 1,
            });
          };

          element.addEventListener("mousemove", handleMouseMove as any);
          element.addEventListener("mouseleave", handleMouseLeave);

          return () => {
            element.removeEventListener("mousemove", handleMouseMove as any);
            element.removeEventListener("mouseleave", handleMouseLeave);
          };
        }, element);

        return () => ctx.revert();
      }
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

export const MarqueeItem = ({ text }: { text?: string }) => {
  if (text) {
    const parts = text.split("•").map((s) => s.trim()).filter(Boolean);
    return (
      <div className="flex items-center space-x-10 px-6">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span>{part}</span>
            <span className="text-sky-400 font-bold">✦</span>
          </React.Fragment>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center space-x-10 px-6">
      <span>Pencairan Instan</span> <span className="text-sky-400 font-bold">✦</span>
      <span>Admin Support 24/7</span> <span className="text-sky-400 font-bold">✦</span>
      <span>Verifikasi Cepat</span> <span className="text-sky-400 font-bold">✦</span>
      <span>Pencairan Instan</span> <span className="text-sky-400 font-bold">✦</span>
      <span>Admin Support 24/7</span> <span className="text-sky-400 font-bold">✦</span>
      <span>Verifikasi Cepat</span> <span className="text-sky-400 font-bold">✦</span>
    </div>
  );
};

const LIVE_FEED_ITEMS = [
  { amount: "Rp 90.000 Cair", detail: "DANA · 2 menit lalu" },
  { amount: "Rp 45.000 Cair", detail: "GoPay · Baru saja" },
  { amount: "Rp 135.000 Cair", detail: "ShopeePay · 4 menit lalu" },
  { amount: "Rp 67.500 Cair", detail: "OVO · 1 menit lalu" },
];

const SIMULATOR_PRESETS = [5, 10, 20, 50];

export interface CinematicFooterProps {
  singlePage?: boolean;
  directReveal?: boolean;
  giantText?: string;
  onPill1Click?: () => void;
  onPill2Click?: () => void;
  onTutorialClick?: () => void;
  craftedByText?: string;
  onOpenRegister?: () => void;
  onOpenLogin?: () => void;
  siteConfig?: SiteConfig;
}

export function CinematicFooter({
  singlePage = false,
  directReveal = false,
  giantText = "SETOR GMAIL",
  onPill1Click,
  onPill2Click,
  onTutorialClick,
  craftedByText = "Winter",
  onOpenRegister,
  onOpenLogin,
  siteConfig,
}: CinematicFooterProps = {}) {
  const cfg = siteConfig || DEFAULT_SITE_CONFIG;
  const isOnePage = singlePage || directReveal;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const heroLeftRef = useRef<HTMLDivElement>(null);
  const heroRightRef = useRef<HTMLDivElement>(null);

  const [simCount, setSimCount] = React.useState<number>(10);
  const [feedIdx, setFeedIdx] = React.useState<number>(0);

  const pricePerGmail = cfg.price_per_gmail || 4500;
  const minWithdraw = cfg.min_withdrawal || 5000;

  const handleLogin = onPill1Click || onOpenLogin;
  const handleRegister = onPill2Click || onOpenRegister;

  // Rotate live payout feed card smoothly
  useEffect(() => {
    const timer = window.setInterval(() => {
      setFeedIdx((prev) => (prev + 1) % LIVE_FEED_ITEMS.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && wrapperRef.current) {
      const ctx = gsap.context(() => {
        if (isOnePage) {
          gsap.fromTo(
            giantTextRef.current,
            { y: "4vh", scale: 0.92, opacity: 0 },
            { y: "0vh", scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }
          );

          if (heroLeftRef.current) {
            gsap.fromTo(
              heroLeftRef.current,
              { x: -30, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" }
            );
          }

          if (heroRightRef.current) {
            gsap.fromTo(
              heroRightRef.current,
              { x: 30, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.9, delay: 0.15, ease: "power3.out" }
            );
          }
        } else {
          gsap.fromTo(
            giantTextRef.current,
            { y: "8vh", scale: 0.85, opacity: 0 },
            {
              y: "0vh",
              scale: 1,
              opacity: 1,
              ease: "power1.out",
              scrollTrigger: {
                trigger: wrapperRef.current,
                start: "top 80%",
                end: "bottom bottom",
                scrub: 1,
              },
            }
          );
        }
      }, wrapperRef);

      return () => ctx.revert();
    }
  }, [isOnePage]);

  const activeFeed = LIVE_FEED_ITEMS[feedIdx];

  const footerContent = (
    <footer
      className={cn(
        "flex min-h-dvh w-full flex-col justify-between overflow-x-hidden bg-[#07080d] text-[#f8fafc] cinematic-footer-wrapper select-none",
        isOnePage ? "relative" : "fixed bottom-0 left-0 min-h-screen"
      )}
    >
      {/* Ambient Light & Grid Background */}
      <div className="footer-aurora absolute left-1/2 top-1/2 h-[70vh] w-[88vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[95px] pointer-events-none z-0" />
      <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

      {/* Giant background outline text at bottom */}
      <div
        ref={giantTextRef}
        className="footer-giant-bg-text absolute -bottom-[1.5vh] sm:-bottom-[2vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none text-center"
      >
        {giantText}
      </div>

      {/* 1. Diagonal Sleek Marquee (Top of view) */}
      <div className="absolute top-6 sm:top-10 left-0 w-full overflow-hidden border-y border-white/10 bg-[#0b0d14]/80 backdrop-blur-md py-2.5 sm:py-3.5 z-10 -rotate-2 scale-110 shadow-2xl">
        <div className="flex w-max animate-footer-scroll-marquee text-[11px] md:text-sm font-extrabold tracking-[0.24em] text-zinc-200 uppercase">
          <MarqueeItem text={cfg.marquee_text} />
          <MarqueeItem text={cfg.marquee_text} />
        </div>
      </div>

      {/* 2. Main Center / Hero Content Area */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 sm:px-10 lg:px-16 pt-22 sm:pt-26 pb-10 sm:pb-14 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-center w-full">
          {/* SISI KIRI: Headline, Value Strip & Action Buttons */}
          <div
            ref={heroLeftRef}
            className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            {/* Top Micro-Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-400/30 bg-sky-950/50 px-4 py-1.5 backdrop-blur-md mb-5 shadow-[0_0_24px_-4px_rgba(56,189,248,0.3)]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-sky-400" />
              </span>
              <span className="text-xs font-bold text-sky-200 tracking-wide">
                {cfg.platform_badge || "Platform Setor Gmail Terpercaya 2026"}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-black tracking-tight leading-[1.06] mb-5">
              <span className="block footer-text-glow">
                {cfg.hero_headline_1 || "Ubah Akun"}
              </span>
              <span className="block footer-text-glow mt-1 sm:mt-1.5">
                {cfg.hero_headline_2 || "Gmail Jadi"}
              </span>
              <span className="inline-block mt-1 sm:mt-1.5 px-1 pb-2.5 sm:pb-3 leading-[1.18] bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_38px_rgba(56,189,248,0.55)]">
                {cfg.hero_headline_3 || "Penghasilan"}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-zinc-300/90 max-w-lg mb-5 leading-relaxed">
              {cfg.hero_subheadline ||
                "Buat akun Gmail dan dapatkan saldo. Pencairan instan via E-wallet dan Bank."}
            </p>

            {/* Quick Value Chips so visitors immediately understand */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                <Sparkles className="size-3.5 text-emerald-400" />
                {formatIDR(pricePerGmail)} / Akun
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-300">
                <Zap className="size-3.5 text-sky-400" />
                Min. Tarik {formatIDR(minWithdraw)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                SSL &amp; Anti-Fraud
              </span>
            </div>

            {/* Action Buttons: Daftar Gratis (Primary), Login (Glass), Cara Kerja */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 w-full">
              <MagneticButton
                as={handleRegister ? "button" : "a"}
                href={handleRegister ? undefined : "#daftar"}
                onClick={handleRegister}
                type={handleRegister ? "button" : undefined}
                className="btn-shimmer footer-primary-cta px-7 sm:px-9 py-3.5 sm:py-4 rounded-full font-extrabold text-sm sm:text-base flex items-center gap-2.5 group"
              >
                <UserPlus className="w-4.5 h-4.5 text-white" />
                <span>Daftar Gratis</span>
                <ArrowRight className="w-4 h-4 text-white/90 transition-transform duration-300 group-hover:translate-x-1" />
              </MagneticButton>

              <MagneticButton
                as={handleLogin ? "button" : "a"}
                href={handleLogin ? undefined : "#login"}
                onClick={handleLogin}
                type={handleLogin ? "button" : undefined}
                className="footer-glass-pill px-7 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base flex items-center gap-2.5 group border-white/15 hover:border-sky-400/40"
              >
                <LogIn className="w-4.5 h-4.5 text-sky-400 group-hover:text-white transition-colors" />
                <span>Masuk</span>
              </MagneticButton>

              {onTutorialClick && (
                <button
                  type="button"
                  onClick={onTutorialClick}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 px-4 py-3 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  <PlayCircle className="size-4 text-sky-400" />
                  <span>Cara Kerja</span>
                </button>
              )}
            </div>
          </div>

          {/* SISI KANAN: Interactive Showcase & Simulasi Penghasilan */}
          <div
            ref={heroRightRef}
            className="lg:col-span-6 relative flex items-center justify-center py-8 sm:py-12 pb-12 sm:pb-12"
          >
            <div className="relative w-full max-w-[390px] sm:max-w-[440px] mx-auto px-2 sm:px-0">
              {/* Center Main Card */}
              <div className="floating-showcase-card rounded-3xl p-6 sm:p-8 pt-7 pb-7 flex flex-col items-center text-center relative z-10">
                {/* Brand Emblem */}
                <div className="relative mb-3.5">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-2 rounded-3xl bg-sky-500/25 blur-xl"
                  />
                  <div className="relative flex size-15 sm:size-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-400 to-blue-600 shadow-xl shadow-sky-500/30 p-2 overflow-hidden transition-transform duration-300 hover:scale-105">
                    <img
                      src="/envelope-icon.png"
                      alt="Logo Setor Gmail"
                      className="size-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                    />
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Setor Gmail
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xs">
                  Generate nama · Buat akun · Langsung cair
                </p>

                {/* Interactive Earnings Simulator */}
                <div className="mt-5 w-full rounded-2xl border border-white/10 bg-black/50 p-3.5 sm:p-4 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                    <span>Simulasi Penghasilan</span>
                    <span className="text-sky-400 font-mono">
                      {formatIDR(pricePerGmail)}/akun
                    </span>
                  </div>

                  {/* Preset selector buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {SIMULATOR_PRESETS.map((num) => {
                      const active = simCount === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSimCount(num)}
                          className={cn(
                            "rounded-xl py-1.5 text-xs font-extrabold transition-all cursor-pointer",
                            active
                              ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-md shadow-sky-500/30"
                              : "bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5"
                          )}
                        >
                          {num} Akun
                        </button>
                      );
                    })}
                  </div>

                  {/* Calculated Result */}
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-950/35 px-3.5 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">
                        Estimasi Saldo Cair
                      </p>
                      <p className="text-lg sm:text-xl font-black text-emerald-400 tabular-nums tracking-tight">
                        {formatIDR(simCount * pricePerGmail)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        DANA · GoPay · OVO
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge Status */}
                {cfg.badge_status_active !== false && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-950/80 via-amber-900/50 to-amber-950/80 px-3.5 py-1.5 text-xs font-bold text-amber-300 shadow-[0_0_20px_-4px_rgba(245,158,11,0.35)] backdrop-blur-md">
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
                    </span>
                    <Wrench className="size-3.5 text-amber-300 shrink-0" />
                    <span className="tracking-wide text-[11px] sm:text-xs">
                      {cfg.badge_status_text || "Platform sedang dalam tahap pengembangan"}
                    </span>
                  </div>
                )}
              </div>

              {/* 4 FLOATING ORBIT CARDS */}
              {/* 1. Kiri Atas: Cair Instan */}
              <div className="animate-float-1 absolute -top-6 left-1 sm:-top-8 sm:-left-6 lg:-left-10 z-20 floating-showcase-card rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5">
                <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Zap className="size-4 sm:size-4.5 fill-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] sm:text-xs font-extrabold text-white">
                    Cair Instan
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-400">
                    E-Wallet &amp; Bank
                  </div>
                </div>
              </div>

              {/* 2. Kanan Atas: Rotating Live Payout Feed */}
              <div className="animate-float-2 absolute -top-6 right-1 sm:-top-8 sm:-right-6 lg:-right-10 z-20 floating-showcase-card rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5">
                <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Banknote className="size-4 sm:size-4.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] sm:text-xs font-extrabold text-white tabular-nums">
                    {activeFeed.amount}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <Clock className="size-2.5" /> {activeFeed.detail}
                  </div>
                </div>
              </div>

              {/* 3. Kiri Bawah: 100% Aman */}
              <div className="animate-float-2 absolute -bottom-7 left-1 sm:-bottom-9 sm:-left-6 lg:-left-10 z-20 floating-showcase-card rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5">
                <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
                  <ShieldCheck className="size-4 sm:size-4.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] sm:text-xs font-extrabold text-white">
                    100% Aman
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-400">
                    SSL Terenkripsi
                  </div>
                </div>
              </div>

              {/* 4. Kanan Bawah: Komunitas Aktif */}
              <div className="animate-float-1 absolute -bottom-7 right-1 sm:-bottom-9 sm:-right-6 lg:-right-10 z-20 floating-showcase-card rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5">
                <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25">
                  <Users className="size-4 sm:size-4.5" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] sm:text-xs font-extrabold text-white">
                    3.5K+ Member
                  </div>
                  <div className="text-[10px] font-semibold text-sky-400">
                    Aktif menyetor
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="relative z-20 w-full pb-7 px-6 md:px-12 flex justify-center sm:justify-end items-center">
        <div className="footer-glass-pill px-5 py-2 rounded-full flex items-center gap-1.5 cursor-default border-white/10 shadow-lg">
          <span className="text-zinc-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
            Crafted by
          </span>
          <span className="font-black text-xs md:text-sm tracking-normal ml-0.5 bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">
            {craftedByText}
          </span>
        </div>
      </div>
    </footer>
  );

  return (
    <>
      <style>{STYLES}</style>
      {isOnePage ? (
        <div ref={wrapperRef} className="relative min-h-dvh w-full overflow-x-hidden bg-[#07080d]">
          {footerContent}
        </div>
      ) : (
        <div
          ref={wrapperRef}
          className="relative h-screen w-full bg-[#07080d]"
          style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
        >
          {footerContent}
        </div>
      )}
    </>
  );
}

export default CinematicFooter;
