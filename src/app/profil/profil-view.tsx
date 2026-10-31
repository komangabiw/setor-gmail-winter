"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Camera,
  LogOut,
  User,
  Copy,
  Check,
  Mail,
  Calendar,
  KeyRound,
  Wallet,
  Smartphone,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Gift,
  Save,
  CircleCheck,
  ReceiptText,
  ArrowUpRight,
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { PageShell, Reveal, EmptyState } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/context/user-profile-context";
import { supabase, saveEWalletAccount } from "@/lib/supabase";
import { cn, formatDateTime, formatIDR } from "@/lib/utils";
import { TarikSaldoModal } from "@/app/saldo/tarik-saldo-modal";
import {
  EWALLET_CONFIGS,
  EWALLET_ORDER,
  IndonesiaFlag,
  type EWalletMethod,
} from "@/components/ui/ewallet-logos";
import { saveStoredEWalletData } from "@/lib/generated-storage";
import {
  type TransactionRecord,
  type WithdrawalStatus,
} from "@/lib/mock-data";

/* ------------------------------------------------------------------ */
/* Saldo & E-Wallet Constants & Types                                 */
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
  deposit: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  withdrawal: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  bonus: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

const PHONE_MAX_LENGTH = 13;

type UnifiedTransaction = {
  id: string;
  type: "deposit" | "withdrawal" | "bonus";
  amount: number;
  title: string;
  description: string;
  createdAt: string;
  status?: WithdrawalStatus;
  method?: string;
  accountNumber?: string;
};

