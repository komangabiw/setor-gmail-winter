"use client";

import * as React from "react";
import Image from "next/image";
import { PageShell } from "@/components/layout/page-shell";

export function LaporanView() {
  const telegramUrl = "https://t.me/winterhere";

  const handleOpenTelegram = () => {
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center min-h-[75vh] py-6 px-4">
        <div className="flex flex-col items-center w-full max-w-[340px] sm:max-w-[370px]">
          {/* Kartu QR Telegram Asli HD Bersih Tanpa Frame Tambahan */}
          <div className="relative w-full aspect-[716/968] select-none drop-shadow-2xl mb-6">
            <Image
              src="/telegram-qr-card.png"
              alt="Telegram QR @winterhere"
              fill
              priority
              unoptimized
              className="object-contain"
            />
          </div>

          {/* Tombol Chat via Telegram dengan Efek Hover Menarik */}
          <button
            type="button"
            onClick={handleOpenTelegram}
            className="w-full group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#6366f1] to-[#38bdf8] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(99,102,241,0.55)] active:scale-[0.98] cursor-pointer"
          >
            {/* Efek Kilau / Shimmer Cahaya saat Hover */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              aria-hidden="true"
            />

            {/* Ikon Pesawat Telegram yang Melayang Halus saat Hover */}
            <svg
              className="size-5 fill-white transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.94z" />
            </svg>

            <span className="relative z-10 tracking-wide font-extrabold text-[0.92rem]">
              Chat via Telegram
            </span>
          </button>
        </div>
      </div>
    </PageShell>
  );
}
