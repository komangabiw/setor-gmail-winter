"use client";

import * as React from "react";
import { Sparkles, Zap, ShieldCheck, Flame, Gift, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopTickerProps {
  className?: string;
}

export function TopTicker({ className }: TopTickerProps) {
  const tickerItems = (
    <>
      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span>Online 24/7 Siap Melayani</span>
      </span>

      <span className="text-sky-500/80 font-black">✦</span>

      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
        <Sparkles className="size-3.5 text-sky-500 shrink-0" />
        <span>Platform Setor Gmail #1 Terpercaya di Indonesia</span>
      </span>

      <span className="text-sky-500/80 font-black">✦</span>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/70 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 shadow-2xs">
        <Zap className="size-3 text-emerald-600 fill-emerald-500 shrink-0" />
        <span>Pencairan Kilat: 1 - 2 Menit Masuk DANA, GoPay & OVO</span>
      </span>

      <span className="text-sky-500/80 font-black">✦</span>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50/90 border border-sky-200/70 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-700 shadow-2xs">
        <Flame className="size-3 text-amber-500 fill-amber-400 shrink-0" />
        <span>Harga Terbaik: Rp4.500 / Akun Good</span>
      </span>

      <span className="text-sky-500/80 font-black">✦</span>

      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
        <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
        <span>100% Aman & Terverifikasi (Garansi Privasi SSL)</span>
      </span>

      <span className="text-sky-500/80 font-black">✦</span>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50/90 border border-purple-200/70 px-2.5 py-0.5 text-[11px] font-extrabold text-purple-700 shadow-2xs">
        <Gift className="size-3 text-purple-600 shrink-0" />
        <span>Bonus Referral Rp150 / Akun Setiap Ajak Teman</span>
      </span>

      <span className="text-sky-500/80 font-black">✦</span>

      <a
        href="https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-bold text-sky-600 hover:text-sky-700 transition-colors"
      >
        <MessageCircle className="size-3.5 text-emerald-500 shrink-0" />
        <span>Saluran WhatsApp Resmi Winter</span>
      </a>

      <span className="text-sky-500/80 font-black">✦</span>
    </>
  );

  return (
    <div
      className={cn(
        "group relative z-20 w-full overflow-hidden border-b border-sky-100/90 bg-white/85 py-2 shadow-2xs backdrop-blur-md select-none transition-colors hover:bg-white",
        className
      )}
      role="region"
      aria-label="Iklan dan Informasi Berjalan"
    >
      <div className="flex w-max animate-marquee">
        <div className="flex shrink-0 items-center space-x-6 sm:space-x-8 pr-6 sm:pr-8 text-xs font-medium uppercase tracking-wider text-slate-700">
          {tickerItems}
        </div>
        <div
          className="flex shrink-0 items-center space-x-6 sm:space-x-8 pr-6 sm:pr-8 text-xs font-medium uppercase tracking-wider text-slate-700"
          aria-hidden="true"
        >
          {tickerItems}
        </div>
      </div>
    </div>
  );
}

export default TopTicker;