function TransactionRow({ record, index }: { record: UnifiedTransaction; index: number }) {
  const isWithdrawal = record.type === "withdrawal";
  const methodKey = isWithdrawal ? ((record.method || "DANA").toUpperCase() as EWalletMethod) : null;
  const config = methodKey ? (EWALLET_CONFIGS[methodKey] || EWALLET_CONFIGS.DANA) : null;
  const isCredit = record.type === "deposit" || record.type === "bonus";

  const Icon = isWithdrawal ? BanknoteArrowUp : transactionIcons[record.type] || ReceiptText;
  const toneClass = isWithdrawal
    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
    : transactionTones[record.type] || "bg-white/5 text-zinc-300 border border-white/10";

  return (
    <div
      className="animate-fade-up flex items-center gap-3 px-4 py-3.5 transition-colors duration-300 hover:bg-white/5 sm:gap-4 sm:px-5 md:px-6 md:py-4"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {config ? (
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
      ) : (
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl shadow-2xs", toneClass)}>
          <Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] font-semibold text-white">{record.title}</p>
        <p className="mt-0.5 truncate text-[0.7rem] text-zinc-400">
          {record.description} · {formatDateTime(record.createdAt)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={cn(
            "text-[0.85rem] font-bold tracking-tight tabular-nums",
            isCredit ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {isCredit ? "+" : "-"}
          {formatIDR(record.amount)}
        </span>
        {record.status && (
          <StatusBadge
            tone={withdrawalMeta[record.status]?.tone || "info"}
            className="text-[0.62rem] py-0 px-2 font-bold"
          >
            {withdrawalMeta[record.status]?.label || record.status.toUpperCase()}
          </StatusBadge>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Copy UID Helper                                                    */
/* ------------------------------------------------------------------ */

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      toast.success("UID tersalin ke clipboard");
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Salin ${value}`}
      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-sky-500/10 hover:text-sky-400 active:scale-90 cursor-pointer"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main ProfilView                                                    */
/* ------------------------------------------------------------------ */

export function ProfilView() {
  const {
    userProfile,
    avatarImage,
    isLoading,
    siteConfig,
    updateAvatar,
    wallet,
    persistedAccounts,
    withdrawals,
    transactions,
    isWalletLoading,
    isHistoryLoading,
    userId,
    refreshWallet,
    refreshHistory,
    saveEWalletAccountLocally,
  } = useUserProfile();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [selectedMethod, setSelectedMethod] = React.useState<EWalletMethod>("DANA");
  const [accountNumbers, setAccountNumbers] = React.useState<Record<EWalletMethod, string>>(persistedAccounts);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = React.useState(false);

  // Gabungkan riwayat transaksi dan riwayat penarikan menjadi satu daftar terpadu
  const unifiedTransactions: UnifiedTransaction[] = React.useMemo(() => {
    const list: UnifiedTransaction[] = [];

    // Tambahkan transaksi biasa (deposit, bonus, dll)
    for (const t of transactions) {
      list.push({
        id: t.id,
        type: t.type,
        amount: t.amount,
        title: t.title,
        description: t.description,
        createdAt: t.createdAt,
      });
    }

    // Tambahkan penarikan
    for (const w of withdrawals) {
      const config = EWALLET_CONFIGS[(w.method || "DANA").toUpperCase() as EWalletMethod] || EWALLET_CONFIGS.DANA;
      list.push({
        id: `wd-${w.id}`,
        type: "withdrawal",
        amount: w.amount,
        title: `Penarikan ${config.name}`,
        description: `${w.accountNumber || "-"} · Status: ${w.status}`,
        createdAt: w.createdAt,
        status: w.status,
        method: w.method,
        accountNumber: w.accountNumber,
      });
    }

    // Urutkan berdasarkan tanggal terbaru
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, withdrawals]);

  // Sync account numbers from persistedAccounts when hydrated or updated
  React.useEffect(() => {
    setAccountNumbers((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(persistedAccounts)) {
        if (v && !prev[k as EWalletMethod]) {
          next[k as EWalletMethod] = v;
        }
      }
      return next;
    });
  }, [persistedAccounts]);

  const config = EWALLET_CONFIGS[selectedMethod];
  const currentNumber = accountNumbers[selectedMethod] || "";
  const phoneValid = /^08\d{8,11}$/.test(currentNumber.trim());
  const persistedNumber = (persistedAccounts[selectedMethod] || "").trim();
  const isSaved = phoneValid && Boolean(persistedNumber) && currentNumber.trim() === persistedNumber;

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
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaved) {
      toast.info(`Nomor ${config.name} sudah tersimpan`, {
        description: `Nomor ${currentNumber} sudah aktif tersimpan di akun Anda.`,
      });
      return;
    }

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
    saveEWalletAccountLocally(selectedMethod, currentNumber.trim());
    saveStoredEWalletData({
      defaultMethod: selectedMethod,
      accounts: { ...accountNumbers, [selectedMethod]: currentNumber.trim() },
    });

    (async () => {
      try {
        if (userId) {
          await saveEWalletAccount(userId, selectedMethod, currentNumber.trim(), true);
        }
      } catch (err) {
        console.warn("Supabase save ewallet error:", err);
      } finally {
        setIsSaving(false);
        toast.success(`Pengaturan ${config.name} tersimpan!`, {
          description: `Nomor: ${currentNumber} ditetapkan sebagai E-Wallet utama.`,
        });
      }
    })();
  };

  const firstLetter = (userProfile.name || "P").trim().charAt(0).toUpperCase() || "P";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format tidak didukung", {
        description: "Harap pilih file gambar (JPG, PNG, WebP).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await updateAvatar(dataUrl);
      toast.success("Foto profil berhasil diperbarui");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <PageShell>
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        aria-label="Upload foto profil"
      />

      <div className="space-y-6 pt-4 sm:pt-6">
        {/* Card 1: Main Profile Card */}
        <Reveal delay={40}>
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#121217]/85 p-4.5 shadow-2xl backdrop-blur-xl sm:p-5.5">
            {/* Ambient subtle glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-72 rounded-full bg-sky-500/10 blur-3xl"
            />

            {/* Header: Corner Kiri (Profil) & Corner Kanan (Keluar Akun) */}
            <div className="relative flex items-center justify-between">
              {/* Corner Kiri: Profil */}
              <div className="flex items-center gap-2">
                <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs">
                  <User className="size-3.5 stroke-[2.2]" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Profil Akun</h3>
              </div>

              {/* Corner Kanan: Keluar Akun */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (supabase) {
                      await supabase.auth.signOut();
                    }
                  } catch {}
                  try {
                    localStorage.removeItem("setorgmail_auth");
                    localStorage.removeItem("setorgmail_cached_profile_v1");
                    localStorage.removeItem("setorgmail_cached_stats_v1");
                    localStorage.removeItem("setorgmail_cached_wallet_v1");
                    localStorage.removeItem("setorgmail_cached_ewallets_v1");
                    localStorage.removeItem("setorgmail_cached_deposits_v1");
                    localStorage.removeItem("setorgmail_cached_withdrawals_v1");
                    localStorage.removeItem("setorgmail_cached_transactions_v1");
                    localStorage.removeItem("setorgmail_cached_tickets_v1");
                    localStorage.removeItem("user_profile_avatar");
                  } catch {}
                  toast.success("Berhasil keluar akun", {
                    description: "Sesi kamu telah diakhiri.",
                  });
                  window.location.href = "/login";
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 shadow-2xs transition-all hover:bg-rose-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="size-3 text-rose-400" />
                <span>Keluar Akun</span>
              </button>
            </div>

            {/* Area Foto Profil & Identitas User */}
            <div className="relative mt-2 flex flex-col items-center text-center">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Skeleton className="size-16 sm:size-18 rounded-full" />
                  <Skeleton className="h-5 w-36 mt-2 rounded-lg" />
                </div>
              ) : (
                <>
                  {/* Avatar circle with image or initial fallback & camera button (click anywhere to upload) */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    title="Klik untuk ganti foto profil"
                    className="relative flex size-16 sm:size-18 items-center justify-center rounded-full border-2 border-sky-400/30 bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25 ring-3 ring-sky-500/20 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    {avatarImage ? (
                      <img
                        src={avatarImage}
                        alt={userProfile.name}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl font-black tracking-tight text-white select-none">
                        {firstLetter}
                      </span>
                    )}

                    {/* Camera upload badge */}
                    <div className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-[#121217] bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-xs">
                      <Camera className="size-3" />
                    </div>
                  </div>

                  {/* Nama user */}
                  <h2 className="mt-2.5 text-base sm:text-lg font-bold tracking-tight text-white">
                    {userProfile.name}
                  </h2>
                </>
              )}
            </div>

            {/* Info Grid: 3 Kolom Sejajar (UID, EMAIL, TANGGAL GABUNG) */}
            <div className="relative mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Kolom 1: UID Card */}
              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-3 transition-colors hover:bg-white/5 hover:border-white/20">
                {isLoading ? (
                  <div className="space-y-1.5 py-0.5 w-full">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-zinc-400">
                        <KeyRound className="size-3 text-sky-400" />
                        <span>UID</span>
                      </div>
                      <CopyValue value={userProfile.uid} />
                    </div>
                    <p className="mt-1 break-all font-mono text-[11px] leading-relaxed font-semibold text-white">
                      {userProfile.uid}
                    </p>
                  </>
                )}
              </div>

              {/* Kolom 2: Email Card */}
              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-3 transition-colors hover:bg-white/5 hover:border-white/20">
                {isLoading ? (
                  <div className="space-y-1.5 py-0.5 w-full">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-zinc-400">
                      <Mail className="size-3 text-sky-400" />
                      <span>Email</span>
                    </div>
                    <p className="mt-1 break-all text-[11px] sm:text-xs leading-relaxed font-semibold text-white">
                      {userProfile.email}
                    </p>
                  </>
                )}
              </div>

              {/* Kolom 3: Tanggal Bergabung */}
              <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-3 transition-colors hover:bg-white/5 hover:border-white/20">
                {isLoading ? (
                  <div className="space-y-1.5 py-0.5 w-full">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-zinc-400">
                      <Calendar className="size-3 text-sky-400" />
                      <span>Tanggal Bergabung</span>
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs leading-relaxed font-semibold text-white">
                      {userProfile.joinedAt || "-"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        </Reveal>

        {/* Card 2: Saldo & Pengaturan E-Wallet (Dipindahkan ke Bawah Profil Akun) */}
        <Reveal delay={80}>
          <Card className="relative overflow-hidden border border-white/10 bg-[#121217]/85 shadow-2xl backdrop-blur-xl rounded-3xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-sky-500/10 blur-3xl"
            />

            <div className="relative p-5 sm:p-6 md:p-7">
              {/* Baris Atas: Saldo Saat Ini & Tombol Tarik Saldo */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Wallet className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="text-[0.72rem] font-bold tracking-wider text-zinc-400 uppercase">
                      Saldo Akun
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-3">
                    {isWalletLoading ? (
                      <div className="py-1">
                        <Skeleton className="h-9 w-44 rounded-xl" />
                      </div>
                    ) : (
                      <span className="text-[2.2rem] sm:text-[2.6rem] font-black tracking-tight text-white tabular-nums leading-none">
                        {formatIDR(wallet.balance)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
                      <Target className="size-3 text-sky-400" aria-hidden="true" />
                      Minimal Penarikan: {formatIDR(siteConfig?.min_withdrawal || wallet.minimumWithdrawal || 5000)}
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    size="lg"
                    className="shadow-lg shadow-sky-500/25 bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-bold rounded-2xl px-6 py-2.5 cursor-pointer active:scale-95"
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
                    <span className="flex size-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Smartphone className="size-3.5" aria-hidden="true" />
                    </span>
                    <label className="text-xs sm:text-sm font-bold text-white">
                      Pilihan E-Wallet Penarikan
                    </label>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs sm:text-[0.82rem] font-bold text-amber-300 shadow-2xs">
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    Gopay pajak transfer {siteConfig?.tax_gopay ?? 1000}
                  </span>
                </div>

                {/* 2 E-Wallet Buttons: DANA & GoPay */}
                <div className="grid grid-cols-2 gap-2.5">
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
                          <CheckCircle2 className="size-3.5 ml-0.5 text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Input Nomor E-Wallet & Tombol Simpan */}
                <div className="pt-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="flex items-center justify-center size-10.5 bg-black/30 border border-white/10 rounded-xl shrink-0 select-none shadow-2xs"
                        title="Indonesia"
                      >
                        <IndonesiaFlag className="w-5.5 h-3.5" />
                      </div>
                      <div className="relative flex-1">
                        <Input
                          id="profil-ewallet-number"
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
                            "font-mono text-xs sm:text-sm h-10.5 rounded-xl border-white/10 bg-black/40 text-white placeholder:text-zinc-500 focus:border-sky-500/50",
                            hasStartedTyping && !phoneValid && "border-rose-400 focus-visible:ring-rose-400/20"
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
                          ? "bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25 active:scale-98 hover:from-sky-300 hover:to-blue-500"
                          : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {isSaved ? `Nomor ${config.name} Tersimpan` : `Simpan Akun ${config.name}`}
                    </Button>
                  </div>

                  {/* Notifikasi Real-time Validasi Format Nomor */}
                  {isPrefixInvalid && (
                    <p className="mt-1.5 text-[0.72rem] text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 shrink-0" />
                      Angka depan harus diawali 08
                    </p>
                  )}
                  {isTooShort && (
                    <p className="mt-1.5 text-[0.72rem] text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Nomor kurang dari 10 digit (saat ini {currentNumber.length} digit, minimal 10 digit)
                    </p>
                  )}
                  {phoneValid && (
                    <p className="mt-1.5 text-[0.68rem] text-emerald-400 font-semibold flex items-center gap-1">
                      <CircleCheck className="size-3" /> {isSaved ? `Nomor akun ${config.name} valid dan tersimpan.` : `Format nomor ${config.name} valid (${currentNumber.length} digit).`}
                    </p>
                  )}
                  {!hasStartedTyping && (
                    <p className="mt-1.5 text-[0.7rem] text-zinc-400">
                      Nomor akun {config.name} harus diawali 08 dan memiliki 10–13 digit angka.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </Card>
        </Reveal>

        {/* Section 3: Riwayat Transaksi (Termasuk Penarikan & Bonus) */}
        <Reveal delay={120}>
          <div className="mt-2">
            {isHistoryLoading ? (
              <HistorySkeletonList title="Riwayat Transaksi" />
            ) : (
              <TransactionList items={unifiedTransactions} />
            )}
          </div>
        </Reveal>
      </div>

      {/* Modal Penarikan Saldo */}
      <TarikSaldoModal
        open={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        balance={wallet.balance}
        minimum={wallet.minimumWithdrawal}
        initialMethod={selectedMethod}
        onSuccess={() => {
          refreshWallet();
          refreshHistory();
        }}
      />
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

function HistorySkeletonList({ title }: { title: string }) {
  return (
    <Card className="overflow-hidden border border-white/10 bg-[#121217]/85 shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5 md:px-6 md:py-4">
        <p className="text-[0.8rem] font-semibold text-white">{title}</p>
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <div className="divide-y divide-white/5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 md:px-6 md:py-4">
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TransactionList({ items }: { items: UnifiedTransaction[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText className="size-7 text-sky-400" strokeWidth={1.8} aria-hidden="true" />}
        title="Belum ada transaksi"
        description="Semua aktivitas saldo akan tercatat di sini."
      />
    );
  }

  return (
    <Card className="overflow-hidden border border-white/10 bg-[#121217]/85 shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5 md:px-6 md:py-4">
        <p className="text-[0.8rem] font-semibold text-white">Riwayat Transaksi</p>
        <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[0.68rem] font-semibold text-zinc-300 tabular-nums">
          {items.length} data
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {items.map((record, index) => (
          <TransactionRow key={record.id} record={record} index={index} />
        ))}
      </div>
    </Card>
  );
}
