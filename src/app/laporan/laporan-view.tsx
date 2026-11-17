"use client";

import * as React from "react";
import Image from "next/image";
import { ShieldCheck, Sparkles } from "lucide-react";
import { PageShell, Reveal } from "@/components/layout/page-shell";
import { useUserProfile } from "@/context/user-profile-context";
import { sanitizeExternalUrl } from "@/lib/security";

export function LaporanView() {
  const { siteConfig } = useUserProfile();
  const cleanUsername =
    (siteConfig?.telegram_admin_username || "winterhere").replace(/[^a-zA-Z0-9_]/g, "") ||
    "winterhere";
  const telegramUrl = sanitizeExternalUrl(
    `https://t.me/${cleanUsername}`,
    "https://t.me/winterhere",
    ["t.me", "telegram.me"]
  );

  const handleOpenTelegram = () => {
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center min-h-[76vh] py-6 px-4">
        <Reveal delay={40} className="flex flex-col items-center w-full max-w-[350px] sm:max-w-[380px]">
          {/* Header Badge */}
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-wider text-sky-300">
              <Sparkles className="size-3 text-sky-400" />
              Layanan Bantuan Resmi
            </span>
            <h1 className="mt-2 text-lg sm:text-xl font-black tracking-tight text-white">
              Pusat Laporan &amp; CS Admin
            </h1>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Scan kode QR atau klik tombol di bawah untuk terhubung langsung ke Telegram Admin <strong className="text-sky-300">@{cleanUsername}</strong>.
            </p>
          </div>

          {/* Kartu QR Telegram Asli HD */}
          <div className="relative w-full aspect-[716/968] select-none drop-shadow-[0_20px_45px_rgba(56,189,248,0.18)] mb-5 transition-transform duration-300 hover:scale-[1.015]">
            <Image
              src="/telegram-qr-card.png"
              alt={`Telegram QR @${cleanUsername}`}
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
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              aria-hidden="true"
            />

            <svg
              className="size-5 fill-white transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:scale-110"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.94z" />
            </svg>

            <span className="relative z-10 tracking-wide font-extrabold text-[0.92rem]">
              Chat via Telegram (@{cleanUsername})
            </span>
          </button>

          <p className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] text-zinc-400">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
            <span>Waspada penipuan: Admin tidak pernah meminta password akun web Anda.</span>
          </p>
        </Reveal>
      </div>
    </PageShell>
  );
}
