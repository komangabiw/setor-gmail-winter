"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4 sm:max-w-lg sm:px-6 md:max-w-4xl md:px-8 lg:max-w-5xl xl:px-10">
        {/* Left: Brand name & logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 transition-transform active:scale-98"
        >
          {/* Brand Name */}
          <div className="flex items-baseline gap-1.5 text-[0.95rem] sm:text-[1.05rem] tracking-tight">
            <span className="font-black text-white tracking-tight">
              SETOR GMAIL
            </span>
            <span className="text-[0.72rem] sm:text-xs font-bold text-zinc-400 lowercase">
              by
            </span>
            <span className="font-black tracking-tight bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              Winter
            </span>
          </div>

          {/* Logo on the right of Winter text */}
          <Image
            src="/logo_removebg.png"
            alt="Setor Gmail Winter Logo"
            width={38}
            height={38}
            priority
            className="h-7.5 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
        </Link>

        {/* Right action: Saluran WA */}
        <div className="flex items-center gap-2">
          <a
            href="https://whatsapp.com/channel/0029VbEImqX7j6gFzKU9Qy1Y"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[0.76rem] font-semibold text-zinc-200 shadow-2xs transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
          >
            <span className="flex size-4.5 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-400">
              <MessageCircle className="size-2.5" />
            </span>
            <span>Saluran WA</span>
          </a>
        </div>
      </div>
    </header>
  );
}
