"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Banknote,
  BanknoteArrowUp,
  LoaderCircle,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Modal, ModalCloseButton } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatIDR } from "@/lib/utils";
import {
  EWALLET_CONFIGS,
  EWALLET_ORDER,
  IndonesiaFlag,
  type EWalletMethod,
} from "@/components/ui/ewallet-logos";
import {
  getStoredEWalletData,
  saveStoredEWalletData,
} from "@/lib/generated-storage";
import { getCurrentAuthUser, insertWithdrawalRequest } from "@/lib/supabase";

const PHONE_MAX_LENGTH = 13;

interface TarikSaldoModalProps {
  open: boolean;
  onClose: () => void;
  balance?: number;
  minimum?: number;
  initialMethod?: EWalletMethod;
  onSuccess?: () => void;
}

export function TarikSaldoModal({
  open,
  onClose,
  balance = 0,
  minimum = 5000,
  initialMethod = "DANA",
  onSuccess,
}: TarikSaldoModalProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<EWalletMethod>(initialMethod);
  const [accountNumbers, setAccountNumbers] = React.useState<Record<EWalletMethod, string>>({
    DANA: "",
    OVO: "",
    GOPAY: "",
    SHOPEEPAY: "",
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Load saved preferences on modal open
  React.useEffect(() => {
    if (open) {
      const stored = getStoredEWalletData();
      if (stored) {
        setSelectedMethod(initialMethod || "DANA");
        const cleanAccounts: Record<EWalletMethod, string> = {
          DANA: "",
          SHOPEEPAY: "",
          GOPAY: "",
          OVO: "",
        };
        if (stored.accounts) {
          for (const [k, v] of Object.entries(stored.accounts)) {
            const str = typeof v === "string" ? v.trim() : "";
            if (str && str !== "081234567890" && str !== "08123456789") {
              cleanAccounts[k as EWalletMethod] = str;
            }
          }
        }
        setAccountNumbers((prev) => ({
          ...prev,
          ...cleanAccounts,
        }));
      }
    }
  }, [open, initialMethod]);

  const config = EWALLET_CONFIGS[selectedMethod];
  const currentNumber = accountNumbers[selectedMethod] || "";
  const phoneValid = /^08\d{8,11}$/.test(currentNumber.trim());

  // Pajak transfer: GoPay & OVO Rp 1.000, DANA & ShopeePay Rp 0
  const taxFee = config.hasTax ? config.taxFee : 0;
  const netAmount = Math.max(balance - taxFee, 0);
  const reached = balance >= minimum && balance > 0;
  // Tombol konfirmasi tarik hanya bisa diklik bila format nomor akun sudah benar dan saldo tersedia
  const canWithdraw = reached && phoneValid;
  const remaining = Math.max(minimum - balance, 0);

  const hasStartedTyping = currentNumber.length > 0;
  const isPrefixInvalid = hasStartedTyping && !currentNumber.startsWith("08");
  const isTooShort = hasStartedTyping && currentNumber.startsWith("08") && currentNumber.length < 10;

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
    const capped = digitsOnly.slice(0, PHONE_MAX_LENGTH);
    setAccountNumbers((prev) => ({
      ...prev,
      [selectedMethod]: capped,
    }));
  };

  const handleSelectMethod = (method: EWalletMethod) => {
    setSelectedMethod(method);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentNumber.startsWith("08")) {
      toast.error(`Nomor ${config.name} tidak valid`, {
        description: "Angka depan nomor harus diawali 08 (contoh: 0812xxxxxxxx).",
      });
      return;
    }

    if (currentNumber.length < 10) {
      toast.error(`Nomor ${config.name} terlalu pendek`, {
        description: `Nomor akun minimal 10 digit (saat ini ${currentNumber.length} digit).`,
      });
      return;
    }

    if (!phoneValid) {
      toast.error(`Nomor ${config.name} tidak valid`, {
        description: "Gunakan format 08xxxxxxxxxx (10–13 digit).",
      });
      return;
    }

    if (!reached) {
      toast.error("Saldo belum mencukupi", {
        description: `Minimal penarikan adalah ${formatIDR(minimum)}. Saldo kamu saat ini ${formatIDR(balance)}.`,
      });
      return;
    }

    setIsLoading(true);

    // Save preferences locally
    saveStoredEWalletData({
      defaultMethod: selectedMethod,
      accounts: accountNumbers,
    });

    (async () => {
      try {
        const user = await getCurrentAuthUser();
        if (user) {
          const res = await insertWithdrawalRequest(user.id, {
            amount: balance,
            taxFee,
            netAmount,
            method: selectedMethod,
            accountNumber: currentNumber,
          });

          if (!res.success) {
            toast.error("Penarikan gagal", {
              description: res.error || "Gagal memproses penarikan saldo.",
            });
            return;
          }
        }

        onSuccess?.();
        onClose();

        toast.success("Permintaan penarikan dikirim!", {
          description: `Penarikan ${formatIDR(balance)} ke ${config.name} (${currentNumber}) sedang diproses.`,
        });
      } catch (err) {
        console.warn("Supabase withdrawal error:", err);
        toast.error("Penarikan gagal", {
          description: "Terjadi gangguan sistem. Silakan coba beberapa saat lagi.",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="tarik-saldo-title">
      {/* Header */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 px-5 py-5 md:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-10 size-32 rounded-full bg-white/15 blur-2xl"
        />
        <div className="relative flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm">
            <Banknote className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[0.62rem] font-bold tracking-wider text-white uppercase">
              Tarik Saldo E-Wallet
            </span>
            <h2
              id="tarik-saldo-title"
              className="mt-1 text-lg font-bold tracking-tight text-white"
            >
              Penarikan ke {config.name}
            </h2>
            <p className="mt-0.5 text-[0.76rem] leading-relaxed text-white/85">
              Pilih E-Wallet tujuan kamu (DANA, ShopeePay, GoPay, atau OVO).
            </p>
          </div>
          <ModalCloseButton onClick={onClose} label="Tutup Tarik Saldo" />
        </div>
      </div>

      {/* Body */}
      <form
        onSubmit={handleWithdraw}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6"
      >
        {/* Info Saldo & Minimal Penarikan */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-bold tracking-wider text-ink-500 uppercase">
                Saldo Tersedia
              </p>
              <p className="mt-0.5 text-2xl font-black text-ink-900 tabular-nums">
                {formatIDR(balance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.68rem] font-bold tracking-wider text-sky-700 uppercase">
                Minimal Penarikan
              </p>
              <p className="mt-0.5 text-base font-bold text-sky-600 tabular-nums">
                {formatIDR(minimum)}
              </p>
            </div>
          </div>

          <p className="mt-2.5 text-[0.73rem] text-ink-600 border-t border-sky-100 pt-2.5">
            {reached ? (
              <span className="font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Saldo sudah mencukupi untuk melakukan penarikan.
              </span>
            ) : (
              <span>
                Kurang <strong className="font-semibold text-ink-800">{formatIDR(remaining)}</strong> lagi untuk mencapai batas minimal penarikan.
              </span>
            )}
          </p>
        </div>

        {/* Pilihan E-Wallet */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <label className="text-[0.76rem] font-bold text-ink-900">
              Pilih E-Wallet
            </label>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50/90 px-2.5 py-1 text-xs sm:text-[0.82rem] font-bold text-amber-800 shadow-2xs">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Gopay dan Ovo pajak transfer 1000
            </span>
          </div>
          {/* Urutan E-Wallet: Dana / ShopeePay / GoPay / OVO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EWALLET_ORDER.map((methodKey) => {
              const item = EWALLET_CONFIGS[methodKey];
              const isSelected = selectedMethod === methodKey;

              return (
                <button
                  key={methodKey}
                  type="button"
                  onClick={() => handleSelectMethod(methodKey)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer active:scale-98",
                    isSelected
                      ? item.activeClass
                      : item.inactiveClass
                  )}
                >
                  <span>{item.name}</span>
                  {isSelected && (
                    <CheckCircle2 className="size-3.5 ml-0.5 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Nomor E-Wallet dengan Logo Indo di Sampingnya (tanpa +62) */}
        <div>
          <label
            htmlFor="tarik-ewallet-number"
            className="block text-[0.78rem] font-bold text-ink-800 mb-1.5"
          >
            Nomor {config.name} Penerima
          </label>
          <div className="flex items-center gap-2">
            {/* Hanya Logo Indo tanpa +62 */}
            <div
              className="flex items-center justify-center size-10 bg-slate-50 border border-slate-200 rounded-xl shrink-0 select-none shadow-2xs"
              title="Indonesia"
            >
              <IndonesiaFlag className="w-5.5 h-3.5" />
            </div>
            <div className="relative flex-1">
              <Input
                id="tarik-ewallet-number"
                type="tel"
                inputMode="numeric"
                placeholder={config.placeholder}
                value={currentNumber}
                onChange={handleNumberChange}
                maxLength={PHONE_MAX_LENGTH}
                className={cn(
                  "font-mono text-sm h-10",
                  hasStartedTyping && !phoneValid && "border-rose-400 focus-visible:ring-rose-200"
                )}
              />
            </div>
          </div>

          {/* Notifikasi Real-time Format Nomor Akun */}
          {isPrefixInvalid && (
            <p className="mt-1.5 text-[0.72rem] text-rose-600 font-semibold flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              Angka depan harus diawali 08
            </p>
          )}
          {isTooShort && (
            <p className="mt-1.5 text-[0.72rem] text-amber-600 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 shrink-0" />
              Nomor kurang dari 10 digit (saat ini {currentNumber.length} digit, minimal 10 digit)
            </p>
          )}
          {phoneValid && (
            <p className="mt-1.5 text-[0.72rem] text-emerald-600 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 shrink-0" />
              Format nomor {config.name} sudah benar ({currentNumber.length} digit)
            </p>
          )}
          {!hasStartedTyping && (
            <p className="mt-1.5 text-[0.7rem] text-ink-500">
              Nomor akun {config.name} harus diawali 08 dan memiliki 10–13 digit angka.
            </p>
          )}
        </div>

        {/* Rincian Penarikan */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2 text-xs">
          <p className="font-bold text-ink-900 border-b border-slate-200/70 pb-1.5">
            Rincian Penarikan
          </p>
          <div className="flex justify-between text-ink-600">
            <span>Metode Penarikan</span>
            <span className="font-bold" style={{ color: config.brandColor }}>
              {config.name}
            </span>
          </div>
          <div className="flex justify-between text-ink-600">
            <span>Saldo Ditarik</span>
            <span className="font-semibold text-ink-900 tabular-nums">
              {formatIDR(balance)}
            </span>
          </div>
          {taxFee > 0 && (
            <div className="flex justify-between text-ink-600">
              <span>Pajak Transfer</span>
              <span className="font-semibold text-amber-600 tabular-nums">
                -{formatIDR(taxFee)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-ink-900 font-bold border-t border-slate-200/70 pt-2 text-[0.84rem]">
            <span>Estimasi Diterima</span>
            <span className="text-emerald-700 font-black tabular-nums">
              {formatIDR(netAmount)}
            </span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !canWithdraw}
            leftIcon={
              isLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <BanknoteArrowUp className="size-4" />
              )
            }
            className={cn(
              "font-semibold transition-all",
              canWithdraw
                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 cursor-pointer active:scale-98"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            )}
          >
            {isLoading ? "Memproses..." : "Konfirmasi Tarik"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
