"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { AuthCard } from "./login/auth-card";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { PlayCircle, X, Sparkles, Copy, Send, Wallet, ArrowRight } from "lucide-react";
import { useUserProfile } from "@/context/user-profile-context";
import { formatIDR } from "@/lib/utils";

interface LandingViewProps {
  onAuthSuccess?: () => void;
  defaultModalMode?: "login" | "register" | null;
}

export function LandingView({
  onAuthSuccess,
  defaultModalMode = null,
}: LandingViewProps) {
  const { siteConfig } = useUserProfile();
  const [authModal, setAuthModal] = React.useState<{
    open: boolean;
    mode: "login" | "register";
  }>({
    open: Boolean(defaultModalMode),
    mode: defaultModalMode || "register",
  });

  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);
  const pricePerGmail = siteConfig?.price_per_gmail || 4500;

  const openAuth = (mode: "login" | "register") => {
    setAuthModal({ open: true, mode });
  };

  const closeAuth = () => {
    setAuthModal((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#07080d] text-[#f8fafc] select-none">
      {/* 1 Page Dark Fullscreen View */}
      <CinematicFooter
        singlePage={true}
        giantText="SETOR GMAIL"
        onPill1Click={() => openAuth("login")}
        onPill2Click={() => openAuth("register")}
        onTutorialClick={() => setIsTutorialOpen(true)}
        craftedByText="Winter"
        siteConfig={siteConfig}
      />

      {/* POPUP MODAL: Masuk & Daftar Akun */}
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
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
              window.location.href = "/";
            }
          }}
        />
      </Modal>

      {/* POPUP MODAL: Panduan Cara Kerja (Visual & Mudah Dipahami) */}
      <Modal
        open={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        labelledBy="tutorial-modal-title"
      >
        <div className="relative p-5 sm:p-7 text-white bg-[#10121a]">
          <button
            type="button"
            onClick={() => setIsTutorialOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-5 pr-8">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/25">
              <PlayCircle className="size-6" />
            </span>
            <div>
              <h3 id="tutorial-modal-title" className="text-lg font-black text-white tracking-tight">
                Cara Kerja Setor Gmail
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                4 langkah mudah ubah akun Gmail baru jadi saldo e-wallet
              </p>
            </div>
          </div>

          <div className="space-y-3 my-5 text-sm">
            <div className="flex items-start gap-3.5 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                <Sparkles className="size-4" />
              </span>
              <div>
                <strong className="block text-white text-xs sm:text-sm">1. Generate Nama Unik</strong>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Daftar/Masuk ke akunmu, buka menu <strong>Setor</strong>, lalu klik tombol <strong>Generate Gmail</strong> untuk mendapatkan nama akun &amp; password wajib.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400">
                <Copy className="size-4" />
              </span>
              <div>
                <strong className="block text-white text-xs sm:text-sm">2. Buat Akun Gmail Baru di Google</strong>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Daftarkan akun Gmail baru secara manual sesuai persis dengan nama hasil generate, umur 18+, dan tanpa nomor/email pemulihan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Send className="size-4" />
              </span>
              <div>
                <strong className="block text-white text-xs sm:text-sm">3. Cek Status LIVE &amp; Setorkan</strong>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Tempel daftar Gmail ke kolom setoran, klik <strong>Cek Status</strong> untuk memastikan akun sudah aktif, lalu klik <strong>Kirim Setoran</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl bg-emerald-950/40 p-3.5 border border-emerald-500/30">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Wallet className="size-4" />
              </span>
              <div>
                <strong className="block text-emerald-300 text-xs sm:text-sm">
                  4. Terima {formatIDR(pricePerGmail)}/Akun &amp; Tarik Saldo
                </strong>
                <p className="text-xs text-emerald-200/85 mt-0.5 leading-relaxed">
                  Begitu setoran diterima admin, saldo otomatis masuk ke dompetmu dan siap dicairkan ke DANA, GoPay, OVO, atau ShopeePay!
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
            className="btn-shimmer w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white font-extrabold text-sm shadow-lg shadow-sky-500/30 hover:shadow-sky-500/45 transition-all active:scale-[0.99] cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Mulai Daftar Gratis Sekarang</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default LandingView;
