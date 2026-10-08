"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  LogIn,
  UserPlus,
  Mail,
  Zap,
  Banknote,
  ShieldCheck,
  Users,
  Clock,
} from "lucide-react";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES (Dark Mode Aesthetic matching 21st.dev)
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --foreground: #f8fafc;
  --background: #09090b;
  --primary: #38bdf8;
  --secondary: #818cf8;
  --destructive: #ef4444;
  --muted-foreground: #a1a1aa;
  --border: rgba(255, 255, 255, 0.1);

  --pill-bg-1: rgba(255, 255, 255, 0.05);
  --pill-bg-2: rgba(255, 255, 255, 0.015);
  --pill-shadow: rgba(0, 0, 0, 0.6);
  --pill-highlight: rgba(255, 255, 255, 0.14);
  --pill-inset-shadow: rgba(0, 0, 0, 0.6);
  --pill-border: rgba(255, 255, 255, 0.08);
  
  --pill-bg-1-hover: rgba(255, 255, 255, 0.1);
  --pill-bg-2-hover: rgba(255, 255, 255, 0.03);
  --pill-border-hover: rgba(255, 255, 255, 0.22);
  --pill-shadow-hover: rgba(0, 0, 0, 0.85);
  --pill-highlight-hover: rgba(255, 255, 255, 0.25);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.9; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes float-subtle-1 {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-7px) rotate(0.8deg); }
}

@keyframes float-subtle-2 {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(7px) rotate(-0.8deg); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 32s linear infinite;
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

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 56px 56px;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}

/* Theme-adaptive Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(56, 189, 248, 0.15) 0%, 
    rgba(129, 140, 248, 0.1) 40%, 
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
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

/* Giant Background Text Masking at Bottom */
.footer-giant-bg-text {
  font-size: clamp(3.2rem, 15vw, 13rem);
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.07);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
  pointer-events: none;
  user-select: none;
}

/* Metallic Text Glow */
.footer-text-glow {
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.45) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 24px rgba(255, 255, 255, 0.2));
}

/* Floating Card Theming */
.floating-showcase-card {
  background: rgba(18, 18, 22, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7);
  transition: all 0.35s ease;
}

