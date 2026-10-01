"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Trash2,
  LogOut,
  Trophy,
  User,
  Copy,
  Check,
  Mail,
  Calendar,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { PageShell, Reveal } from "@/components/layout/page-shell";
import { type UserProfile } from "@/lib/mock-data";
import {
  getCurrentAuthUser,
  fetchUserProfile,
  updateUserProfile,
  fetchUserDeposits,
  supabase,
} from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/* Copy helper                                                         */
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
/* View                                                                */
/* ------------------------------------------------------------------ */

const defaultProfile: UserProfile = {
  name: "Pengguna",
  email: "-",
  uid: "-",
  role: "User",
  danaNumber: "-",
  joinedAt: "-",
  passwordChangedAt: "Belum pernah",
};

export function ProfilView() {
  const router = useRouter();
  const [userProfile, setUserProfile] = React.useState<UserProfile>(defaultProfile);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [totalStats, setTotalStats] = React.useState({
    total: 0,
    diterima: 0,
    pending: 0,
    ditolak: 0,
  });
  const [avatarImage, setAvatarImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load avatar and real profile from Supabase
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("user_profile_avatar");
      if (saved) setAvatarImage(saved);
    } catch {}

    (async () => {
      try {
        const user = await getCurrentAuthUser();
        if (user) {
          setUserId(user.id);
          const [pRes, dRes] = await Promise.all([
            fetchUserProfile(user.id),
            fetchUserDeposits(user.id),
          ]);
          if (!pRes.isFallback) {
            setUserProfile(pRes.profile);
            if (pRes.profile.avatarUrl) {
              setAvatarImage(pRes.profile.avatarUrl);
            }
          }
          if (!dRes.isFallback) {
            const deps = dRes.deposits;
            setTotalStats({
              total: deps.length,
              diterima: deps.filter((d) => d.status === "diterima").length,
              pending: deps.filter((d) => d.status === "pending" || d.status === "dicek").length,
              ditolak: deps.filter((d) => d.status === "ditolak").length,
            });
          }
        }
      } catch (err) {
        console.warn("Supabase profile load error (fallback used):", err);
      }
    })();
  }, []);

  const firstLetter = userProfile.name.trim().charAt(0).toUpperCase() || "I";

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
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarImage(dataUrl);
      try {
        localStorage.setItem("user_profile_avatar", dataUrl);
      } catch {}
      if (userId) {
        updateUserProfile(userId, { avatar_url: dataUrl });
      }
      toast.success("Foto profil berhasil diperbarui");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeletePhoto = () => {
    setAvatarImage(null);
    try {
      localStorage.removeItem("user_profile_avatar");
    } catch {}
    if (userId) {
      updateUserProfile(userId, { avatar_url: "" });
    }
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

      <div className="space-y-4 pt-4 sm:pt-6">
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
            </div>

            {/* Info Grid: UID full width, lalu EMAIL & TANGGAL GABUNG bersebelahan */}
            <div className="relative mt-4 space-y-2.5">
              {/* Baris 1: UID Card */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 transition-colors hover:border-sky-200">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                    <KeyRound className="size-3 text-sky-500" />
                    <span>UID Pengguna</span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[0.82rem] font-semibold text-slate-800">
                    {userProfile.uid}
                  </p>
                </div>
                <CopyValue value={userProfile.uid} />
              </div>

              {/* Baris 2: EMAIL & TANGGAL GABUNG */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {/* Email */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 transition-colors hover:bg-sky-50/30 hover:border-sky-200">
                  <div className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                    <Mail className="size-3 text-sky-500" />
                    <span>Email Terdaftar</span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.82rem] font-semibold text-slate-800">
                    {userProfile.email}
                  </p>
                </div>

                {/* Tanggal Gabung */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 transition-colors hover:bg-sky-50/30 hover:border-sky-200">
                  <div className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-wider text-slate-400 uppercase">
                    <Calendar className="size-3 text-sky-500" />
                    <span>Tanggal Bergabung</span>
                  </div>
                  <p className="mt-0.5 text-[0.82rem] font-semibold text-slate-800">
                    {userProfile.joinedAt || "-"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Card 2: Statistik Total (Ditaruh tepat di bawah profil, teks & angka ditengah/center) */}
        <Reveal delay={80}>
          <section className="rounded-3xl border border-sky-100/90 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center gap-2.5 text-ink-900">
              <span className="flex size-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Trophy className="size-4" />
              </span>
              <div>
                <h3 className="text-[0.92rem] font-bold text-ink-900">Statistik Total</h3>
                <p className="text-[0.72rem] text-ink-500">Rekap seluruh aktivitas setor</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Total Setoran */}
              <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-sky-200/80 bg-sky-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <p className="text-[0.68rem] font-bold tracking-wider text-sky-800 uppercase text-center">
                  Total Setoran
                </p>
                <p className="mt-1 text-2xl font-black text-sky-700 tabular-nums sm:text-3xl text-center">
                  {totalStats.total}
                </p>
              </div>

              {/* Diterima */}
              <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <p className="text-[0.68rem] font-bold tracking-wider text-emerald-800 uppercase text-center">
                  Diterima
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-600 tabular-nums sm:text-3xl text-center">
                  {totalStats.diterima}
                </p>
              </div>

              {/* Ditolak */}
              <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <p className="text-[0.68rem] font-bold tracking-wider text-rose-800 uppercase text-center">
                  Ditolak
                </p>
                <p className="mt-1 text-2xl font-black text-rose-600 tabular-nums sm:text-3xl text-center">
                  {totalStats.ditolak}
                </p>
              </div>

              {/* Pending */}
              <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <p className="text-[0.68rem] font-bold tracking-wider text-amber-800 uppercase text-center">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-black text-amber-600 tabular-nums sm:text-3xl text-center">
                  {totalStats.pending}
                </p>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </PageShell>
  );
}
