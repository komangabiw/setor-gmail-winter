"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Scale,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Modal, ModalCloseButton } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { defaultPassword } from "@/lib/mock-data";
import { useUserProfile } from "@/context/user-profile-context";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  const router = useRouter();
  const { siteConfig } = useUserProfile();
  const activePassword = siteConfig?.default_password || defaultPassword;
  const [copied, setCopied] = React.useState(false);

  const handleProceed = () => {
    onClose();
    router.push("/setor");
  };

  const handleCopyPwd = async () => {
    try {
      await navigator.clipboard.writeText(activePassword);
      setCopied(true);
      toast.success("Password Gmail disalin!");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Gagal menyalin password");
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="rules-modal-title">
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 px-5 py-5 md:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 size-36 rounded-full bg-white/20 blur-2xl"
        />
        <div className="relative flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm ring-1 ring-white/30">
            <Scale className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-0.5 text-[0.62rem] font-extrabold tracking-wider text-emerald-950 uppercase shadow-xs">
              <Sparkles className="size-3" />
              Wajib Baca
            </span>
            <h2
              id="rules-modal-title"
              className="mt-1.5 text-lg font-extrabold tracking-tight text-white"
            >
              Rules Setoran Gmail
            </h2>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-white/90">
              Ikuti ketentuan singkat ini agar setoranmu langsung di-ACC admin.
            </p>
          </div>
          <ModalCloseButton onClick={onClose} label="Tutup Rules Setoran" />
        </div>
      </div>

      {/* Rules list */}
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-5 md:px-6 bg-[#10121a]">
        {RULES.map((ruleItem, index) => (
          <li
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3.5 transition-colors hover:border-sky-400/25 hover:bg-white/[0.04]"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-xs">
              <CheckCircle2 className="size-3.5 stroke-[2.5]" aria-hidden="true" />
            </span>
            <div className="text-[0.8rem] leading-relaxed text-zinc-200 flex-1">
              {ruleItem.type === "password" ? (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span>Password Gmail wajib menggunakan:</span>
                  <button
                    type="button"
                    onClick={handleCopyPwd}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-0.5 font-mono text-[0.82rem] font-extrabold text-emerald-200 shadow-xs transition-colors cursor-pointer"
                    title="Klik untuk salin password"
                  >
                    <span>{activePassword}</span>
                    {copied ? (
                      <Check className="size-3 text-emerald-300" />
                    ) : (
                      <Copy className="size-3 text-emerald-300" />
                    )}
                  </button>
                  <span className="font-bold text-rose-400">(huruf kecil semua)</span>
                </span>
              ) : ruleItem.type === "check_url" ? (
                <>
                  Sebelum melakukan setoran, cek status Gmail di{" "}
                  <Link
                    href="/checker"
                    onClick={onClose}
                    className="font-bold text-sky-400 underline underline-offset-2 transition-colors hover:text-sky-300"
                  >
                    halaman Checker
                  </Link>{" "}
                  atau langsung di kolom Setor.
                </>
              ) : (
                ruleItem.text
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Notes */}
      <div className="shrink-0 space-y-2.5 border-t border-emerald-500/30 bg-emerald-950/35 px-5 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <TriangleAlert
            className="size-4 shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          <p className="text-[0.74rem] font-extrabold tracking-wide text-emerald-300 uppercase">
            Catatan Keamanan &amp; Anti-Abuse
          </p>
        </div>
        <ul className="space-y-1.5">
          {NOTES.map((note) => (
            <li
              key={note}
              className="flex items-start gap-2 text-[0.72rem] leading-relaxed text-emerald-200/90"
            >
              <span
                aria-hidden="true"
                className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-emerald-400"
              />
              {note}
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#10121a] px-5 py-4 md:px-6">
        <p className="hidden items-center gap-1.5 text-[0.7rem] leading-tight text-zinc-400 sm:flex">
          <Info className="size-3.5 shrink-0 text-sky-400" aria-hidden="true" />
          Pelanggaran rules berisiko ditolak
        </p>
        <Button
          type="button"
          onClick={handleProceed}
          fullWidth
          className="btn-shimmer sm:w-auto bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-bold"
          rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
        >
          Saya Paham, Lanjut Setor
        </Button>
      </div>
    </Modal>
  );
}

const RULES: Array<
  | { type: "text"; text: string }
  | { type: "password" }
  | { type: "check_url" }
> = [
  { type: "text", text: "Wajib Fresh: Akun harus baru dibuat secara manual." },
  {
    type: "text",
    text: "Nama Akun Sama Persis: Huruf dan angka pada Gmail wajib sama dengan hasil yang di-generate.",
  },
  { type: "text", text: "Tanggal lahir akun Gmail wajib 18 tahun ke atas." },
  { type: "password" },
  {
    type: "text",
    text: "Akun tidak boleh ditautkan dengan nomor pemulihan maupun Gmail pemulihan.",
  },
  { type: "check_url" },
  { type: "text", text: "Hanya kirim Gmail dengan status Live/Aktif." },
];

const NOTES = [
  "Status di Checker digunakan untuk memastikan Gmail sudah terdaftar aktif di Google sebelum disetor.",
  "Gmail yang tidak sesuai rules atau berbeda dengan hasil Generate di website akan ditolak saat peninjauan admin.",
  "Klausul Perlindungan & Anti-Abuse: Segala bentuk manipulasi bug, farming akun ganda, atau penyalahgunaan sistem akan mengakibatkan pembekuan akun permanen.",
];
