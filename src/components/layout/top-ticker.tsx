"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TopTickerProps {
  className?: string;
}

export function TopTicker({ className }: TopTickerProps) {
  const tickerItems = (
    <>
      <span className="text-white font-extrabold">PLATFORM SETOR GMAIL #1</span>
      <span className="text-sky-400 font-black">✦</span>

      <span className="text-emerald-400 font-extrabold">PENCAIRAN KILAT 1-2 MENIT</span>
      <span className="text-sky-400 font-black">✦</span>

      <span>HARGA TERBAIK RP 4.500 / AKUN</span>
      <span className="text-sky-400 font-black">✦</span>

      <span className="text-white font-extrabold">100% AMAN &amp; TERPERCAYA</span>
      <span className="text-sky-400 font-black">✦</span>

      <span className="text-emerald-300">DUKUNGAN 24/7 ONLINE</span>
      <span className="text-sky-400 font-black">✦</span>

      <span className="text-purple-300">BONUS REFERRAL RP 150 / AKUN</span>
      <span className="text-sky-400 font-black">✦</span>

      <span>ACCOUNTABILITY REDEFINED</span>
      <span className="text-sky-400 font-black">✦</span>

      <span>ABSOLUTE PRIVACY</span>
      <span className="text-sky-400 font-black">✦</span>

      <span>TRANSPARENT TRACKING</span>
      <span className="text-sky-400 font-black">✦</span>

      <a
        href="https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-400 hover:text-sky-300 transition-colors underline-offset-4 hover:underline"
      >
        SALURAN WHATSAPP RESMI WINTER
      </a>
      <span className="text-sky-400 font-black">✦</span>
    </>
  );

  return (
    <div
      className={cn(
        "group relative z-30 w-full overflow-hidden border-b border-white/10 bg-[#09090b] py-2.5 shadow-md select-none text-zinc-300",
        className
      )}
      role="region"
      aria-label="Iklan dan Informasi Berjalan"
    >
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        <div className="flex shrink-0 items-center space-x-8 sm:space-x-12 pr-8 sm:pr-12 text-[11px] sm:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase text-zinc-300">
          {tickerItems}
        </div>
        <div
          className="flex shrink-0 items-center space-x-8 sm:space-x-12 pr-8 sm:pr-12 text-[11px] sm:text-xs font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase text-zinc-300"
          aria-hidden="true"
        >
          {tickerItems}
        </div>
      </div>
    </div>
  );
}

export default TopTicker;
