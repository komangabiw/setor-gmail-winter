"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Wallet,
  Smartphone,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Gift,
  Save,
  CircleCheck,
  Clock,
  ReceiptText,
  ArrowUpRight,
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status";
import { PageShell, PageHeader, Reveal, EmptyState } from "@/components/layout/page-shell";
import {
  type TransactionRecord,
  type WithdrawalRecord,
  type WithdrawalStatus,
} from "@/lib/mock-data";
import { cn, formatDateTime, formatIDR } from "@/lib/utils";
import { TarikSaldoModal } from "./tarik-saldo-modal";
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
import {
  getCurrentAuthUser,
  fetchUserWallet,
  fetchSavedEWallets,
  saveEWalletAccount,
  fetchUserWithdrawals,
  fetchUserTransactions,
} from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const withdrawalMeta: Record<
  WithdrawalStatus,
  { label: string; tone: "success" | "warning" | "info" | "danger" }
> = {
  berhasil: { label: "BERHASIL", tone: "success" },
  diproses: { label: "DIPROSES", tone: "info" },
  ditolak: { label: "DITOLAK", tone: "danger" },
};

const transactionIcons: Record<TransactionRecord["type"], LucideIcon> = {
  deposit: BanknoteArrowDown,
  withdrawal: BanknoteArrowUp,
  bonus: Gift,
};

const transactionTones: Record<TransactionRecord["type"], string> = {
  deposit: "bg-emerald-50 text-emerald-600",
  withdrawal: "bg-rose-50 text-rose-600",
  bonus: "bg-amber-50 text-amber-600",
};

type TabValue = "penarikan" | "transaksi";

const PHONE_MAX_LENGTH = 13;

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

