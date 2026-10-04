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
import { cn, formatIDR, formatRupiah } from "@/lib/utils";
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
  const [amountInput, setAmountInput] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const prevOpenRef = React.useRef(false);

  // Load saved preferences and initialize amount when modal opens
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (balance > 0) {
        setAmountInput(formatRupiah(balance));
      } else {
        setAmountInput("");
      }

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
    prevOpenRef.current = open;
  }, [open, initialMethod, balance]);

  const withdrawAmount = React.useMemo(() => {
    const digitsOnly = amountInput.replace(/[^0-9]/g, "");
    return digitsOnly ? parseInt(digitsOnly, 10) : 0;
  }, [amountInput]);

  const config = EWALLET_CONFIGS[selectedMethod];
  const currentNumber = accountNumbers[selectedMethod] || "";
  const phoneValid = /^08\d{8,11}$/.test(currentNumber.trim());

  // Pajak transfer: GoPay & OVO Rp 1.000, DANA & ShopeePay Rp 0
  const taxFee = config.hasTax ? config.taxFee : 0;
  const netAmount = Math.max(withdrawAmount - taxFee, 0);
  const reached = balance >= minimum && balance > 0;
  const remaining = Math.max(minimum - balance, 0);

  const hasStartedAmount = amountInput.length > 0;
  const isBelowMinimum = hasStartedAmount && withdrawAmount < minimum;
  const isExceedingBalance = hasStartedAmount && withdrawAmount > balance;
  const isExceedingMax = hasStartedAmount && withdrawAmount > 5000000;
  const isAmountValid =
    hasStartedAmount &&
    withdrawAmount >= minimum &&
    withdrawAmount <= balance &&
    withdrawAmount <= 5000000;

  // Tombol konfirmasi tarik hanya bisa diklik bila format nomor akun sudah benar, nominal valid, dan saldo tersedia
  const canWithdraw = isAmountValid && phoneValid && reached && !isLoading;

  const hasStartedTyping = currentNumber.length > 0;
  const isPrefixInvalid = hasStartedTyping && !currentNumber.startsWith("08");
  const isTooShort = hasStartedTyping && currentNumber.startsWith("08") && currentNumber.length < 10;

  // Quick preset options
  const presets = React.useMemo(() => {
    const common = [5000, 10000, 20000, 50000, 100000];
    return common.filter((p) => p >= minimum && p <= balance);
  }, [minimum, balance]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
    if (!digitsOnly) {
      setAmountInput("");
      return;
    }
    const capped = digitsOnly.slice(0, 10);
    const num = parseInt(capped, 10);
    if (isNaN(num)) {
      setAmountInput("");
      return;
    }
    setAmountInput(formatRupiah(num));
  };

  const handleSetMaxAmount = () => {
    if (balance > 0) {
      setAmountInput(formatRupiah(balance));
    }
  };

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

    if (!hasStartedAmount || withdrawAmount < minimum) {
      toast.error("Nominal penarikan kurang", {
        description: `Minimal penarikan adalah ${formatIDR(minimum)}.`,
      });
      return;
    }

    if (withdrawAmount > balance) {
      toast.error("Saldo tidak mencukupi", {
        description: `Nominal penarikan (${formatIDR(withdrawAmount)}) melebihi saldo tersedia (${formatIDR(balance)}).`,
      });
      return;
    }

    if (withdrawAmount > 5000000) {
      toast.error("Melebihi batas maksimal", {
        description: "Batas maksimal penarikan instan adalah Rp5.000.000 per transaksi.",
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
            amount: withdrawAmount,
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
          description: `Penarikan ${formatIDR(withdrawAmount)} ke ${config.name} (${currentNumber}) sedang diproses.`,
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
              Pilih E-Wallet tujuan kamu.
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
        {/* Info Saldo & Input Penarikan Langsung di Saldo Tersedia */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-bold tracking-wider text-sky-700 uppercase">
                Saldo Tersedia
              </p>
              <p className="text-sm font-bold text-sky-600 tabular-nums">
                {formatIDR(balance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.68rem] font-bold tracking-wider text-sky-700 uppercase">
                Minimal Penarikan
              </p>
              <p className="text-sm font-bold text-sky-600 tabular-nums">
                {formatIDR(minimum)}
              </p>
            </div>
          </div>

          {/* Input Nominal Langsung pada Saldo Tersedia dengan Rp di samping input */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="tarik-saldo-input"
              className="flex h-12 items-center justify-center px-3.5 rounded-2xl border border-sky-200/90 bg-white font-bold text-base text-sky-800 shadow-2xs select-none shrink-0 cursor-pointer"
            >
              Rp
            </label>
            <div className="relative flex-1">
              <Input
                id="tarik-saldo-input"
                type="text"
                inputMode="numeric"
                placeholder={`Minimal ${formatRupiah(minimum)}`}
                value={amountInput}
                onChange={handleAmountChange}
                className={cn(
                  "font-black text-xl h-12 bg-white text-ink-900 tabular-nums border-sky-200/90 shadow-2xs focus:bg-white px-4",
                  hasStartedAmount && !isAmountValid && "border-rose-400 focus-visible:ring-rose-200"
                )}
              />
            </div>
          </div>

          {/* Quick preset chips */}
          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[0.68rem] text-ink-400 font-medium mr-0.5">Pilihan Cepat:</span>
              {presets.map((val) => {
                const isSelected = withdrawAmount === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountInput(formatRupiah(val))}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer active:scale-95",
                      isSelected
                        ? "bg-sky-500 text-white border-sky-500 shadow-2xs"
                        : "bg-white text-ink-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50"
                    )}
                  >
                    {formatIDR(val)}
                  </button>
                );
              })}
              {balance > 0 && !presets.includes(balance) && (
                <button
                  type="button"
                  onClick={handleSetMaxAmount}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer active:scale-95",
                    withdrawAmount === balance
                      ? "bg-sky-500 text-white border-sky-500 shadow-2xs"
                      : "bg-white text-ink-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50"
                  )}
                >
                  Semua ({formatIDR(balance)})
                </button>
              )}
            </div>
          )}

          {/* Real-time Validation Helper */}
          {hasStartedAmount && isExceedingBalance && (
            <p className="text-[0.72rem] text-rose-600 font-semibold flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              Nominal melebihi saldo tersedia (maksimal {formatIDR(balance)})
            </p>
          )}
          {hasStartedAmount && isBelowMinimum && (
            <p className="text-[0.72rem] text-amber-600 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 shrink-0" />
              Nominal minimal penarikan adalah {formatIDR(minimum)}
            </p>
          )}
          {hasStartedAmount && isExceedingMax && (
            <p className="text-[0.72rem] text-rose-600 font-semibold flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              Maksimal penarikan instan adalah Rp5.000.000
            </p>
          )}
          {!hasStartedAmount && (
            <p className="text-[0.7rem] text-ink-500">
              {reached
                ? "Saldo sudah mencukupi untuk melakukan penarikan."
                : `Kurang ${formatIDR(remaining)} lagi untuk mencapai batas minimal penarikan.`}
            </p>
          )}
        </div>

        {/* Pilihan E-Wallet */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <label className="text-[0.76rem] font-bold text-ink-900">
              Pilih E-Wallet
            </label>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50/90 px-2.5 py-1 text-xs sm:text-[0.82rem] font-bold text-amber-800 shadow-2xs">
              <span className="size-1.5 rounded-full bg-amber-500" />
              Gopay dan Ovo dikenakan pajak transfer 1000
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
              {formatIDR(withdrawAmount)}
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