.floating-showcase-card:hover {
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 25px 50px -10px rgba(56, 189, 248, 0.18);
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
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
              x: x * 0.35,
              y: y * 0.35,
              rotationX: -y * 0.12,
              rotationY: x * 0.12,
              scale: 1.04,
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
              ease: "elastic.out(1, 0.3)",
              duration: 1.1,
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

// -------------------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------------------
export const MarqueeItem = () => (
  <div className="flex items-center space-x-10 px-6">
    <span>Pencairan Instan</span> <span className="text-sky-400 font-bold">✦</span>
    <span>Admin Support 24/7</span> <span className="text-sky-400 font-bold">✦</span>
    <span>Verifikasi Cepat</span> <span className="text-sky-400 font-bold">✦</span>
    <span>Pencairan Instan</span> <span className="text-sky-400 font-bold">✦</span>
    <span>Admin Support 24/7</span> <span className="text-sky-400 font-bold">✦</span>
    <span>Verifikasi Cepat</span> <span className="text-sky-400 font-bold">✦</span>
  </div>
);

export interface CinematicFooterProps {
  /** If true, renders directly as a full-page 100vh view without scroll-reveal wrapping */
  singlePage?: boolean;
  /** Legacy prop alias for singlePage */
  directReveal?: boolean;
  /** Giant masked outline text placed at the bottom */
  giantText?: string;
  /** Primary Pill 1 action (Login) */
  onPill1Click?: () => void;
  /** Primary Pill 2 action (Daftar) */
  onPill2Click?: () => void;
  /** Creator brand text on bottom right */
  craftedByText?: string;
  /** Compatibility alias */
  onOpenRegister?: () => void;
  /** Compatibility alias */
  onOpenLogin?: () => void;
}

export function CinematicFooter({
  singlePage = false,
  directReveal = false,
  giantText = "SETOR GMAIL",
  onPill1Click,
  onPill2Click,
  craftedByText = "Winter",
  onOpenRegister,
  onOpenLogin,
}: CinematicFooterProps = {}) {
  const isOnePage = singlePage || directReveal;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const heroLeftRef = useRef<HTMLDivElement>(null);
  const heroRightRef = useRef<HTMLDivElement>(null);

  const handleLogin = onPill1Click || onOpenLogin;
  const handleRegister = onPill2Click || onOpenRegister;

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
          // Scroll-triggered animations
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

  const footerContent = (
    <footer className={cn(
      "flex h-full min-h-screen w-full flex-col justify-between overflow-hidden bg-[#09090b] text-[#f8fafc] cinematic-footer-wrapper select-none",
      isOnePage ? "relative" : "fixed bottom-0 left-0 h-screen"
    )}>
      {/* Ambient Light & Grid Background */}
      <div className="footer-aurora absolute left-1/2 top-1/2 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[90px] pointer-events-none z-0" />
      <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

      {/* 
        Giant background text at bottom:
        Dinaikkan sedikit ke atas (-bottom-[1vh]), tapi tetap sebagian terpotong batas bawah.
      */}
      <div
        ref={giantTextRef}
        className="footer-giant-bg-text absolute -bottom-[1.5vh] sm:-bottom-[2vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none text-center"
      >
        {giantText}
      </div>

      {/* 1. Diagonal Sleek Marquee (Top of view) */}
      <div className="absolute top-8 sm:top-12 left-0 w-full overflow-hidden border-y border-white/10 bg-black/60 backdrop-blur-md py-3 sm:py-3.5 z-10 -rotate-2 scale-110 shadow-2xl">
        <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.25em] text-zinc-300 uppercase">
          <MarqueeItem />
          <MarqueeItem />
        </div>
      </div>

      {/* 2. Main Center / Hero Content Area */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 sm:px-10 lg:px-16 pt-24 pb-16 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center w-full">
          
          {/* SISI KIRI: Headline & Tombol Action (Login & Daftar) */}
          <div ref={heroLeftRef} className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Top Micro-Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-950/40 px-4 py-1.5 backdrop-blur-md mb-6 shadow-sm">
              <span className="size-2 rounded-full bg-sky-400 animate-ping" />
              <span className="text-xs font-bold text-sky-300 tracking-wide">
                Platform Setor Gmail Terpercaya 2026
              </span>
            </div>

            {/* Headline: Ubah Akun / Gmail Jadi / Penghasilan */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6">
              <span className="block footer-text-glow">
                Ubah Akun
              </span>
              <span className="block footer-text-glow mt-1 sm:mt-2">
                Gmail Jadi
              </span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(56,189,248,0.5)]">
                Penghasilan
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-zinc-400 max-w-lg mb-8 leading-relaxed">
              Buat akun Gmail dan tukar menjadi saldo
              <br className="hidden sm:inline" />
              {" "}Pencairan instan via E-wallet dan Bank
            </p>

            {/* Tombol Action: Login dan Daftar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
              {/* Tombol Login */}
              <MagneticButton
                as={handleLogin ? "button" : "a"}
                href={handleLogin ? undefined : "#login"}
                onClick={handleLogin}
                type={handleLogin ? "button" : undefined}
                className="footer-glass-pill px-8 sm:px-10 py-4 sm:py-4.5 rounded-full font-bold text-sm sm:text-base flex items-center gap-3 group border-white/10 hover:border-sky-400/40"
              >
                <LogIn className="w-5 h-5 text-sky-400 group-hover:text-white transition-colors" />
                <span>Login</span>
              </MagneticButton>

              {/* Tombol Daftar */}
              <MagneticButton
                as={handleRegister ? "button" : "a"}
                href={handleRegister ? undefined : "#daftar"}
                onClick={handleRegister}
                type={handleRegister ? "button" : undefined}
                className="footer-glass-pill px-8 sm:px-10 py-4 sm:py-4.5 rounded-full font-bold text-sm sm:text-base flex items-center gap-3 group border-white/10 hover:border-emerald-400/40"
              >
                <UserPlus className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors" />
                <span>Daftar</span>
              </MagneticButton>
            </div>
          </div>

          {/* SISI KANAN / BESIDE: Showcase & Floating Cards persis sesuai gambar referensi */}
          <div ref={heroRightRef} className="lg:col-span-6 relative flex items-center justify-center py-8">
            <div className="relative w-full max-w-md">
              
              {/* Center Main Card: Setor Gmail */}
              <div className="floating-showcase-card rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center relative z-10">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-xl shadow-sky-500/30">
                  <Mail className="size-8 stroke-[2.2]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Setor Gmail
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-xs">
                  Platform setor gmail tercepat &amp; terpercaya
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-bold text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  Server Aktif &amp; Siap Proses
                </div>
              </div>

              {/* 4 FLOATING CARDS */}
              {/* 1. Kiri Atas: Cair Instan | E-wallet dan Bank */}
              <div className="animate-float-1 absolute -top-6 -left-4 sm:-top-8 sm:-left-8 z-20 floating-showcase-card rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
                  <Zap className="size-5 fill-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Cair Instan
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-400">
                    E-wallet dan Bank
                  </div>
                </div>
              </div>

              {/* 2. Kanan Atas: Rp 90.000 Cair | 3 menit lalu */}
              <div className="animate-float-2 absolute -top-6 -right-4 sm:-top-8 sm:-right-8 z-20 floating-showcase-card rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <Banknote className="size-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Rp 90.000 Cair
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <Clock className="size-3" /> 3 menit lalu
                  </div>
                </div>
              </div>

              {/* 3. Kiri Bawah: 100% Aman | SSL Terenkripsi */}
              <div className="animate-float-2 absolute -bottom-6 -left-4 sm:-bottom-8 sm:-left-8 z-20 floating-showcase-card rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-white">
                    100% Aman
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-400">
                    SSL Terenkripsi
                  </div>
                </div>
              </div>

              {/* 4. Kanan Bawah: 3.5K Member | Aktif sekarang */}
              <div className="animate-float-1 absolute -bottom-6 -right-4 sm:-bottom-8 sm:-right-8 z-20 floating-showcase-card rounded-2xl p-3 sm:p-3.5 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-xs">
                  <Users className="size-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold text-white">
                    3.5K Member
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-purple-400">
                    Aktif sekarang
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 
        3. Bottom Bar:
        - Teks copyright sebelah kiri SUDAH DIHAPUS
        - Badge diubah menjadi "Crafted by Winter" dan diposisikan di sebelah KANAN
      */}
      <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex justify-end items-center">
        <div className="footer-glass-pill px-6 py-2.5 rounded-full flex items-center gap-1.5 cursor-default border-white/10 shadow-lg">
          <span className="text-zinc-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">Crafted by</span>
          <span className="text-white font-black text-xs md:text-sm tracking-normal ml-0.5">{craftedByText}</span>
        </div>
      </div>
    </footer>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {isOnePage ? (
        <div ref={wrapperRef} className="relative h-screen w-full overflow-hidden bg-[#09090b]">
          {footerContent}
        </div>
      ) : (
        <div
          ref={wrapperRef}
          className="relative h-screen w-full bg-[#09090b]"
          style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
        >
          {footerContent}
        </div>
      )}
    </>
  );
}

export default CinematicFooter;
