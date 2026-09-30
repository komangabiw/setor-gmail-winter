"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Info, Scale, Sparkles, TriangleAlert } from "lucide-react";
import { Modal, ModalCloseButton } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  const router = useRouter();

  const handleProceed = () => {
    onClose();
    router.push("/setor");
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="rules-modal-title">
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-sky-500 to-brand-600 px-5 py-5 md:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 size-32 rounded-full bg-white/15 blur-2xl"
        />
        <div className="relative flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm">
            <Scale className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[0.62rem] font-bold tracking-wider text-amber-950 uppercase shadow-xs">
              <Sparkles className="size-3" />
              Wajib Baca
            </span>
            <h2
              id="rules-modal-title"
              className="mt-1.5 text-lg font-bold tracking-tight text-white"
            >
              Rules Setoran
            </h2>
            <p className="mt-1 text-[0.76rem] leading-relaxed text-white/85">
              Baca dan pahami seluruh ketentuan berikut sebelum melakukan
              setoran.
            </p>
          </div>
          <ModalCloseButton onClick={onClose} label="Tutup Rules Setoran" />
        </div>
      </div>

      {/* Rules as stylish bullet points without numeric 1-7, vertically centered */}
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-5 md:px-6">
        {RULES.map((ruleItem, index) => (
          <li
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 transition-colors hover:border-sky-200 hover:bg-sky-50/30"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-brand-600 text-white shadow-xs">
              <CheckCircle2 className="size-3.5 stroke-[2.5]" aria-hidden="true" />
            </span>
            <div className="text-[0.8rem] leading-relaxed text-ink-700">
              {ruleItem.type === "password" ? (
                <>
                  Password Gmail wajib menggunakan:{" "}
                  <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 font-mono text-[0.82rem] font-extrabold text-amber-900 shadow-xs">
                    winter1234
                  </span>{" "}
                  <span className="font-bold text-rose-600">
                    (huruf kecil semua)
                  </span>
                  .
                </>
              ) : ruleItem.type === "check_url" ? (
                <>
                  Sebelum melakukan setoran, cek status Gmail di{" "}
                  <Link
                    href="/checker"
                    onClick={onClose}
                    className="font-bold text-sky-600 underline underline-offset-2 transition-colors hover:text-sky-700"
                  >
                    disini
                  </Link>
                </>
              ) : (
                ruleItem.text
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Notes */}
      <div className="shrink-0 space-y-2.5 border-t border-slate-100 bg-amber-50/70 px-5 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <TriangleAlert
            className="size-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <p className="text-[0.75rem] font-bold tracking-wide text-amber-900 uppercase">
            Catatan Tambahan
          </p>
        </div>
        <ul className="space-y-1.5">
          {NOTES.map((note) => (
            <li
              key={note}
              className="flex items-start gap-2 text-[0.73rem] leading-relaxed text-amber-900/85"
            >
              <span
                aria-hidden="true"
                className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-amber-500"
              />
              {note}
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 md:px-6">
        <p className="hidden items-center gap-1.5 text-[0.7rem] leading-tight text-ink-400 sm:flex">
          <Info className="size-3.5 shrink-0" aria-hidden="true" />
          Pelanggaran rules -&gt; ditolak
        </p>
        <Button
          type="button"
          onClick={handleProceed}
          fullWidth
          className="sm:w-auto"
          rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
        >
          Saya sudah paham, lanjut setor
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
  { type: "text", text: "Gmail harus Fresh (baru dibuat)." },
  {
    type: "text",
    text: "Nama Gmail yang didaftarkan wajib sama persis dengan nama Gmail hasil Generate di website. Tidak boleh mengubah, menambah, atau mengurangi karakter apa pun.",
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
  "Status di Checker hanya digunakan untuk memastikan Gmail masih aktif, bukan penentu diterima atau ditolaknya Gmail saat pengecekan admin.",
  "Gmail yang tidak sesuai rules atau berbeda dengan hasil Generate di website akan ditolak dan akun dapat diblokir oleh admin.",
];
