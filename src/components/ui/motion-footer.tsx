"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  /* Fallback / Theme variables */
  --foreground: #0f172a;
  --background: #f8f9fc;
  --primary: #0ea5e9;
  --secondary: #6366f1;
  --destructive: #ef4444;
  --muted-foreground: #64748b;
  --border: rgba(15, 23, 42, 0.08);

  /* Glass pill tokens for clean, premium light appearance */
  --pill-bg-1: rgba(255, 255, 255, 0.95);
  --pill-bg-2: rgba(248, 250, 252, 0.88);
  --pill-shadow: rgba(15, 23, 42, 0.07);
  --pill-highlight: rgba(255, 255, 255, 1);
  --pill-inset-shadow: rgba(0, 0, 0, 0.03);
  --pill-border: rgba(226, 232, 240, 0.95);

  --pill-bg-1-hover: #ffffff;
  --pill-bg-2-hover: #f1f5f9;
  --pill-border-hover: rgba(14, 165, 233, 0.4);
  --pill-shadow-hover: rgba(14, 165, 233, 0.16);
  --pill-highlight-hover: #ffffff;
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.85; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.4)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 35s linear infinite;
  display: flex;
  width: max-content;
  will-change: transform;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 54px 54px;
  background-image: 
    linear-gradient(to right, rgba(15, 23, 42, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
}

/* Theme-adaptive Ambient Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(14, 165, 233, 0.09) 0%, 
    rgba(99, 102, 241, 0.04) 40%, 
    transparent 70%
  );
}

/* Glass Pill Theming */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 28px -8px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 18px 36px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}

/* Giant Background Text Masking */
.footer-giant-bg-text {
  font-size: clamp(3.5rem, 11vw, 11rem);
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 20px rgba(15, 23, 42, 0.04);
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.8);
  pointer-events: none;
  user-select: none;
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
      if (typeof window === "undefined") return;
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
  <div className="flex items-center space-x-12 px-6">
    <span>PLATFORM SETOR GMAIL #1</span> <span className="text-sky-400">✦</span>
    <span>PENCAIRAN KILAT 1-2 MENIT</span> <span className="text-sky-400">✦</span>
    <span>HARGA TERBAIK RP4.500</span> <span className="text-sky-400">✦</span>
    <span>PROSES VERIFIKASI CEPAT</span> <span className="text-sky-400">✦</span>
    <span>100% AMAN &amp; TRANSPARAN</span> <span className="text-sky-400">✦</span>
  </div>
);

export interface CinematicFooterProps {
  /** If true, renders directly as a full-page 100vh view without scroll-reveal wrapping */
  singlePage?: boolean;
  /** Legacy prop alias for singlePage */
  directReveal?: boolean;
  /** Giant faint text in the center background */
  giantText?: string;
  /** Callback when user clicks 'Daftar Akun Baru' */
  onOpenRegister?: () => void;
  /** Callback when user clicks 'Masuk ke Akun' */
  onOpenLogin?: () => void;
  /** Callback when user clicks 'Panduan Tutorial' */
  onOpenTutorial?: () => void;
  /** WhatsApp channel or community URL */
  whatsappUrl?: string;
  /** Rules & Support link URL */
  supportUrl?: string;
  /** Copyright text */
  copyrightText?: string;
  /** Creator brand name */
  craftedByText?: string;
}

