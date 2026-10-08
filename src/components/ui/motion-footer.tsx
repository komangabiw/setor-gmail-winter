"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

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
  
  /* Dynamic Variables using standard shadcn/tailwind v4 dark tokens */
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

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.5)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
  display: flex;
  width: max-content;
  will-change: transform;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  display: inline-block;
}

/* Theme-adaptive Grid Background */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
}

/* Theme-adaptive Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(56, 189, 248, 0.14) 0%, 
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
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
  font-size: clamp(3.2rem, 15vw, 13.5rem);
  line-height: 0.8;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
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
      if (typeof window !== "undefined") return;
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
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
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
            duration: 1.2,
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
    <span>Accountability Redefined</span> <span className="text-primary/60">✦</span>
    <span>Transparent Tracking</span> <span className="text-secondary/60">✦</span>
    <span>12-Step Progress</span> <span className="text-primary/60">✦</span>
    <span>Sponsor Connection</span> <span className="text-secondary/60">✦</span>
    <span>Absolute Privacy</span> <span className="text-primary/60">✦</span>
  </div>
);

export interface CinematicFooterProps {
  /** If true, renders directly as a full-page 100vh view without scroll-reveal wrapping */
  singlePage?: boolean;
  /** Legacy prop alias for singlePage */
  directReveal?: boolean;
  /** Custom heading element or text */
  heading?: React.ReactNode;
  /** Giant masked outline text placed at the bottom */
  giantText?: string;
  /** Primary Pill 1 label */
  pill1Text?: string;
  /** Primary Pill 2 label */
  pill2Text?: string;
  /** Primary Pill 1 action */
  onPill1Click?: () => void;
  /** Primary Pill 2 action */
  onPill2Click?: () => void;
  /** Brand name for Crafted with badge (Right side) */
  craftedByText?: string;
  /** Compatibility alias */
  onOpenRegister?: () => void;
  /** Compatibility alias */
  onOpenLogin?: () => void;
}

export function CinematicFooter({
  singlePage = false,
  directReveal = false,
  heading,
  giantText = "SETOR GMAIL",
  pill1Text = "Download iOS",
  pill2Text = "Download Android",
  onPill1Click,
  onPill2Click,
  craftedByText = "Winter",
  onOpenRegister,
  onOpenLogin,
}: CinematicFooterProps = {}) {
  const isOnePage = singlePage || directReveal;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  // Handle compatibility actions
  const handlePill1 = onPill1Click || onOpenRegister;
  const handlePill2 = onPill2Click || onOpenLogin;

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!wrapperRef.current) return;

      const ctx = gsap.context(() => {
        if (isOnePage) {
          gsap.fromTo(
            giantTextRef.current,
            { y: "5vh", scale: 0.9, opacity: 0 },
            { y: "0vh", scale: 1, opacity: 1, duration: 1, ease: "power2.out" }
          );

          gsap.fromTo(
            [headingRef.current, linksRef.current],
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out" }
          );
        } else {
          // Background Parallax
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

          // Staggered Content Reveal
          gsap.fromTo(
            [headingRef.current, linksRef.current],
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
      <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
      <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

      {/* Giant background text at bottom */}
      <div
        ref={giantTextRef}
        className="footer-giant-bg-text absolute -bottom-[4vh] sm:-bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none text-center"
      >
        {giantText}
      </div>

      {/* 1. Diagonal Sleek Marquee (Top of view) */}
      <div className="absolute top-8 sm:top-12 left-0 w-full overflow-hidden border-y border-white/10 bg-black/60 backdrop-blur-md py-3 sm:py-4 z-10 -rotate-2 scale-110 shadow-2xl">
        <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.3em] text-zinc-400 uppercase">
          <MarqueeItem />
          <MarqueeItem />
        </div>
      </div>

      {/* 2. Main Center Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 mt-16 sm:mt-20 w-full max-w-5xl mx-auto">
        <h2
          ref={headingRef}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-10 sm:mb-12 text-center leading-[1.08]"
        >
          {heading ? (
            heading
          ) : (
            <>
              <span className="block footer-text-glow">
                Ubah Akun Gmail
              </span>
              <span className="block mt-1 sm:mt-2">
                <span className="footer-text-glow mr-3 sm:mr-4">Jadi</span>
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(56,189,248,0.5)]">
                  Penghasilan
                </span>
              </span>
            </>
          )}
        </h2>

        {/* Interactive Magnetic Pills Layout */}
        <div ref={linksRef} className="flex flex-col items-center gap-5 sm:gap-6 w-full">
          {/* Primary Action Pills */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full">
            <MagneticButton
              as={handlePill1 ? "button" : "a"}
              href={handlePill1 ? undefined : "#"}
              onClick={handlePill1}
              type={handlePill1 ? "button" : undefined}
              className="footer-glass-pill px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-sm md:text-base flex items-center gap-3 group"
            >
              <svg className="w-5 sm:w-6 h-5 sm:h-6 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.87.67 3.55 1.76-3.13 1.77-2.62 5.92.35 7.14-.65 1.58-1.57 3.1-2.57 4.03zm-3.21-14.7c-.55 1.4-1.89 2.37-3.25 2.28.09-1.5 1.05-2.82 2.38-3.4 1.25-.57 2.66-.41 3.25.04-.15.35-.26.72-.38 1.08z" />
              </svg>
              <span>{pill1Text}</span>
            </MagneticButton>
            
            <MagneticButton
              as={handlePill2 ? "button" : "a"}
              href={handlePill2 ? undefined : "#"}
              onClick={handlePill2}
              type={handlePill2 ? "button" : undefined}
              className="footer-glass-pill px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-sm md:text-base flex items-center gap-3 group"
            >
              <svg className="w-5 sm:w-6 h-5 sm:h-6 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0004.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0004.5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0222 3.503C15.5902 8.242 13.8533 7.85 12 7.85c-1.8533 0-3.5902.392-5.1369 1.1004L4.841 5.4475a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3436-4.1021-2.6893-7.5743-6.1185-9.4396" />
              </svg>
              <span>{pill2Text}</span>
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* 
        3. Bottom Bar:
        - Teks 2026 volvox di sebelah kiri sudah DIHAPUS
        - Tombol menuju atas sudah DIHAPUS
        - Badge "Crafted with ❤ by Winter" diposisikan di sebelah KANAN
      */}
      <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex justify-end items-center">
        <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 cursor-default border-white/10 shadow-lg">
          <span className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Crafted with</span>
          <span className="animate-footer-heartbeat text-sm md:text-base text-rose-500">❤</span>
          <span className="text-zinc-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">by</span>
          <span className="text-white font-black text-xs md:text-sm tracking-normal ml-1">{craftedByText}</span>
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
