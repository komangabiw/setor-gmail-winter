"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Trash2,
  LogOut,
  User,
  Copy,
  Check,
  Mail,
  Calendar,
  KeyRound,
  Gift,
  UserPlus,
  BadgeCheck,
  CircleDollarSign,
  Ticket,
  Link2,
  Info,
  Users,
} from "lucide-react";
import { EmptyState, PageShell, Reveal } from "@/components/layout/page-shell";
import { Card, CardContent, SectionHeading } from "@/components/ui/card";
import { StatBox, StatusBadge } from "@/components/ui/status";
import { Tabs } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/context/user-profile-context";
import { supabase } from "@/lib/supabase";
import { formatIDR, formatDateTime } from "@/lib/utils";
import {
  mockBonusHistory,
  mockReferralHistory,
  referralMission,
  type BonusRecord,
  type ReferralRecord,
} from "@/lib/mock-data";

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
      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600 active:scale-90"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Referral Sub-components                                            */
/* ------------------------------------------------------------------ */

type ReferralTab = "referral" | "bonus";

const REFERRAL_TABS: { value: ReferralTab; label: string; icon: React.ReactNode }[] = [
  { value: "referral", label: "Riwayat Referral", icon: <Users className="size-3.5" aria-hidden="true" /> },
  { value: "bonus", label: "Riwayat Bonus", icon: <Gift className="size-3.5" aria-hidden="true" /> },
];

function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 px-2.5 py-2.5 text-center backdrop-blur-sm">
      <dt className="text-[0.6rem] font-semibold tracking-wide text-white/70 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-[0.82rem] font-bold text-white tabular-nums md:text-[0.9rem]">
        {value}
      </dd>
    </div>
  );
}

function CopyField({
  icon,
  label,
  value,
  mono = false,
  copyLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  copyLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[0.78rem] font-medium text-ink-700">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-2 pl-3.5">
        <span className="shrink-0 text-ink-400">{icon}</span>
        <span
          className={`min-w-0 flex-1 truncate text-[0.83rem] font-semibold text-ink-800 ${
            mono ? "font-mono tracking-widest" : ""
          }`}
          title={value}
        >
          {value}
        </span>
        <CopyButton value={value} label={copyLabel} copiedLabel="Tersalin" />
      </div>
    </div>
  );
}

function ReferralList({ records }: { records: ReferralRecord[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-6" aria-hidden="true" />}
        title="Belum ada referral"
        description="Bagikan kode atau link Referralmu untuk mulai mengundang teman."
        compact
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {records.map((record) => (
        <li
          key={record.id}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/90 p-3.5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <UserPlus className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] font-semibold text-ink-800">
              {record.name}
            </p>
            <p className="truncate text-[0.68rem] text-ink-500">
              {record.email} · {formatDateTime(record.joinedAt)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.8rem] font-bold text-ink-900 tabular-nums">
              {formatIDR(record.reward)}
            </p>
            <StatusBadge tone={record.status === "berhasil" ? "success" : "warning"}>
              {record.status === "berhasil" ? "Berhasil" : "Menunggu"}
            </StatusBadge>
          </div>
        </li>
      ))}
    </ul>
  );
}