export function CinematicFooter({
  singlePage = false,
  directReveal = false,
  giantText = "Ready for Work",
  onOpenRegister,
  onOpenLogin,
  onOpenTutorial,
  whatsappUrl = "https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y",
  supportUrl = "/setor",
  copyrightText = "© 2026 SETOR GMAIL WINTER. ALL RIGHTS RESERVED.",
  craftedByText = "Winter",
}: CinematicFooterProps = {}) {
  const isOnePage = singlePage || directReveal;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && wrapperRef.current) {
      const ctx = gsap.context(() => {
        if (isOnePage) {
          // Direct smooth entry for single-page mode
          gsap.fromTo(
            giantTextRef.current,
            { scale: 0.92, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }
          );

          if (linksRef.current) {
            gsap.fromTo(
              linksRef.current.children,
              { y: 24, opacity: 0 },
              { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out", delay: 0.1 }
            );
          }
        } else {
          // Curtain Reveal scroll animation
          gsap.fromTo(
            giantTextRef.current,
            { y: "10vh", scale: 0.8, opacity: 0 },
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

          if (linksRef.current) {
            gsap.fromTo(
              linksRef.current.children,
              { y: 50, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: wrapperRef.current,
                  start: "top 40%",
                  end: "bottom bottom",
                  scrub: 1,
                },
              }
            );
          }
        }
      }, wrapperRef);

      return () => ctx.revert();
    }
  }, [isOnePage]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const footerContent = (
    <footer className={cn(
      "relative flex h-full min-h-screen w-full flex-col justify-between overflow-hidden bg-[#F8F9FC] text-slate-900 cinematic-footer-wrapper select-none",
      !isOnePage && "fixed bottom-0 left-0"
    )}>
      {/* Ambient Light & Grid Background */}
      <div className="footer-aurora absolute left-1/2 top-1/2 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[90px] pointer-events-none z-0" />
      <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

      {/* 1. Diagonal Sleek Marquee (Top of view) */}
      <div className="absolute top-6 sm:top-10 left-0 w-full overflow-hidden border-y border-slate-200/80 bg-white/95 backdrop-blur-md py-3.5 sm:py-4 z-10 -rotate-1 sm:-rotate-2 scale-105 shadow-md">
        <div className="flex w-max animate-footer-scroll-marquee text-xs sm:text-sm font-extrabold tracking-[0.25em] text-slate-800 uppercase">
          <MarqueeItem />
          <MarqueeItem />
          <MarqueeItem />
        </div>
      </div>

      {/* 2. Main Center Content Area */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 w-full max-w-5xl mx-auto pt-24 pb-16">
        
        {/* Giant background text positioned behind the pills */}
        <div
          ref={giantTextRef}
          className="footer-giant-bg-text absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap z-0 pointer-events-none text-center"
        >
          {giantText}
        </div>

        {/* Interactive Magnetic Pills Layout */}
        <div ref={linksRef} className="relative z-10 flex flex-col items-center gap-4 sm:gap-5 w-full">
          
          {/* Row 1: Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
            {onOpenRegister ? (
              <MagneticButton
                as="button"
                type="button"
                onClick={onOpenRegister}
                className="footer-glass-pill px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-slate-800 font-bold text-sm sm:text-base flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
              >
                <span className="size-2.5 rounded-full bg-emerald-400 shadow-xs ring-4 ring-emerald-400/20" />
                <span>Daftar Akun Baru</span>
              </MagneticButton>
            ) : (
              <MagneticButton
                as="a"
                href="#register"
                className="footer-glass-pill px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-slate-800 font-bold text-sm sm:text-base flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
              >
                <span className="size-2.5 rounded-full bg-emerald-400 shadow-xs ring-4 ring-emerald-400/20" />
                <span>Daftar Akun Baru</span>
              </MagneticButton>
            )}

            {onOpenLogin ? (
              <MagneticButton
                as="button"
                type="button"
                onClick={onOpenLogin}
                className="footer-glass-pill px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-slate-800 font-bold text-sm sm:text-base flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
              >
                <span>Masuk ke Akun</span>
              </MagneticButton>
            ) : (
              <MagneticButton
                as="a"
                href="#login"
                className="footer-glass-pill px-7 sm:px-9 py-3.5 sm:py-4 rounded-full text-slate-800 font-bold text-sm sm:text-base flex items-center gap-3 shadow-sm hover:shadow-md transition-all"
              >
                <span>Masuk ke Akun</span>
              </MagneticButton>
            )}
          </div>

          {/* Row 2: Secondary Navigation Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 w-full">
            {onOpenTutorial ? (
              <MagneticButton
                as="button"
                type="button"
                onClick={onOpenTutorial}
                className="footer-glass-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-slate-600 font-semibold text-xs sm:text-sm hover:text-slate-900 shadow-xs hover:shadow-md transition-all"
              >
                Panduan Tutorial
              </MagneticButton>
            ) : (
              <MagneticButton
                as="a"
                href="#tutorial"
                className="footer-glass-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-slate-600 font-semibold text-xs sm:text-sm hover:text-slate-900 shadow-xs hover:shadow-md transition-all"
              >
                Panduan Tutorial
              </MagneticButton>
            )}

            <MagneticButton
              as="a"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-glass-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-slate-600 font-semibold text-xs sm:text-sm hover:text-slate-900 shadow-xs hover:shadow-md transition-all"
            >
              Saluran WhatsApp
            </MagneticButton>

            <MagneticButton
              as="a"
              href={supportUrl}
              className="footer-glass-pill px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-slate-600 font-semibold text-xs sm:text-sm hover:text-slate-900 shadow-xs hover:shadow-md transition-all"
            >
              Rules &amp; Support
            </MagneticButton>
          </div>

        </div>
      </div>

      {/* 3. Bottom Bar / Credits */}
      <div className="relative z-20 w-full pb-6 sm:pb-8 px-4 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Copyright */}
        <div className="text-slate-500 text-[10.5px] sm:text-xs font-semibold tracking-wider uppercase order-2 md:order-1 text-center md:text-left">
          {copyrightText}
        </div>

        {/* "Crafted with Love" Badge */}
        <div className="footer-glass-pill px-5 sm:px-6 py-2 sm:py-2.5 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border border-slate-200/80 shadow-xs">
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Crafted with</span>
          <span className="animate-footer-heartbeat text-sm sm:text-base text-rose-500">❤</span>
          <span className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">by</span>
          <span className="text-slate-900 font-black text-xs sm:text-sm tracking-normal ml-0.5">{craftedByText}</span>
        </div>

        {/* Back to top Button */}
        <MagneticButton
          as="button"
          onClick={scrollToTop}
          className="size-10 sm:size-11 rounded-full footer-glass-pill flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-xs hover:shadow-md group order-3 transition-all"
          aria-label="Scroll to top"
        >
          <ArrowUp className="size-4 sm:size-4.5 stroke-[2.2] group-hover:-translate-y-0.5 transition-transform duration-300" />
        </MagneticButton>

      </div>
    </footer>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {isOnePage ? (
        <div ref={wrapperRef} className="relative h-screen w-full overflow-hidden">
          {footerContent}
        </div>
      ) : (
        <div
          ref={wrapperRef}
          className="relative h-screen w-full"
          style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
        >
          {footerContent}
        </div>
      )}
    </>
  );
}

export default CinematicFooter;
