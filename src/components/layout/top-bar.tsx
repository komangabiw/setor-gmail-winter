"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, MessageCircle, History } from "lucide-react";
import { mockUser } from "@/lib/mock-data";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4 sm:max-w-lg sm:px-6 md:max-w-4xl md:px-8 lg:max-w-5xl xl:px-10">
        {/* Left: Brand logo & name */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform active:scale-98"
        >
          {/* Blue circle with envelope icon */}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
            <Mail className="size-4.5 stroke-[2.2]" aria-hidden="true" />
          </span>

          {/* Brand Name */}
          <div className="flex items-baseline gap-1.5 text-[0.95rem] sm:text-[1.05rem] tracking-tight">
            <span className="font-black text-slate-900 tracking-tight">
              SETOR GMAIL
            </span>
            <span className="text-[0.72rem] sm:text-xs font-bold text-slate-400 lowercase">
              by
            </span>
            <span className="font-black tracking-tight bg-gradient-to-r from-sky-500 via-sky-600 to-brand-600 bg-clip-text text-transparent">
              Winter
            </span>
          </div>
        </Link>

        {/* Right actions: Riwayat & Saluran WA */}
        <div className="flex items-center gap-2">
          <Link
            href="/riwayat"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-[0.76rem] font-semibold text-ink-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
            title="Riwayat Setoran"
          >
            <History className="size-3.5 text-slate-500" />
            <span className="hidden xs:inline sm:inline">Riwayat</span>
          </Link>

          {mockUser.whatsappChannelUrl && (
            <a
              href={mockUser.whatsappChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-[0.76rem] font-semibold text-ink-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
            >
              <span className="flex size-4.5 items-center justify-center rounded-full border border-sky-400 text-sky-500">
                <MessageCircle className="size-2.5" />
              </span>
              <span>Saluran WA</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
