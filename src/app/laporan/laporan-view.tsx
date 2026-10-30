"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { toast } from "sonner";

export function LaporanView() {
  const [copied, setCopied] = React.useState(false);
  const telegramUsername = "@winterhere";
  const telegramUrl = "https://t.me/winterhere";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(telegramUrl);
      setCopied(true);
      toast.success("Tautan Telegram berhasil disalin!", {
        description: telegramUrl,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin tautan");
    }
  };

  const handleOpenTelegram = () => {
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center min-h-[75vh] py-6 sm:py-10 px-4">
        {/* Container Utama dengan Nuansa Gelap Doodles Telegram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden border border-white/10 bg-[#0c0d12]/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center"
        >
          {/* Subtle Glow Background Orbs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-56 rounded-full opacity-35 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(99, 102, 241, 0.25) 50%, transparent 75%)",
            }}
          />

          {/* Badge Telegram Support */}
          <div className="relative mb-5 inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pusat Bantuan &amp; Laporan</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
            Hubungi Admin Langsung
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mb-6 leading-relaxed">
            Scan QR code atau klik tombol di bawah untuk langsung terhubung ke chat Telegram resmi kami.
          </p>

          {/* Card Kartu QR Putih Telegram dengan Avatar Winter di Atasnya */}
          <div className="relative w-full max-w-[290px] sm:max-w-[310px] pt-7 mb-6 select-none">
            {/* Avatar Lingkaran Ungu "W" yang Mengapung Memotong Atas Kartu */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex size-14 sm:size-16 items-center justify-center rounded-full bg-gradient-to-b from-[#8f82f8] to-[#6d5df6] border-4 border-[#0c0d12] shadow-xl">
              <span className="text-xl sm:text-2xl font-black text-white tracking-wide">
                W
              </span>
            </div>

            {/* Kotak Putih Tempat QR Code */}
            <div className="relative rounded-[28px] bg-white p-5 sm:p-6 shadow-2xl border border-white/90 flex flex-col items-center">
              {/* Gambar QR Asli Telegram dengan Pesawat Animasi Floating di Tengah */}
              <div className="relative w-[210px] h-[210px] sm:w-[230px] sm:h-[230px] rounded-2xl overflow-hidden flex items-center justify-center">
                <Image
                  src="/telegram-qr-winterhere.jpg"
                  alt="Telegram QR Code @winterhere"
                  fill
                  priority
                  className="object-contain scale-[1.32] translate-y-[-0.5%]"
                />

                {/* Ikon Pesawat Telegram Mengapung (Floating Animation) Persis Telegram */}
                <motion.div
                  animate={{
                    y: [-3, 3, -3],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute z-10 flex size-11 sm:size-12 items-center justify-center rounded-full bg-[#6d5df6] text-white shadow-lg shadow-purple-500/40 border-2 border-white"
                >
                  <svg
                    className="size-5 sm:size-6 fill-white -translate-x-0.5 translate-y-0.5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.94z" />
                  </svg>
                </motion.div>
              </div>

              {/* Username Telegram di Bagian Bawah Kartu */}
              <div className="mt-3.5 text-center">
                <span className="font-black text-sm sm:text-base tracking-wider text-[#6d5df6] font-mono">
                  {telegramUsername.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Aksi: Salin & Chat Langsung */}
          <div className="w-full space-y-2.5">
            {/* Tombol Utama Buka Telegram */}
            <button
              type="button"
              onClick={handleOpenTelegram}
              className="w-full group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition-all duration-300 hover:from-purple-500 hover:to-sky-500 hover:shadow-xl hover:shadow-purple-500/40 active:scale-[0.98] cursor-pointer"
            >
              <svg
                className="size-5 fill-white transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.94z" />
              </svg>
              <span>Chat via Telegram (@winterhere)</span>
              <ExternalLink className="size-4 opacity-80" />
            </button>

            {/* Tombol Copy Link QR */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors active:scale-[0.98] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tautan Berhasil Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-zinc-400" />
                  <span>Salin Tautan Telegram</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[0.72rem] text-zinc-400">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Respon Cepat &amp; Terverifikasi 24 Jam</span>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
