"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TopTickerProps {
  className?: string;
}

export function TopTicker({ className }: TopTickerProps) {
  const tickerItems = (
    <>
      <span className="text-white font-extrabold">Pencairan Instan</span>
      <span className="text-sky-400 font-bold">-</span>
      <span className="text-emerald-400 font-extrabold">Admin Support 24/7</span>
      <span className="text-sky-400 font-bold">-</span>
      <span className="text-cyan-300 font-extrabold">Verifikasi Cepat</span>
      <span className="text-sky-400 font-bold">-</span>

      <span className="text-white font-extrabold">Pencairan Instan</span>
      <span className="text-sky-400 font-bold">-</span>
      <span className="text-emerald-400 font-extrabold">Admin Support 24/7</span>
      <span className="text-sky-400 font-bold">-</span>
      <span className="text-cyan-300 font-extrabold">Verifikasi Cepat</span>
      <span className="text-sky-400 font-bold">-</span>
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
