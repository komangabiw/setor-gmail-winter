"use client";

import * as React from "react";
import {
  Mail,
  Zap,
  ShieldCheck,
  Users,
  Banknote,
  Rocket,
  LogIn,
  PlayCircle,
  ArrowRight,
  CheckCircle2,
  Heart,
  X,
  Clock,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { AuthCard } from "./login/auth-card";
import { TopTicker } from "@/components/layout/top-ticker";
import { CinematicFooter } from "@/components/ui/motion-footer";

interface LandingViewProps {
  onAuthSuccess?: () => void;
  defaultModalMode?: "login" | "register" | null;
}

export function LandingView({
  onAuthSuccess,
  defaultModalMode = null,
}: LandingViewProps) {
  const [authModal, setAuthModal] = React.useState<{
    open: boolean;
    mode: "login" | "register";
  }>({
    open: Boolean(defaultModalMode),
    mode: defaultModalMode || "register",
  });

  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);

  const openAuth = (mode: "login" | "register") => {
    setAuthModal({ open: true, mode });
  };

  const closeAuth = () => {
    setAuthModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8F9FC] text-slate-900 overflow-x-hidden font-sans select-none flex flex-col justify-between">
      {/* ------------------------------------------------------------- */}
      {/* 1. Subtle Grid Lines Background (#F8F9FC with light gray grid) */}
      {/* ------------------------------------------------------------- */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Ambient gradient glows */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-sky-200/50 via-blue-100/30 to-transparent blur-3xl -z-10" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-[300px] h-[300px] bg-sky-200/25 blur-3xl -z-10" />

      {/* ------------------------------------------------------------- */}
      {/* 2. Top Marquee Running Ticker (Iklan Berjalan) */}
      {/* ------------------------------------------------------------- */}
      <TopTicker />

      {/* ------------------------------------------------------------- */}
      {/* 3. Top Navigation Bar (SETOR GMAIL by Winter) */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-20 w-full px-4 sm:px-8 pt-4 pb-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-sky-100/80 bg-white/90 px-4 py-3 sm:px-6 shadow-sm backdrop-blur-md">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white shadow-md shadow-sky-500/25">
              <Mail className="size-4.5 sm:size-5 stroke-[2.2]" />
            </span>
            <div className="flex items-baseline gap-1.5 text-base sm:text-lg tracking-tight">
              <span className="font-black text-slate-900 tracking-tight">
                SETOR GMAIL
              </span>
              <span className="text-xs font-bold text-slate-400 lowercase">
                by
              </span>
              <span className="font-black tracking-tight bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 bg-clip-text text-transparent">
                Winter
              </span>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-100/90 transition-all active:scale-95 cursor-pointer"
            >
              <PlayCircle className="size-4" />
              <span>Tutorial</span>
            </button>

            <button
              type="button"
              onClick={() => openAuth("login")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <LogIn className="size-4" />
              <span>Masuk</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN HERO SECTION (Langsung Reveal, 1 Page Saja) */}
      {/* ------------------------------------------------------------- */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12 text-center">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1.5 shadow-xs backdrop-blur-md mb-6">
          <span className="flex size-2 rounded-full bg-sky-500 animate-ping" />
          <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-700">
            Platform Setor Gmail Terpercaya &amp; Transparan 2026
          </span>
        </div>

        {/* Headline: "Siap Ubah Gmail Jadi Penghasilan?" */}
        <h1 className="max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6">
          Siap Ubah Gmail Jadi{" "}
          <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent underline decoration-sky-300/60 decoration-wavy underline-offset-8">
            Penghasilan
          </span>
          ?
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg font-medium text-slate-600 leading-relaxed mb-8">
          Gabung bersama <strong className="text-slate-900 font-extrabold">5k+</strong> member lainnya dan nikmati verifikasi cepat dengan pencairan otomatis.
        </p>

        {/* CTA Buttons: BOLD, High-Contrast */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10 w-full max-w-xl">
          {/* 1. Primary: Daftar Akun Baru */}
          <button
            type="button"
            onClick={() => openAuth("register")}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 px-7 py-4 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-sky-400/30"
          >
            <Rocket className="size-5" />
            <span>Daftar Akun Baru</span>
            <ArrowRight className="size-4.5" />
          </button>

          {/* 2. Secondary: Masuk ke Akun */}
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 px-6 py-4 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-slate-700"
          >
            <LogIn className="size-5" />
            <span>Masuk ke Akun</span>
          </button>

          {/* 3. Tertiary: Lihat Tutorial */}
          <button
            type="button"
            onClick={() => setIsTutorialOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-700 transition-all cursor-pointer shadow-xs"
          >
            <PlayCircle className="size-4.5 text-rose-500" />
            <span>Lihat Tutorial</span>
          </button>
        </div>

        {/* Stat badges under CTA */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-bold text-slate-500 mb-12">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4.5 text-emerald-500" />
            <span>Tanpa Biaya Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4.5 text-sky-500" />
            <span>Proses Verifikasi Transparan</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4.5 text-blue-500" />
            <span>Pencairan 1-2 Menit</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COMPONENT SHOWCASE: Center Card + 4 Diagonal Floating Cards */}
        {/* ------------------------------------------------------------- */}
        <div className="relative w-full max-w-4xl py-6 px-4">
          
          {/* Container mockup */}
          <div className="relative mx-auto max-w-lg rounded-3xl border border-sky-100 bg-white/95 p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(14_165_233,0.18)] backdrop-blur-xl">
            
            {/* Center Content Card */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30">
                <Mail className="size-8 stroke-[2.2]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Setor Gmail Pro
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xs">
                Platform setoran email terpercaya &amp; transparan dengan rate harga bersaing di pasar.
              </p>

              {/* Status pill inside center card */}
              <div className="mt-5 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-bold text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Server Online &amp; Menerima Setoran
              </div>
            </div>

            {/* 4 DIAGONAL FLOATING CARDS */}
            {/* 1. Kiri Atas: "Cair 1-2 Menit" | Ikon Petir Kuning | DANA • GoPay • OVO */}
            <div className="absolute -top-6 -left-6 sm:-top-8 sm:-left-10 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-3 sm:p-3.5 shadow-[0_15px_35px_-8px_rgba(15,23,42,0.14)] border border-slate-100 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shadow-xs">
                <Zap className="size-5 fill-amber-400" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Cair 1-2 Menit
                </div>
                <div className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">
                  DANA • GoPay • OVO
                </div>
              </div>
            </div>

            {/* 2. Kanan Atas: "Rp 250.000 Cair" | Ikon Uang Hijau | 2 menit lalu */}
            <div className="absolute -top-6 -right-6 sm:-top-8 sm:-right-10 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-3 sm:p-3.5 shadow-[0_15px_35px_-8px_rgba(15,23,42,0.14)] border border-slate-100 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-xs">
                <Banknote className="size-5" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  Rp 250.000 Cair
                </div>
                <div className="text-[10.5px] sm:text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Clock className="size-3" /> 2 menit lalu
                </div>
              </div>
            </div>

            {/* 3. Kiri Bawah: "100% Aman" | Ikon Perisai Biru | SSL Terenkripsi */}
            <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-10 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-3 sm:p-3.5 shadow-[0_15px_35px_-8px_rgba(15,23,42,0.14)] border border-slate-100 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:translate-y-1">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shadow-xs">
                <ShieldCheck className="size-5" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  100% Aman
                </div>
                <div className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">
                  SSL Terenkripsi
                </div>
              </div>
            </div>

            {/* 4. Kanan Bawah: "1.2K Member" | Ikon Ungu | Aktif sekarang */}
            <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-10 z-20 rounded-2xl bg-white/95 backdrop-blur-md p-3 sm:p-3.5 shadow-[0_15px_35px_-8px_rgba(15,23,42,0.14)] border border-slate-100 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:translate-y-1">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shadow-xs">
                <Users className="size-5" />
              </div>
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  1.2K Member
                </div>
                <div className="text-[10.5px] sm:text-[11px] font-semibold text-purple-600">
                  Aktif sekarang
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ------------------------------------------------------------- */}
      {/* 5. Cinematic Motion Footer (21st.dev Style) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 w-full mt-12">
        <CinematicFooter
          directReveal={true}
          onOpenRegister={() => openAuth("register")}
          onOpenLogin={() => openAuth("login")}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          giantText="WINTER"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. POPUP MODAL untuk Masuk & Daftar */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={authModal.open}
        onClose={closeAuth}
        labelledBy="auth-modal-title"
      >
        <AuthCard
          initialMode={authModal.mode}
          isModal={true}
          onClose={closeAuth}
          onSuccess={() => {
            closeAuth();
            if (onAuthSuccess) {
              onAuthSuccess();
            }
          }}
        />
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* 7. POPUP MODAL untuk Tutorial */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        labelledBy="tutorial-modal-title"
      >
        <div className="relative p-6 sm:p-8 bg-white rounded-3xl">
          <button
            type="button"
            onClick={() => setIsTutorialOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup tutorial"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <PlayCircle className="size-6" />
            </span>
            <div>
              <h3 id="tutorial-modal-title" className="text-lg font-black text-slate-900">
                Panduan Setor Gmail
              </h3>
              <p className="text-xs text-slate-500">
                Langkah mudah menghasilkan saldo dari akun Gmail Anda
              </p>
            </div>
          </div>

          <div className="space-y-4 my-6 text-sm text-slate-700">
            <div className="flex items-start gap-3 rounded-2xl bg-sky-50/70 p-3.5 border border-sky-100">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs">
                1
              </span>
              <div>
                <strong className="block text-slate-900">Daftar atau Masuk Akun</strong>
                <p className="text-xs text-slate-600 mt-0.5">
                  Buat akun gratis menggunakan email atau login instan dengan akun Google.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-sky-50/70 p-3.5 border border-sky-100">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs">
                2
              </span>
              <div>
                <strong className="block text-slate-900">Siapkan Akun Gmail</strong>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pastikan akun Gmail aktif, tidak terkena checkpoint/banned, dan memenuhi kriteria format setoran.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-sky-50/70 p-3.5 border border-sky-100">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs">
                3
              </span>
              <div>
                <strong className="block text-slate-900">Setorkan di Menu Setor</strong>
                <p className="text-xs text-slate-600 mt-0.5">
                  Input daftar akun Gmail pada halaman Setor. Admin akan melakukan verifikasi (estimasi 1-2 hari kerja).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-100">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                4
              </span>
              <div>
                <strong className="block text-emerald-950">Pencairan Dana 1-2 Menit</strong>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Setelah diverifikasi/ACC, saldo langsung masuk ke dompet Anda dan bisa dicairkan ke DANA, GoPay, atau OVO!
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsTutorialOpen(false);
              openAuth("register");
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            Mulai Daftar Sekarang
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default LandingView;
