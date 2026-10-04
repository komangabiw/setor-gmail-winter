"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  LoaderCircle,
  ImageIcon,
  Send,
  X,
  AlertCircle,
  Tag,
  FileText,
  HelpCircle,
  Bug,
  CreditCard,
  Lightbulb,
  Mail,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  reportCategories,
  type ReportCategory,
  type ReportTicket,
} from "@/lib/mock-data";
import { getCurrentAuthUser, insertSupportTicket } from "@/lib/supabase";
import { useUserProfile } from "@/context/user-profile-context";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_DESC = 500;

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

const categoryMeta: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  "Setoran Gmail": {
    icon: <Mail className="size-4" />,
    color: "text-sky-600",
    bg: "bg-sky-100",
  },
  "Penarikan Saldo": {
    icon: <CreditCard className="size-4" />,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  "Bug / Error": {
    icon: <Bug className="size-4" />,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  "Saran & Masukan": {
    icon: <Lightbulb className="size-4" />,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  Lainnya: {
    icon: <HelpCircle className="size-4" />,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
};

function getCategoryMeta(cat: string) {
  return categoryMeta[cat] ?? categoryMeta["Lainnya"];
}

export function CreateReportModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (ticket: ReportTicket) => void;
}) {
  const { userProfile, userId } = useUserProfile();
  const defaultCat: ReportCategory =
    reportCategories.find((c) => c === "Setoran Gmail") ?? reportCategories[0];
  const [category, setCategory] = React.useState<ReportCategory>(defaultCat);
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "sending" | "done">("form");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const reset = React.useCallback(() => {
    setCategory(defaultCat);
    setSubject("");
    setDescription("");
    setFile(null);
    setIsSending(false);
    setStep("form");
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [defaultCat]);

  const handleClose = React.useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const validateFile = (picked: File): boolean => {
    if (!hasAcceptedExtension(picked.name)) {
      toast.error("Format file tidak didukung", {
        description: "Hanya file gambar (PNG, JPG, JPEG, WEBP) yang didukung.",
      });
      return false;
    }
    if (picked.size > MAX_FILE_BYTES) {
      toast.error("Ukuran gambar terlalu besar", {
        description: "Maksimal ukuran lampiran gambar adalah 10MB.",
      });
      return false;
    }
    return true;
  };

  const optimizeImageFile = async (rawFile: File): Promise<File> => {
    if (rawFile.size <= 1.2 * 1024 * 1024) return rawFile;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 1920;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(rawFile);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (!blob || blob.size >= rawFile.size) return resolve(rawFile);
                const cleanName = rawFile.name.replace(/\.[^.]+$/, "") + ".jpg";
                const optimized = new File([blob], cleanName, {
                  type: "image/jpeg",
                });
                resolve(optimized);
              },
              "image/jpeg",
              0.82,
            );
          } catch {
            resolve(rawFile);
          }
        };
        img.onerror = () => resolve(rawFile);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(rawFile);
      reader.readAsDataURL(rawFile);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      return;
    }
    if (!validateFile(picked)) {
      setFile(null);
      event.target.value = "";
      return;
    }
    const optimized = await optimizeImageFile(picked);
    setFile(optimized);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const picked = e.dataTransfer.files?.[0];
    if (!picked) return;
    if (!validateFile(picked)) return;
    const optimized = await optimizeImageFile(picked);
    setFile(optimized);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    const cleanSubject = subject.trim().slice(0, 50);
    const cleanDescription = description.trim().slice(0, MAX_DESC);

    if (!cleanSubject) {
      toast.error("Judul laporan wajib diisi");
      return;
    }
    if (!cleanDescription) {
      toast.error("Deskripsi masalah wajib diisi");
      return;
    }

    setIsSending(true);
    setStep("sending");

    try {
      const authUser = await getCurrentAuthUser().catch(() => null);
      const namaUser =
        (userProfile?.name && userProfile.name !== "Pengguna"
          ? userProfile.name
          : authUser?.user_metadata?.full_name ||
            authUser?.user_metadata?.name ||
            authUser?.user_metadata?.username ||
            userProfile?.name) || "Pengguna";

      const emailUser =
        (userProfile?.email && userProfile.email !== "-"
          ? userProfile.email
          : authUser?.email || userProfile?.email) || "-";

      const uidUser =
        (userProfile?.uid && userProfile.uid !== "-"
          ? userProfile.uid
          : authUser?.id || userId || userProfile?.uid) || "-";

      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.append("kategori", category);
        formData.append("judul", cleanSubject);
        formData.append("deskripsi", cleanDescription);
        formData.append("nama_user", namaUser);
        formData.append("email_user", emailUser);
        formData.append("uid_user", uidUser);
        formData.append("file", file);
        response = await fetch("/api/telegram-report", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/telegram-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kategori: category,
            judul: cleanSubject,
            deskripsi: cleanDescription,
            nama_user: namaUser,
            email_user: emailUser,
            uid_user: uidUser,
          }),
        });
      }

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        toast.error(payload?.error ?? "Laporan gagal terkirim. Coba lagi.");
        setIsSending(false);
        setStep("form");
        return;
      }

      const stamp = Date.now();
      const ticket: ReportTicket = {
        id: `r-${stamp}`,
        code: `LPR-${String(stamp).slice(-6)}`,
        subject: cleanSubject,
        category,
        description: cleanDescription,
        status: "baru",
        createdAt: new Date().toISOString(),
        attachmentName: file?.name,
        replies: [],
      };

      // Save ticket to Supabase in background
      (async () => {
        try {
          const user = await getCurrentAuthUser();
          if (user) {
            await insertSupportTicket(user.id, {
              code: ticket.code,
              category: ticket.category,
              subject: ticket.subject,
              description: ticket.description,
              attachmentName: ticket.attachmentName,
            });
          }
        } catch (dbErr) {
          console.warn("Supabase ticket insertion error (fallback used):", dbErr);
        }
      })();

      setStep("done");
      await new Promise((r) => setTimeout(r, 900));
      onSubmit(ticket);
      handleClose();
      toast.success("Laporan berhasil dikirim ke Admin!", {
        description: `Tiket ${ticket.code} akan segera ditinjau.`,
      });
    } catch {
      toast.error("Gagal menghubungi server. Periksa koneksi lalu coba lagi.");
      setIsSending(false);
      setStep("form");
    }
  };

  const charCountDesc = description.length;
  const descProgress = Math.min(charCountDesc / MAX_DESC, 1);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      labelledBy="create-report-title"
      className="overflow-hidden p-0 sm:max-w-lg"
    >
      {/* ── Dark gradient header ─────────────────────────────── */}
      <div
        className="relative shrink-0 overflow-hidden px-6 pt-6 pb-5"
        style={{
          background:
            "linear-gradient(135deg,#1e293b 0%,#0f172a 40%,#1e3a5f 70%,#0c4a6e 100%)",
        }}
      >
        {/* Glow orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle,#38bdf8,transparent)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-4 -left-4 size-32 rounded-full opacity-15 blur-2xl"
          style={{ background: "radial-gradient(circle,#818cf8,transparent)" }}
        />

        {/* Kirim Laporan badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur-sm">
          <svg
            className="size-3 fill-sky-300"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.94z" />
          </svg>
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-sky-200">
            Kirim Laporan
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="create-report-title"
              className="flex items-center gap-2 text-[1.15rem] font-bold leading-tight text-white"
            >
              <span role="img" aria-label="laporan" className="text-xl">
                📋
              </span>
              <span>Buat Laporan Baru</span>
            </h2>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-300">
              Ceritakan masalah Kamu - Admin siap membantu.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white active:scale-90"
          >
            <X className="size-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* ── Form body ───────────────────────────────────────── */}
      <form
        id="create-report-form"
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto bg-white"
      >
        <div className="space-y-5 px-6 py-5">
          {/* Category cards */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-[0.78rem] font-semibold uppercase tracking-wide text-slate-700">
              <Tag className="size-3.5" />
              Kategori Laporan
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {reportCategories.map((cat) => {
                const meta = getCategoryMeta(cat);
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat as ReportCategory)}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-2xl border p-2.5 sm:p-3 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer",
                      isActive
                        ? "border-sky-500 bg-gradient-to-br from-sky-50 to-blue-50/90 text-sky-950 font-semibold shadow-sm ring-2 ring-sky-400/25"
                        : "border-slate-200/80 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-xs",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-sky-500 text-white shadow-sm shadow-sky-300"
                          : cn(meta.bg, meta.color)
                      )}
                    >
                      {meta.icon}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-nowrap text-[0.82rem] sm:text-[0.85rem] font-medium">
                      {cat}
                    </span>
                    {isActive && (
                      <span className="size-2 shrink-0 rounded-full bg-sky-500 shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="report-subject"
              className="mb-1.5 flex items-center gap-1.5 text-[0.78rem] font-semibold uppercase tracking-wide text-slate-700"
            >
              <FileText className="size-3.5" />
              Judul Laporan
              <span className="ml-auto font-normal normal-case tracking-normal text-red-500">
                Wajib *
              </span>
            </label>
            <input
              id="report-subject"
              type="text"
              required
              maxLength={50}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ringkas masalah Anda dalam satu kalimat..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-[0.88rem] text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Description + char bar (max 500) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="report-description"
                className="flex items-center gap-1.5 text-[0.78rem] font-semibold uppercase tracking-wide text-slate-700"
              >
                <AlertCircle className="size-3.5" />
                Deskripsi Masalah
                <span className="ml-1 font-normal normal-case tracking-normal text-red-500">
                  *
                </span>
              </label>
              <span
                className={cn(
                  "text-[0.68rem] font-medium tabular-nums transition-colors",
                  descProgress > 0.85
                    ? "text-red-500 font-semibold"
                    : descProgress > 0.6
                    ? "text-amber-500"
                    : "text-slate-400"
                )}
              >
                {charCountDesc}/{MAX_DESC}
              </span>
            </div>
            <textarea
              id="report-description"
              required
              rows={4}
              maxLength={MAX_DESC}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan masalah selengkap mungkin (maksimal 500 karakter)..."
              className="min-h-[110px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[0.88rem] leading-relaxed text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  descProgress > 0.85
                    ? "bg-red-400"
                    : descProgress > 0.6
                    ? "bg-amber-400"
                    : "bg-sky-400"
                )}
                style={{ width: `${descProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Image attachment */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[0.78rem] font-semibold uppercase tracking-wide text-slate-700">
              <ImageIcon className="size-3.5" />
              Lampiran Gambar
              <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">
                (Opsional)
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="report-attachment"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="sr-only"
            />

            {file ? (
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                    <ImageIcon className="size-4 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[0.82rem] font-semibold text-sky-900">
                      {file.name}
                    </p>
                    <p className="text-[0.7rem] text-sky-600">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Hapus file"
                  className="flex size-7 items-center justify-center rounded-full bg-sky-100 text-sky-500 transition-colors hover:bg-sky-200 hover:text-sky-800"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Pilih atau lepas file gambar lampiran"
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all duration-200",
                  isDragging
                    ? "scale-[1.01] border-sky-400 bg-sky-50"
                    : "border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/50"
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl transition-colors",
                    isDragging ? "bg-sky-100" : "bg-white shadow-sm"
                  )}
                >
                  <ImageIcon
                    className={cn(
                      "size-5",
                      isDragging ? "text-sky-500" : "text-slate-400"
                    )}
                  />
                </div>
                <div>
                  <p className="text-[0.82rem] font-medium text-slate-700">
                    {isDragging
                      ? "Lepas gambar di sini"
                      : "Klik atau seret gambar ke sini"}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">
                    Hanya gambar (PNG, JPG, WEBP) — maks. 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* ── Footer: 1 full-width row ────────────────────────── */}
      <div className="flex shrink-0 flex-col gap-2.5 border-t border-slate-100 bg-white px-6 py-4">
        <button
          type="submit"
          form="create-report-form"
          disabled={isSending}
          className={cn(
            "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3 text-[0.88rem] font-semibold text-white shadow-lg transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70",
            step === "done"
              ? "bg-emerald-500 shadow-emerald-200"
              : "bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-200/70 hover:from-sky-400 hover:to-blue-500 hover:shadow-xl hover:shadow-sky-300/50"
          )}
        >
          {!isSending && (
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-full"
            />
          )}

          {step === "sending" ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              <span>Mengirim...</span>
            </>
          ) : step === "done" ? (
            <>
              <span className="text-base">✅</span>
              <span>Terkirim!</span>
            </>
          ) : (
            <>
              <Send className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              <span>Kirim Laporan</span>
            </>
          )}
        </button>

        <p className="text-center text-[0.72rem] text-slate-400">
          Laporan dikirim langsung ke Admin.
        </p>
      </div>
    </Modal>
  );
}