function BonusList({ records }: { records: BonusRecord[] }) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<Gift className="size-6" aria-hidden="true" />}
        title="Belum ada bonus"
        description="Bonus akan masuk setelah misi referral kamu selesai."
        compact
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {records.map((record) => (
        <li
          key={record.id}
          className="flex items-center gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-3.5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <CircleDollarSign className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] font-semibold text-ink-800">
              {record.label}
            </p>
            <p className="text-[0.68rem] text-ink-500">
              {formatDateTime(record.createdAt)}
            </p>
          </div>
          <span className="shrink-0 text-[0.85rem] font-bold text-emerald-700 tabular-nums">
            +{formatIDR(record.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Main ProfilView                                                    */
/* ------------------------------------------------------------------ */

export function ProfilView() {
  const router = useRouter();
  const {
    userProfile,
    avatarImage,
    isLoading,
    updateAvatar,
    deleteAvatar,
  } = useUserProfile();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [referralTab, setReferralTab] = React.useState<ReferralTab>("referral");

  // Auto-scroll to #referral if navigated with hash
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#referral") {
      const timer = window.setTimeout(() => {
        const el = document.getElementById("referral");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const firstLetter = (userProfile.name || "P").trim().charAt(0).toUpperCase() || "P";

  // Derive unique referral code & invite link based on user's profile
  const userReferralCode =
    userProfile.uid && userProfile.uid !== "-"
      ? userProfile.uid.slice(0, 8).toUpperCase()
      : referralMission.code;

  const userInviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/login?ref=${userReferralCode}`
      : referralMission.link;

  const mission = referralMission;
  const progress = Math.min(100, Math.round((mission.successful / mission.target) * 100));
  const remaining = Math.max(mission.target - mission.successful, 0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format tidak didukung", {
        description: "Harap pilih file gambar (JPG, PNG, WebP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran terlalu besar", {
        description: "Maksimal ukuran foto adalah 5MB.",
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

  const handleDeletePhoto = async () => {
    await deleteAvatar();
    toast.success("Foto profil berhasil dihapus", {
      description: "Tampilan kembali ke abjad depan nama kamu.",
    });
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

      <div className="space-y-5 pt-4 sm:pt-6">
        {/* Card 1: Main Profile Card */}
        <Reveal delay={40}>
          <section className="relative overflow-hidden rounded-3xl border border-sky-100/90 bg-white p-4.5 shadow-card sm:p-5.5">
            {/* Ambient subtle glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-72 rounded-full bg-gradient-to-b from-sky-200/30 via-sky-100/10 to-transparent blur-3xl"
            />

            {/* Header: Corner Kiri (Profil) & Corner Kanan (Keluar Akun) */}
            <div className="relative flex items-center justify-between">
              {/* Corner Kiri: Profil */}
              <div className="flex items-center gap-2">
                <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white shadow-xs">
                  <User className="size-3.5 stroke-[2.2]" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Profil Akun</h3>
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
                    localStorage.removeItem("setorgmail_cached_profile_v1");
                    localStorage.removeItem("setorgmail_cached_stats_v1");
                    localStorage.removeItem("user_profile_avatar");
                  } catch {}
                  toast.success("Berhasil keluar akun", {
                    description: "Sesi kamu telah diakhiri.",
                  });
                  router.push("/login");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50/80 px-3 py-1 text-xs font-bold text-rose-600 shadow-2xs transition-all hover:bg-rose-100 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="size-3 text-rose-500" />
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
                  {/* Avatar circle with image or initial fallback & camera button */}
                  <div className="relative flex size-16 sm:size-18 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-md ring-3 ring-sky-200/60">
                    {avatarImage ? (
                      <img
                        src={avatarImage}
                        alt={userProfile.name}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        {firstLetter}
                      </span>
                    )}

                    {/* Camera upload icon button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Upload foto profil"
                      title="Upload / ganti foto profil"
                      className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-white shadow-xs hover:bg-sky-600 active:scale-90 transition-all cursor-pointer"
                    >
                      <Camera className="size-3" />
                    </button>
                  </div>

                  {/* Nama user */}
                  <h2 className="mt-2 text-base sm:text-lg font-bold tracking-tight text-slate-900">
                    {userProfile.name}
                  </h2>

                  {avatarImage && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-2.5 py-0.5 text-[0.72rem] font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 active:scale-95 cursor-pointer"
                      >
                        <Camera className="size-3 text-sky-600" />
                        <span>Ganti Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeletePhoto}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[0.72rem] font-semibold text-rose-600 shadow-2xs transition-colors hover:bg-rose-100 active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="size-3 text-rose-500" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Info Grid: 3 Kolom Sejajar (UID, EMAIL, TANGGAL GABUNG) */}
            <div className="relative mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Kolom 1: UID Card */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition-colors hover:bg-sky-50/30 hover:border-sky-200">
                {isLoading ? (
                  <div className="space-y-1.5 py-0.5 w-full">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                        <KeyRound className="size-3 text-sky-500" />
                        <span>UID Pengguna</span>
                      </div>
                      <CopyValue value={userProfile.uid} />
                    </div>
                    <p className="mt-1 break-all font-mono text-[11px] leading-relaxed font-semibold text-slate-800">
                      {userProfile.uid}
                    </p>
                  </>
                )}
              </div>

              {/* Kolom 2: Email Card */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition-colors hover:bg-sky-50/30 hover:border-sky-200">
                {isLoading ? (
                  <div className="space-y-1.5 py-0.5 w-full">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                      <Mail className="size-3 text-sky-500" />
                      <span>Email Terdaftar</span>
                    </div>
                    <p className="mt-1 break-all text-[11px] sm:text-xs leading-relaxed font-semibold text-slate-800">
                      {userProfile.email}
                    </p>
                  </>
                )}
              </div>

              {/* Kolom 3: Tanggal Bergabung */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition-colors hover:bg-sky-50/30 hover:border-sky-200">
                {isLoading ? (
                  <div className="space-y-1.5 py-0.5 w-full">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                      <Calendar className="size-3 text-sky-500" />
                      <span>Tanggal Bergabung</span>
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs leading-relaxed font-semibold text-slate-800">
                      {userProfile.joinedAt || "-"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        </Reveal>

        {/* Section 2: Program Referral (Integrated into Profile) */}
        <Reveal delay={80} id="referral" className="space-y-4 scroll-mt-20">
          <SectionHeading
            title="Program Referral"
            subtitle="Undang teman dan dapatkan bonus saldo"
            icon={<Gift className="size-4" aria-hidden="true" />}
            action={
              <StatusBadge tone="info" dot pulse>
                Aktif
              </StatusBadge>
            }
          />

          {/* Misi Referral: Gradient Mission Banner + Progress */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-brand-700 p-5 shadow-card md:p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-14 -right-12 size-40 rounded-full bg-white/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-10 size-36 rounded-full bg-white/10 blur-2xl"
            />

            <div className="relative space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm">
                  <Gift className="size-5" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.66rem] font-bold tracking-[0.16em] text-white/75 uppercase">
                    {mission.headline}
                  </p>
                  <h2 className="mt-1 text-base leading-snug font-bold tracking-tight text-white sm:text-lg">
                    {mission.title}
                  </h2>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progres misi referral"
                  className="h-2.5 w-full overflow-hidden rounded-full bg-white/25"
                >
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${Math.max(progress, 4)}%` }}
                  />
                </div>

                <dl className="grid grid-cols-3 gap-2">
                  <BannerStat label="Progres Bonus" value={`${mission.successful}/${mission.target}`} />
                  <BannerStat label="Sisa" value={`${remaining} Teman`} />
                  <BannerStat label="Bonus" value={formatIDR(mission.reward)} />
                </dl>
              </div>
            </div>
          </section>

          {/* Statistik Referral */}
          <div className="grid grid-cols-3 gap-2.5 md:gap-3.5">
            <StatBox
              label="Total Diundang"
              value={mission.invited}
              tone="info"
            />
            <StatBox
              label="Referral Berhasil"
              value={mission.successful}
              tone="success"
            />
            <StatBox
              label="Bonus Diterima"
              value={formatIDR(mission.bonusReceived)}
              tone="warning"
            />
          </div>

          {/* Kode Referral & Link Undangan */}
          <Card>
            <CardContent className="space-y-3.5 p-4 sm:p-5 md:p-6">
              <div className="flex items-start gap-2.5 rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5">
                <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
                <p className="text-[0.73rem] leading-relaxed text-sky-900">
                  {mission.requirement}
                </p>
              </div>

              <CopyField
                icon={<Ticket className="size-4" aria-hidden="true" />}
                label="Kode Referral Kamu"
                value={userReferralCode}
                mono
                copyLabel="Salin"
              />
              <CopyField
                icon={<Link2 className="size-4" aria-hidden="true" />}
                label="Link Undangan Kamu"
                value={userInviteLink}
                copyLabel="Salin"
              />
            </CardContent>
          </Card>

          {/* Riwayat Referral & Riwayat Bonus */}
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-5 md:p-6">
              <Tabs
                items={REFERRAL_TABS}
                value={referralTab}
                onValueChange={(val) => setReferralTab(val as ReferralTab)}
              />

              {referralTab === "referral" ? (
                <ReferralList records={mockReferralHistory} />
              ) : (
                <BonusList records={mockBonusHistory} />
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </PageShell>
  );
}
