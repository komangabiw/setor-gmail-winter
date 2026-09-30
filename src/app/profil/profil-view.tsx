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
} from "lucide-react";
import { PageShell, Reveal } from "@/components/layout/page-shell";
import { mockDeposits, mockUser, type UserProfile } from "@/lib/mock-data";
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

export function ProfilView() {
  const router = useRouter();
  const [userProfile, setUserProfile] = React.useState<UserProfile>(mockUser);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [totalStats, setTotalStats] = React.useState({
    total: mockDeposits.length,
    diterima: mockDeposits.filter((d) => d.status === "diterima").length,
    pending: mockDeposits.filter((d) => d.status === "pending" || d.status === "dicek").length,
    ditolak: mockDeposits.filter((d) => d.status === "ditolak").length,
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
          <section className="overflow-hidden rounded-3xl border border-sky-100/90 bg-white p-5 shadow-card sm:p-6">
            {/* Header: Corner Kiri (Profil) & Corner Kanan (Keluar Akun) */}
            <div className="flex items-center justify-between">
              {/* Corner Kiri: Profil */}
              <div className="flex items-center gap-2 text-ink-900">
                <span className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <User className="size-4" />
                </span>
                <h3 className="text-sm sm:text-[0.95rem] font-bold text-ink-900">Profil</h3>
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
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 shadow-2xs transition-all hover:bg-rose-100 hover:border-rose-300 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="size-3.5 text-rose-500" />
                <span>Keluar Akun</span>
              </button>
            </div>

            {/* Area Foto Profil & Nama (Tengah & Kompak) */}
            <div className="mt-1 flex flex-col items-center text-center sm:-mt-2">
              {/* Avatar circle with image or initial fallback & camera button */}
              <div className="relative flex size-20 sm:size-22 items-center justify-center rounded-full border-4 border-sky-500 bg-white shadow-md">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt={userProfile.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-600">
                    {firstLetter}
                  </span>
                )}

                {/* Camera upload icon button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload foto profil"
                  title="Upload / ganti foto profil"
                  className="absolute bottom-0 right-0 flex size-6.5 sm:size-7 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-white shadow-md hover:bg-sky-600 active:scale-90 transition-all cursor-pointer"
                >
                  <Camera className="size-3 sm:size-3.5" />
                </button>
              </div>

              {/* Nama user */}
              <h2 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-ink-900">
                {userProfile.name}
              </h2>

              {avatarImage && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-ink-700 shadow-2xs transition-colors hover:bg-slate-50 active:scale-95 cursor-pointer"
                  >
                    <Camera className="size-3 text-sky-600" />
                    <span>Ganti Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[0.7rem] font-semibold text-rose-600 shadow-2xs transition-colors hover:bg-rose-100 active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="size-3 text-rose-500" />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4 Info Boxes: UID, EMAIL, NOMOR DANA, TANGGAL GABUNG */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Box 1: UID */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:bg-sky-50/40">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.66rem] font-bold tracking-wider text-slate-400 uppercase">
                    UID
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[0.82rem] font-semibold text-ink-800">
                    {userProfile.uid}
                  </p>
                </div>
                <CopyValue value={userProfile.uid} />
              </div>

              {/* Box 2: EMAIL */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:bg-sky-50/40">
                <p className="text-[0.66rem] font-bold tracking-wider text-slate-400 uppercase">
                  EMAIL
                </p>
                <p className="mt-0.5 truncate text-[0.84rem] font-semibold text-ink-800">
                  {userProfile.email}
                </p>
              </div>

              {/* Box 3: NOMOR DANA */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:bg-sky-50/40">
                <p className="text-[0.66rem] font-bold tracking-wider text-slate-400 uppercase">
                  NOMOR DANA
                </p>
                <p className="mt-0.5 text-[0.84rem] font-semibold text-ink-800">
                  {userProfile.danaNumber ?? "081386249421"}
                </p>
              </div>

              {/* Box 4: TANGGAL GABUNG */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors hover:bg-sky-50/40">
                <p className="text-[0.66rem] font-bold tracking-wider text-slate-400 uppercase">
                  TANGGAL GABUNG
                </p>
                <p className="mt-0.5 text-[0.84rem] font-semibold text-ink-800">
                  {userProfile.joinedAt ?? "24 September 2024"}
                </p>
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


        <p className="pt-2 text-center text-[0.68rem] text-ink-400">
          Setor Gmail Winter · v1.0.0
        </p>
      </div>
    </PageShell>
  );
}
