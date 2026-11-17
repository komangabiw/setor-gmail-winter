"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useUserProfile } from "@/context/user-profile-context";
import { sanitizeExternalUrl } from "@/lib/security";
import { formatIDR } from "@/lib/utils";

export function TopBar() {
  const { siteConfig } = useUserProfile();
  const waUrl = sanitizeExternalUrl(
    siteConfig?.whatsapp_channel_url,
    "https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y",
    ["whatsapp.com", "wa.me"]
  );
  const rate = siteConfig?.price_per_gmail || 4500;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07080d]/85 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.75)]">
      {/* Subtle top aurora accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none h-[1px] w-full bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"
      />

      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4 sm:max-w-lg sm:px-6 md:max-w-4xl md:px-8 lg:max-w-5xl xl:px-10">
        {/* Left: Brand name & logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform active:scale-98"
        >
          {/* Glowing Brand Emblem */}
          <div className="relative flex items-center justify-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-sky-400/25 blur-md transition-opacity duration-300 group-hover:opacity-100 opacity-70"
            />
            <Image
              src="/logo_removebg.png"
              alt="Setor Gmail Winter Logo"
              width={36}
              height={36}
              priority
              className="relative h-7.5 sm:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
            />
          </div>

          {/* Brand Name */}
          <div className="flex items-baseline gap-1.5 text-[0.95rem] sm:text-[1.05rem] tracking-tight">
            <span className="font-black text-white tracking-tight">
              SETOR GMAIL
            </span>
            <span className="text-[0.7rem] sm:text-xs font-semibold text-zinc-400 lowercase">
              by
            </span>
            <span className="font-black tracking-tight bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]">
              Winter
            </span>
          </div>
        </Link>

        {/* Right actions: Live Rate Badge (Desktop) + Security Shield + Saluran WA */}
        <div className="flex items-center gap-2">
          <Link
            href="/setor"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[0.72rem] font-bold text-sky-300 transition-all hover:border-sky-400/50 hover:bg-sky-500/15"
          >
            <Sparkles className="size-3 text-sky-400" aria-hidden="true" />
            <span>Rate: {formatIDR(rate)}/Gmail</span>
          </Link>

          <span
            title="Koneksi SSL Terenkripsi & Anti-Fraud Aktif"
            className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-300 select-none"
          >
            <ShieldCheck className="size-3 text-emerald-400" aria-hidden="true" />
            <span>SSL Aman</span>
          </span>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shimmer inline-flex items-center gap-2 rounded-full border border-white/15 bg-gradient-to-b from-white/[0.09] to-white/[0.03] px-3 sm:px-3.5 py-1.5 text-[0.75rem] font-bold text-zinc-100 shadow-sm transition-all hover:border-emerald-400/40 hover:text-white active:scale-95"
          >
            <span className="relative flex size-4.5 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-400">
              <MessageCircle className="size-2.5" />
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span>Saluran WA</span>
          </a>
        </div>
      </div>
    </header>
  );
}
