"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { AuthCard } from "./login/auth-card";
import { CinematicFooter } from "@/components/ui/motion-footer";
import { PlayCircle, X } from "lucide-react";

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
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-[#09090b] text-[#f8fafc] select-none">
      {/* 1 Page Dark Fullscreen View */}
      <CinematicFooter
        singlePage={true}
        giantText="SETOR GMAIL"
        onPill1Click={() => openAuth("login")}
        onPill2Click={() => openAuth("register")}
        craftedByText="Winter"
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

      {/* POPUP MODAL: Panduan Tutorial */}
      <Modal
        open={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        labelledBy="tutorial-modal-title"
      >
        <div className="relative p-6 sm:p-8 text-white">
          <button
            type="button"
            onClick={() => setIsTutorialOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Tutup tutorial"
          >
            <X className="size-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sky-950/60 border border-sky-800/40 text-sky-400">
              <PlayCircle className="size-6" />
            </span>
            <div>
              <h3 id="tutorial-modal-title" className="text-lg font-black text-white">
                Panduan Setor Gmail
              </h3>
              <p className="text-xs text-zinc-400">
                Langkah mudah menghasilkan saldo dari akun Gmail Anda
              </p>
            </div>
          </div>

          <div className="space-y-3.5 my-6 text-sm text-zinc-300">
            <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/80 p-3.5 border border-zinc-800">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs">
                1
              </span>
              <div>
                <strong className="block text-white">Daftar atau Masuk Akun</strong>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Buat akun gratis menggunakan email atau login instan dengan akun Google.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/80 p-3.5 border border-zinc-800">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs">
                2
              </span>
              <div>
                <strong className="block text-white">Siapkan Akun Gmail</strong>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pastikan akun Gmail aktif, terawat, dan sesuai kriteria format setoran.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/80 p-3.5 border border-zinc-800">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs">
                3
              </span>
              <div>
                <strong className="block text-white">Setorkan di Menu Setor</strong>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Kirimkan format akun pada halaman Setor untuk proses verifikasi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-emerald-950/40 p-3.5 border border-emerald-800/40">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs">
                4
              </span>
              <div>
                <strong className="block text-emerald-300">Pencairan Kilat 1-2 Menit</strong>
                <p className="text-xs text-emerald-400/90 mt-0.5">
                  Setelah ACC, saldo masuk dompet dan langsung bisa ditarik ke DANA, GoPay, atau OVO!
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