function WithdrawalRow({ record, index }: { record: WithdrawalRecord; index: number }) {
  const meta = withdrawalMeta[record.status];
  const methodKey = (record.method || "DANA").toUpperCase() as EWalletMethod;
  const config = EWALLET_CONFIGS[methodKey] || EWALLET_CONFIGS.DANA;

  return (
    <div
      className="animate-fade-up flex items-center gap-3 px-4 py-3.5 transition-colors duration-300 hover:bg-sky-50/50 sm:gap-4 sm:px-5 md:px-6 md:py-4"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs border"
        style={{
          backgroundColor: `${config.brandColor}15`,
          color: config.brandColor,
          borderColor: `${config.brandColor}30`,
        }}
      >
        {config.name}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] font-bold text-ink-900">
          Penarikan {config.name}
        </p>
        <p className="mt-0.5 truncate text-[0.7rem] text-ink-500 font-mono">
          {record.accountNumber} · {formatDateTime(record.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[0.85rem] font-bold tracking-tight text-rose-600 tabular-nums">
          -{formatIDR(record.amount)}
        </span>
        <StatusBadge
          tone={meta.tone}
          dot
          pulse={record.status === "diproses"}
        >
          {meta.label}
        </StatusBadge>
      </div>
    </div>
  );
}

function TransactionRow({ record, index }: { record: TransactionRecord; index: number }) {
  const Icon = transactionIcons[record.type];
  const isCredit = record.type === "deposit" || record.type === "bonus";

  return (
    <div
      className="animate-fade-up flex items-center gap-3 px-4 py-3.5 transition-colors duration-300 hover:bg-sky-50/50 sm:gap-4 sm:px-5 md:px-6 md:py-4"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300",
          transactionTones[record.type],
        )}
      >
        <Icon className="size-4.5" strokeWidth={2.1} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] font-semibold text-ink-800">{record.title}</p>
        <p className="mt-0.5 truncate text-[0.7rem] text-ink-500">
          {record.description} · {formatDateTime(record.createdAt)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-[0.85rem] font-bold tracking-tight tabular-nums",
          isCredit ? "text-emerald-600" : "text-rose-600",
        )}
      >
        {isCredit ? "+" : "-"}
        {formatIDR(record.amount)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function SaldoView() {
  const [selectedMethod, setSelectedMethod] = React.useState<EWalletMethod>("DANA");
  const [accountNumbers, setAccountNumbers] = React.useState<Record<EWalletMethod, string>>({
    DANA: "",
    OVO: "",
    GOPAY: "",
    SHOPEEPAY: "",
  });
  const [wallet, setWallet] = React.useState({
    balance: 0,
    minimumWithdrawal: 5000,
    danaNumber: "",
  });
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = React.useState<TransactionRecord[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Status tersimpan per metode, hanya bernilai true setelah tombol Simpan diklik
  const [savedMethods, setSavedMethods] = React.useState<Record<EWalletMethod, boolean>>({
    DANA: false,
    SHOPEEPAY: false,
    GOPAY: false,
    OVO: false,
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [tab, setTab] = React.useState<TabValue>("transaksi");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = React.useState(false);

  // Load preferences from localStorage & Supabase
  const loadData = React.useCallback(async () => {
    try {
      const user = await getCurrentAuthUser();
      if (user) {
        setUserId(user.id);
        const [wRes, ewRes, wdRes, txRes] = await Promise.all([
          fetchUserWallet(user.id),
          fetchSavedEWallets(user.id),
          fetchUserWithdrawals(user.id),
          fetchUserTransactions(user.id),
        ]);
        if (!wRes.isFallback) {
          setWallet({
            balance: wRes.balance,
            minimumWithdrawal: wRes.minimumWithdrawal,
            danaNumber: wRes.danaNumber,
          });
        }
        if (!ewRes.isFallback) {
          // Always keep default on DANA as requested
          setSelectedMethod("DANA");
          const cleanAccounts: Record<EWalletMethod, string> = {
            DANA: "",
            SHOPEEPAY: "",
            GOPAY: "",
            OVO: "",
          };
          if (ewRes.accounts) {
            for (const [k, v] of Object.entries(ewRes.accounts)) {
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
        if (!wdRes.isFallback) {
          setWithdrawals(wdRes.withdrawals);
        }
        if (!txRes.isFallback) {
          setTransactions(txRes.transactions);
        }
        return;
      }
    } catch (e) {
      console.warn("Supabase fetch saldo error (fallback used):", e);
    }
    const stored = getStoredEWalletData();
    if (stored) {
      setSelectedMethod("DANA");
      const cleanStored: Record<EWalletMethod, string> = {
        DANA: "",
        SHOPEEPAY: "",
        GOPAY: "",
        OVO: "",
      };
      if (stored.accounts) {
        for (const [k, v] of Object.entries(stored.accounts)) {
          const str = typeof v === "string" ? v.trim() : "";
          if (str && str !== "081234567890" && str !== "08123456789") {
            cleanStored[k as EWalletMethod] = str;
          }
        }
      }
      setAccountNumbers((prev) => ({
        ...prev,
        ...cleanStored,
      }));
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const config = EWALLET_CONFIGS[selectedMethod];
  const currentNumber = accountNumbers[selectedMethod] || "";
  const phoneValid = /^08\d{8,11}$/.test(currentNumber.trim());
  const isSaved = phoneValid && Boolean(savedMethods[selectedMethod]);

  const hasStartedTyping = currentNumber.length > 0;
  const isPrefixInvalid = hasStartedTyping && !currentNumber.startsWith("08");
  const isTooShort = hasStartedTyping && currentNumber.startsWith("08") && currentNumber.length < 10;

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/[^0-9]/g, "");
    const capped = digitsOnly.slice(0, PHONE_MAX_LENGTH);
    setAccountNumbers((prev) => ({
      ...prev,
      [selectedMethod]: capped,
    }));
    // Reset status tersimpan saat mengedit nomor
    setSavedMethods((prev) => ({
      ...prev,
      [selectedMethod]: false,
    }));
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

    setIsSaving(true);
    saveStoredEWalletData({
      defaultMethod: selectedMethod,
      accounts: accountNumbers,
    });

    (async () => {
      try {
        if (userId) {
          await saveEWalletAccount(userId, selectedMethod, currentNumber, true);
        }
      } catch (err) {
        console.warn("Supabase save ewallet error:", err);
      } finally {
        setIsSaving(false);
        setSavedMethods((prev) => ({
          ...prev,
          [selectedMethod]: true,
        }));
        toast.success(`Pengaturan ${config.name} tersimpan!`, {
          description: `Nomor: ${currentNumber} ditetapkan sebagai E-Wallet utama.`,
        });
      }
    })();
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "transaksi", label: "Transaksi" },
    { value: "penarikan", label: "Penarikan" },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Saldo & Penarikan"
        subtitle="Kelola saldo, pilihan e-wallet penarikan, dan riwayat mutasi kamu."
        right={
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-card">
            <Wallet className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
        }
      />

      {/* 1 Table / Card Terpadu: Saldo Saat Ini & Pilihan E-Wallet Penarikan */}
      <Reveal delay={40} className="w-full">
        <Card className="relative overflow-hidden border border-slate-200/90 bg-white shadow-card rounded-3xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-gradient-to-br from-sky-100/70 to-brand-100/40 blur-3xl"
          />

          <div className="relative p-5 sm:p-6 md:p-7">
            {/* Baris Atas: Saldo Saat Ini & Tombol Tarik Saldo */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-[0.72rem] font-bold tracking-wider text-ink-500 uppercase">
                  Saldo Saat Ini
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <span className="text-[2.2rem] sm:text-[2.6rem] font-black tracking-tight text-ink-900 tabular-nums leading-none">
                    {formatIDR(wallet.balance)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50/80 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                    <Target className="size-3 text-sky-600" aria-hidden="true" />
                    Minimal Penarikan: {formatIDR(wallet.minimumWithdrawal)}
                  </span>
                </div>
              </div>

              <div>
                <Button
                  size="lg"
                  className="shadow-md shadow-sky-500/20 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl px-6 py-2.5 cursor-pointer"
                  onClick={() => setIsWithdrawModalOpen(true)}
                  leftIcon={<ArrowUpRight className="size-4" aria-hidden="true" />}
                >
                  Tarik Saldo
                </Button>
              </div>
            </div>

            {/* Baris Bawah: Pilihan E-Wallet & Form Input Nomor */}
            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Smartphone className="size-3.5" aria-hidden="true" />
                  </span>
                  <label className="text-xs sm:text-sm font-bold text-ink-900">
                    Pilih E-Wallet
                  </label>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50/90 px-2.5 py-1 text-xs sm:text-[0.82rem] font-bold text-amber-800 shadow-2xs">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Gopay dan Ovo pajak transfer 1000
                </span>
              </div>

              {/* 4 E-Wallet Buttons: Dana -> ShopeePay -> GoPay -> OVO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {EWALLET_ORDER.map((methodKey) => {
                  const item = EWALLET_CONFIGS[methodKey];
                  const isSelected = selectedMethod === methodKey;

                  return (
                    <button
                      key={methodKey}
                      type="button"
                      onClick={() => setSelectedMethod(methodKey)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer active:scale-98",
                        isSelected
                          ? item.activeClass
                          : item.inactiveClass
                      )}
                    >
                      <span>{item.name}</span>
                      {isSelected && (
                        <CheckCircle2
                          className="size-3.5 ml-0.5 text-white"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Input Nomor E-Wallet & Tombol Simpan */}
              <div className="pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex items-center gap-2 flex-1">
                    {/* Hanya Logo Indo tanpa +62 */}
                    <div
                      className="flex items-center justify-center size-10.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0 select-none shadow-2xs"
                      title="Indonesia"
                    >
                      <IndonesiaFlag className="w-5.5 h-3.5" />
                    </div>
                    <div className="relative flex-1">
                      <Input
                        id="saldo-ewallet-number"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="tel"
                        maxLength={PHONE_MAX_LENGTH}
                        placeholder={config.placeholder}
                        value={currentNumber}
                        onChange={handlePhoneChange}
                        aria-invalid={hasStartedTyping && !phoneValid}
                        className={cn(
                          "font-mono text-xs sm:text-sm h-10.5 rounded-xl border-slate-200",
                          hasStartedTyping && !phoneValid && "border-rose-400 focus-visible:ring-rose-200"
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant={isSaved ? "primary" : "secondary"}
                    size="md"
                    isLoading={isSaving}
                    leftIcon={
                      isSaved ? (
                        <CircleCheck className="size-4 text-white" aria-hidden="true" />
                      ) : (
                        <Save className="size-4" aria-hidden="true" />
                      )
                    }
                    className={cn(
                      "shrink-0 h-10.5 font-bold rounded-xl px-5 text-xs sm:text-sm cursor-pointer transition-all",
                      isSaved
                        ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20 active:scale-98"
                        : "border-slate-200"
                    )}
                  >
                    {isSaved ? `Nomor ${config.name} Tersimpan` : `Simpan Akun ${config.name}`}
                  </Button>
                </div>

                {/* Notifikasi Real-time Validasi Format Nomor */}
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
                  <p className="mt-1.5 text-[0.68rem] text-emerald-600 font-semibold flex items-center gap-1">
                    <CircleCheck className="size-3" /> {isSaved ? `Nomor akun ${config.name} valid dan tersimpan.` : `Format nomor ${config.name} valid (${currentNumber.length} digit).`}
                  </p>
                )}
                {!hasStartedTyping && (
                  <p className="mt-1.5 text-[0.7rem] text-ink-500">
                    Nomor akun {config.name} harus diawali 08 dan memiliki 10–13 digit angka.
                  </p>
                )}
              </div>
            </form>
          </div>
        </Card>
      </Reveal>

      {/* Tabs + tables */}
      <Reveal delay={190} className="mt-5">
        <div className="flex gap-1 rounded-full bg-sky-100/70 p-1 md:gap-1.5 md:p-1.5">
          {tabs.map((item) => {
            const isActive = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                aria-pressed={isActive}
                className={cn(
                  "flex-1 rounded-full px-3 py-2 text-[0.82rem] font-semibold transition-[background-color,color,box-shadow] duration-300 md:py-2.5 md:text-[0.88rem]",
                  isActive
                    ? "bg-white text-brand-700 shadow-[0_2px_8px_-2px_rgb(14_165_233/0.35)]"
                    : "text-ink-500 hover:text-ink-700"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={230} className="mt-4">
        {tab === "penarikan" ? (
          <WithdrawalList items={withdrawals} />
        ) : (
          <TransactionList items={transactions} />
        )}
      </Reveal>

      {/* Modal Penarikan Saldo */}
      <TarikSaldoModal
        open={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        balance={wallet.balance}
        minimum={wallet.minimumWithdrawal}
        initialMethod={selectedMethod}
        onSuccess={loadData}
      />
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

function WithdrawalList({ items }: { items: WithdrawalRecord[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="size-6" aria-hidden="true" />}
        title="Belum ada penarikan"
        description="Riwayat penarikan saldo kamu akan tampil di sini."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5 md:px-6 md:py-4">
        <p className="text-[0.8rem] font-semibold text-ink-800">Riwayat Penarikan</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold text-ink-500 tabular-nums">
          {items.length} data
        </span>
      </div>
      <div className="divide-y divide-slate-100/90">
        {items.map((record, index) => (
          <WithdrawalRow key={record.id} record={record} index={index} />
        ))}
      </div>
    </Card>
  );
}

function TransactionList({ items }: { items: TransactionRecord[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText className="size-7 text-sky-600" strokeWidth={1.8} aria-hidden="true" />}
        title="Belum ada transaksi"
        description="Semua aktivitas saldo akan tercatat di sini."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5 md:px-6 md:py-4">
        <p className="text-[0.8rem] font-semibold text-ink-800">Riwayat Transaksi</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.68rem] font-semibold text-ink-500 tabular-nums">
          {items.length} data
        </span>
      </div>
      <div className="divide-y divide-slate-100/90">
        {items.map((record, index) => (
          <TransactionRow key={record.id} record={record} index={index} />
        ))}
      </div>
    </Card>
  );
}
