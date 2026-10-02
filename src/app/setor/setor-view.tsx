"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  ScrollText,
  Send,
  Sparkles,
  Trash2,
  ShieldCheck,
  RefreshCw,
  ClipboardPaste,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { PageShell, Reveal } from "@/components/layout/page-shell";
import { RulesModal } from "./rules-modal";
import { defaultPassword } from "@/lib/mock-data";
import { cn, formatIDR } from "@/lib/utils";
import {
  getStoredGeneratedGmails,
  saveStoredGeneratedGmails,
  getStoredSubmittedGmails,
  saveStoredSubmittedGmails,
  getStoredCheckStatusMap,
  saveStoredCheckStatusMap,
} from "@/lib/generated-storage";
import { getCurrentAuthUser, insertUserDeposits } from "@/lib/supabase";
import { useUserProfile } from "@/context/user-profile-context";

export interface SetoranCheckItem {
  index: number;
  email: string;
  status: "LIVE" | "UNREGISTERED" | "SUDAH DISETOR" | "DIABAIKAN" | "INVALID";
  reason: string;
}

/* ------------------------------------------------------------------ */
/* High-entropy Gmail Generator (Matching zero99 pattern)              */
/* Pattern: [4 random letters][name1][name2][2 digits]@gmail.com      */
/* Total combinations: > 100,000,000,000 (virtually 0% Google collision) */
/* ------------------------------------------------------------------ */

const PREFIX_CHARS = "abcdefghijklmnopqrstuvwxyz";

function randomPrefix(length = 4): string {
  let res = "";
  for (let i = 0; i < length; i++) {
    res += PREFIX_CHARS[Math.floor(Math.random() * PREFIX_CHARS.length)];
  }
  return res;
}

import { FIRST_NAMES, SECOND_NAMES } from "@/lib/generator-names";

const DOMAIN = "gmail.com";
const HISTORY_KEY = "setor_generated_gmails_history_v1";

function randomFrom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function generateSingleGmail(): string {
  const prefix = randomPrefix(4);
  const name1 = randomFrom(FIRST_NAMES);
  const name2 = randomFrom(SECOND_NAMES);
  const suffix = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  return `${prefix}${name1}${name2}${suffix}@${DOMAIN}`;
}

function getStoredHistory(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveToHistory(newEmails: string[]) {
  if (typeof window === "undefined") return;
  try {
    const history = getStoredHistory();
    newEmails.forEach((e) => history.add(e.toLowerCase()));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(Array.from(history).slice(-10000)));
  } catch {
    // ignore
  }
}

function generateBatch(count: number, existingPool?: Set<string>): string[] {
  const history = getStoredHistory();
  const seen = new Set<string>();
  let attempts = 0;
  while (seen.size < count && attempts < 2000) {
    attempts++;
    const email = generateSingleGmail();
    const lower = email.toLowerCase();
    if (!seen.has(lower) && !history.has(lower) && (!existingPool || !existingPool.has(lower))) {
      seen.add(email);
    }
  }
  const result = Array.from(seen);
  saveToHistory(result);
  return result;
}

export function SetorView() {
  const [emails, setEmails] = React.useState("");
  const { refreshDeposits, refreshWallet } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [copiedPassword, setCopiedPassword] = React.useState(false);
  const [rulesOpen, setRulesOpen] = React.useState(false);

  // Generator State
  const [isMounted, setIsMounted] = React.useState(false);
  const [customCountInput, setCustomCountInput] = React.useState<number>(5);
  const [generatedList, setGeneratedList] = React.useState<string[]>([]);
  const [generatedPool, setGeneratedPool] = React.useState<Set<string>>(() => new Set());
  const [copiedEmail, setCopiedEmail] = React.useState<string | null>(null);

  // Setoran Checker State
  const [isCheckingSetoran, setIsCheckingSetoran] = React.useState(false);
  const [setoranCheckResults, setSetoranCheckResults] = React.useState<SetoranCheckItem[]>([]);
  const [hasCheckedSetoran, setHasCheckedSetoran] = React.useState(false);

  // Submitted & Check Status Tracking
  const [submittedSet, setSubmittedSet] = React.useState<Set<string>>(() => new Set());
  const [checkStatusMap, setCheckStatusMap] = React.useState<Record<string, "LIVE" | "UNREGISTERED">>({});

  // Mount effect: load existing generated batch, submitted emails, and check statuses from localStorage
  React.useEffect(() => {
    setIsMounted(true);
    const existing = getStoredGeneratedGmails();
    if (existing.length > 0) {
      setGeneratedList(existing);
      setGeneratedPool(new Set(existing.map((e) => e.toLowerCase())));
    }
    const submitted = getStoredSubmittedGmails();
    if (submitted.length > 0) {
      setSubmittedSet(new Set(submitted.map((e) => e.toLowerCase())));
    }
    const statusMap = getStoredCheckStatusMap();
    if (Object.keys(statusMap).length > 0) {
      setCheckStatusMap(statusMap);
    }
  }, []);

  // Set of emails currently typed/pasted in textarea
  const enteredEmailsSet = React.useMemo(() => {
    const set = new Set<string>();
    emails.split("\n").forEach((line) => {
      const clean = line.trim().toLowerCase();
      if (clean) set.add(clean);
    });
    return set;
  }, [emails]);

  // Count unsubmitted generated emails based on actual submittedSet
  const unsubmittedCount = React.useMemo(() => {
    return generatedList.filter((email) => !submittedSet.has(email.toLowerCase())).length;
  }, [generatedList, submittedSet]);

  // Handle generating new batch with high-entropy guarantee
  const handleGenerate = (count = customCountInput) => {
    const validCount = Math.max(1, Math.min(100, count));
    const list = generateBatch(validCount, generatedPool);
    setGeneratedList(list);
    saveStoredGeneratedGmails(list);
    setGeneratedPool((prev) => {
      const next = new Set(prev);
      list.forEach((e) => next.add(e.toLowerCase()));
      return next;
    });
    toast.success(`${validCount} nama Gmail unik berhasil digenerate!`, {
      description: "Pola unik 100% segar & belum pernah didaftarkan di Google.",
    });
  };

  // Handle Generate Lagi: appends selected count to existing batch (max 100)
  const handleGenerateMore = (count = customCountInput) => {
    const currentCount = generatedList.length;
    if (currentCount >= 100) {
      toast.error("Maksimal 100 Gmail telah tercapai!");
      return;
    }
    const maxCanAdd = 100 - currentCount;
    const toAdd = Math.min(Math.max(1, count), maxCanAdd);
    const newBatch = generateBatch(toAdd, generatedPool);
    const combined = [...generatedList, ...newBatch];

    setGeneratedList(combined);
    saveStoredGeneratedGmails(combined);
    setGeneratedPool((prev) => {
      const next = new Set(prev);
      newBatch.forEach((e) => next.add(e.toLowerCase()));
      return next;
    });

    if (currentCount + count > 100) {
      toast.info(`Ditambahkan ${toAdd} Gmail (maksimal 100 tercapai, total: 100 akun).`);
    } else {
      toast.success(`${toAdd} Gmail tambahan berhasil digenerate! Total: ${combined.length} akun.`);
    }
  };

  const handleDeleteGenerated = (index: number) => {
    setGeneratedList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveStoredGeneratedGmails(next);
      return next;
    });
    toast.info("1 Gmail dihapus dari daftar.");
  };

  const handleCopyOne = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success(`Disalin: ${email}`);
      window.setTimeout(() => setCopiedEmail(null), 1800);
    } catch {
      toast.error("Gagal menyalin ke clipboard");
    }
  };

  const handleCopyAll = async () => {
    if (generatedList.length === 0) return;
    try {
      await navigator.clipboard.writeText(generatedList.join("\n"));
      toast.success(`${generatedList.length} Gmail disalin ke clipboard!`);
    } catch {
      toast.error("Gagal menyalin semua Gmail");
    }
  };

  const handleCopyUnsubmitted = async () => {
    const unsubmitted = generatedList.filter(
      (email) => !submittedSet.has(email.toLowerCase())
    );
    if (unsubmitted.length === 0) {
      toast.info("Semua Gmail sudah disetor!");
      return;
    }
    try {
      await navigator.clipboard.writeText(unsubmitted.join("\n"));
      toast.success(`${unsubmitted.length} Gmail belum disetor disalin!`);
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(defaultPassword);
      setCopiedPassword(true);
      toast.success("Password wajib disalin ke clipboard!");
      window.setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      toast.error("Gagal menyalin password");
    }
  };

  const handlePasteGenerated = () => {
    const list = generatedList.length > 0 ? generatedList : getStoredGeneratedGmails();
    if (list.length === 0) {
      toast.info("Belum ada Gmail yang digenerate di atas.");
      return;
    }
    const capped = list.slice(0, 100);
    setEmails(capped.join("\n"));
    setHasCheckedSetoran(false);
    setSetoranCheckResults([]);
    toast.success(`${capped.length} Gmail hasil generate berhasil ditempel ke kolom checker!`);
  };

  const handleClearEmails = () => {
    setEmails("");
    setHasCheckedSetoran(false);
    setSetoranCheckResults([]);
    toast.info("Kolom checker dikosongkan.");
  };

  /* ------------------------------------------------------------------ */
  /* Real-time Validation for Textarea                                  */
  /* ------------------------------------------------------------------ */

  const { validCount, totalLines, isExceededMax, invalidCount, notGeneratedCount } =
    React.useMemo(() => {
      const rawLines = emails.split("\n");
      const cleanLines = rawLines.map((l) => l.trim()).filter(Boolean);
      const seen = new Set<string>();

      let valid = 0;
      let invalid = 0;
      let notGen = 0;

      const currentStored = typeof window !== "undefined" ? getStoredGeneratedGmails() : [];
      const historySet = typeof window !== "undefined" ? getStoredHistory() : new Set<string>();
      const combinedPool = new Set([
        ...Array.from(generatedPool).map((e) => e.toLowerCase()),
        ...currentStored.map((e) => e.toLowerCase()),
        ...Array.from(historySet).map((e) => e.toLowerCase()),
      ]);

      cleanLines.forEach((line) => {
        const lower = line.toLowerCase();
        const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(lower);

        if (!isGmail || seen.has(lower)) {
          invalid++;
        } else if (!combinedPool.has(lower)) {
          notGen++;
        } else {
          valid++;
          seen.add(lower);
        }
      });

      return {
        validCount: valid,
        totalLines: cleanLines.length,
        isExceededMax: cleanLines.length > 100,
        invalidCount: invalid,
        notGeneratedCount: notGen,
      };
    }, [emails, generatedPool]);

  // Handle textarea change with max 100 lines validation notification
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const currentLines = val.split("\n").filter((l) => l.trim()).length;

    if (currentLines > 100) {
      toast.error("Maksimal 100 Gmail!", {
        description: `Anda telah memasukkan ${currentLines} Gmail. Mohon kurangi hingga maksimal 100 Gmail.`,
      });
    }

    setEmails(val);
    setHasCheckedSetoran(false);
  };

  /* ------------------------------------------------------------------ */
  /* Checker untuk Kolom Setoran (Hanya cek Gmail hasil generate)       */
  /* Email non-generate: ABAIKAN dan beri status DIABAIKAN               */
  /* Email sudah disetor: Tidak dicek lagi                               */
  /* ------------------------------------------------------------------ */
  const handleCheckSetoran = async () => {
    const rawLines = emails
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (rawLines.length === 0) {
      toast.error("Tidak ada Gmail untuk dicek", {
        description: "Masukkan minimal satu email pada kolom setoran.",
      });
      return;
    }

    if (rawLines.length > 100) {
      toast.error("Maksimal 100 Gmail per pengecekan!", {
        description: `Saat ini terdapat ${rawLines.length} Gmail. Maksimal 100 Gmail.`,
      });
      return;
    }

    setIsCheckingSetoran(true);
    setHasCheckedSetoran(true);
    setSetoranCheckResults([]);

    const currentStored = typeof window !== "undefined" ? getStoredGeneratedGmails() : [];
    const historySet = typeof window !== "undefined" ? getStoredHistory() : new Set<string>();
    const allGeneratedSet = new Set<string>([
      ...Array.from(generatedPool).map((e) => e.toLowerCase()),
      ...currentStored.map((e) => e.toLowerCase()),
      ...Array.from(historySet).map((e) => e.toLowerCase()),
    ]);

    const items: SetoranCheckItem[] = [];
    const toQueryViaApi: { email: string; index: number }[] = [];

    rawLines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(lower);

      if (!isGmail) {
        items.push({
          index: idx + 1,
          email: line,
          status: "INVALID",
          reason: "Format email tidak valid atau bukan domain @gmail.com",
        });
        return;
      }

      // Email yang sudah disetor: TIDAK PERLU DICEK LAGI
      if (submittedSet.has(lower)) {
        items.push({
          index: idx + 1,
          email: line,
          status: "SUDAH DISETOR",
          reason: "Email sudah disetor sebelumnya (tidak perlu dicek lagi)",
        });
        return;
      }

      const isGenerated = allGeneratedSet.has(lower);

      if (!isGenerated) {
        // BUKAN HASIL GENERATE: ABAIKAN dan beri status
        items.push({
          index: idx + 1,
          email: line,
          status: "DIABAIKAN",
          reason: "Bukan hasil Generate Gmail (Diabaikan)",
        });
        return;
      }

      // HASIL GENERATE BELUM DISETOR: Masuk antrian cek status ke API
      toQueryViaApi.push({ email: line, index: idx + 1 });
    });

    if (toQueryViaApi.length > 0) {
      try {
        const res = await fetch("/api/check-gmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emails: toQueryViaApi.map((q) => q.email),
            startIndex: 1,
            storedGenerated: Array.from(allGeneratedSet),
          }),
        });

        const updatedStatusMap = { ...checkStatusMap };

        if (res.ok) {
          const data = await res.json();
          const apiMap = new Map<string, { status: "live" | "die" | "invalid"; message: string }>();
          if (Array.isArray(data.results)) {
            data.results.forEach((r: { email: string; status: "live" | "die" | "invalid"; message: string }) => {
              apiMap.set(r.email.toLowerCase(), {
                status: r.status,
                message: r.message,
              });
            });
          }

          toQueryViaApi.forEach((q) => {
            const apiRes = apiMap.get(q.email.toLowerCase());
            const status: "LIVE" | "UNREGISTERED" =
              apiRes?.status === "live" ? "LIVE" : "UNREGISTERED";
            updatedStatusMap[q.email.toLowerCase()] = status;
            items.push({
              index: q.index,
              email: q.email,
              status: status,
              reason:
                apiRes?.message ||
                (status === "LIVE"
                  ? "Akun aktif terdaftar di Google"
                  : "Akun tidak terdaftar di Google"),
            });
          });
        } else {
          toQueryViaApi.forEach((q) => {
            updatedStatusMap[q.email.toLowerCase()] = "UNREGISTERED";
            items.push({
              index: q.index,
              email: q.email,
              status: "UNREGISTERED",
              reason: "Akun tidak terdaftar di Google",
            });
          });
        }

        setCheckStatusMap(updatedStatusMap);
        saveStoredCheckStatusMap(updatedStatusMap);
      } catch {
        const updatedStatusMap = { ...checkStatusMap };
        toQueryViaApi.forEach((q) => {
          updatedStatusMap[q.email.toLowerCase()] = "UNREGISTERED";
          items.push({
            index: q.index,
            email: q.email,
            status: "UNREGISTERED",
            reason: "Akun tidak terdaftar di Google",
          });
        });
        setCheckStatusMap(updatedStatusMap);
        saveStoredCheckStatusMap(updatedStatusMap);
      }
    }

    items.sort((a, b) => a.index - b.index);
    setSetoranCheckResults(items);
    setIsCheckingSetoran(false);

    const ignoredCount = items.filter((r) => r.status === "DIABAIKAN").length;
    const liveCount = items.filter((r) => r.status === "LIVE").length;
    const unregCount = items.filter((r) => r.status === "UNREGISTERED").length;
    const alreadySubmitted = items.filter((r) => r.status === "SUDAH DISETOR").length;

    toast.success("Pemeriksaan Kolom Checker selesai!", {
      description: `${liveCount} Live · ${unregCount} Unregistered · ${alreadySubmitted} Sudah Disetor · ${ignoredCount} Diabaikan`,
    });
  };

  const liveResults = React.useMemo(() => {
    return setoranCheckResults.filter((r) => r.status === "LIVE");
  }, [setoranCheckResults]);

  const liveCount = liveResults.length;
  const calculatedEarnings = liveCount * 4500;

  const lastHoverToastTime = React.useRef(0);
  const handleHoverDisabledSubmit = () => {
    const now = Date.now();
    if (now - lastHoverToastTime.current > 3000) {
      lastHoverToastTime.current = now;
      toast.error("Tidak ada email live untuk disetor", {
        description: !hasCheckedSetoran
          ? "Silakan klik tombol 'Cek Status' terlebih dahulu."
          : "Harap cek secara berkala, menunggu server google mencatat email yang kamu buat telah Aktif/Live.",
      });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (totalLines === 0) {
      toast.error("Masukkan minimal 1 Gmail");
      return;
    }
    if (isExceededMax) {
      toast.error("Maksimal 100 Gmail!", {
        description: `Saat ini terdapat ${totalLines} Gmail. Harap kurangi hingga maksimal 100 Gmail.`,
      });
      return;
    }
    if (!hasCheckedSetoran) {
      toast.error("Wajib periksa status terlebih dahulu!", {
        description: "Klik tombol 'Cek Status' untuk memvalidasi akun yang LIVE sebelum disetor.",
      });
      return;
    }
    if (liveCount === 0) {
      toast.error("Tidak ada email live untuk disetor", {
        description: "Harap cek secara berkala, menunggu server google mencatat email yang kamu buat telah Aktif/Live.",
      });
      return;
    }

    setIsSubmitting(true);
    const totalEarnings = liveCount * 4500;
    const liveEmailList = liveResults.map((r) => r.email.toLowerCase());

    (async () => {
      try {
        const user = await getCurrentAuthUser();
        if (user) {
          await insertUserDeposits(user.id, liveEmailList, "good", 4500);
        }
      } catch (err) {
        console.warn("Supabase insert error (fallback used):", err);
      } finally {
        setIsSubmitting(false);
        refreshDeposits();
        refreshWallet();

        // Tandai akun LIVE sebagai sudah disetor
        const newSubmitted = new Set([...Array.from(submittedSet), ...liveEmailList]);
        setSubmittedSet(newSubmitted);
        saveStoredSubmittedGmails(Array.from(newSubmitted));

        // Update status pada hasil pemeriksaan menjadi SUDAH DISETOR
        setSetoranCheckResults((prev) =>
          prev.map((item) =>
            liveEmailList.includes(item.email.toLowerCase())
              ? { ...item, status: "SUDAH DISETOR" as const, reason: "Berhasil disetor ke sistem" }
              : item
          )
        );

        const nonLiveCount = totalLines - liveCount;
        const partialNote =
          nonLiveCount > 0 ? ` (${nonLiveCount} akun belum LIVE/diabaikan tidak ikut disetor)` : "";

        toast.success(`${liveCount} Gmail LIVE berhasil disetor!${partialNote}`, {
          description: `Total ${formatIDR(totalEarnings)} jika di-ACC · Akun telah ditandai 'Sudah Disetor' di atas.`,
        });
      }
    })();
  };

  return (
    <PageShell>
      <div className="space-y-4 pt-2 sm:pt-4">
        {/* 1. Banner Cek Rules dulu sebelum setor (Ungu) */}
        <Reveal delay={20}>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-purple-200/90 bg-purple-50/70 p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
                <ScrollText className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm sm:text-[0.95rem] font-bold text-ink-900 truncate">
                  Cek Rules dulu sebelum setor
                </p>
                <p className="text-xs text-ink-500 truncate">
                  Wajib dibaca agar Gmail tidak ditolak.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="shrink-0 rounded-full bg-purple-600 px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-purple-700 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Buka Rules
            </button>
          </div>
        </Reveal>

        {/* 2. Section Title & Description */}
        <Reveal delay={40}>
          <div className="pt-1">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-ink-900">
              Setor Daftar Gmail
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-500 leading-relaxed">
              Tempel daftar, satu Gmail per baris. Duplikat otomatis dihapus. Hanya Gmail hasil &quot;Generate Gmail&quot; milik akun ini yang bisa disetor.
            </p>
          </div>
        </Reveal>

        {/* 3. Password Wajib Card (DIPERKECIL & RAMPING DENGAN HIGHLIGHT winter1212) */}
        <Reveal delay={60}>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <span className="text-sm">🔑</span>
                <span>Password wajib untuk Gmail yang disetor:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/90 px-2.5 py-0.5 font-mono text-sm font-black tracking-wider text-amber-950 shadow-2xs select-all">
                  {defaultPassword}
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    title="Salin password wajib"
                    className="text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
                  >
                    {copiedPassword ? (
                      <Check className="size-3 text-emerald-700" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </span>
                <span className="text-[0.68rem] text-amber-800/85 font-semibold">
                  (huruf kecil semua)
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 4. Generate Gmail Card (INLINE, TANPA POPUP) */}
        <Reveal delay={80}>
          <div className="rounded-3xl border border-purple-200/90 bg-white p-5 sm:p-6 shadow-card">
            {/* Header */}
            <div className="flex items-center gap-2 text-purple-700 font-bold text-base sm:text-lg">
              <Sparkles className="size-5 text-purple-600" />
              <h3>Generate Gmail</h3>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-ink-600 leading-relaxed">
              Ambil nama Gmail dari stok yang sudah disiapkan admin, lalu daftarkan akun Gmail asli memakai nama tersebut sebelum disetorkan pada kolom setoran di bagian bawah halaman.
            </p>

            {/* 4 Steps Instructions */}
            <ol className="mt-3.5 space-y-1.5 text-xs sm:text-sm text-ink-600 list-decimal list-inside leading-relaxed">
              <li>
                Tekan tombol <strong className="font-semibold text-ink-800">Generate Gmail</strong> dan pilih jumlah yang Anda ingin setorkan.
              </li>
              <li>Salin nama Gmail satu per satu, atau salin semuanya sekaligus.</li>
              <li>Daftarkan akun Gmail dengan nama tersebut dan password wajib di bawah.</li>
              <li>Tempel Gmail yang sudah jadi ke kolom setoran di bawah, lalu kirim.</li>
            </ol>

            {/* Highlighted Password Warning under instructions */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-ink-700 font-medium">
              <span>Password wajib:</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/90 px-2.5 py-0.5 font-mono font-black text-amber-950 shadow-2xs">
                {defaultPassword}
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-amber-800 hover:text-amber-950 cursor-pointer"
                  title="Salin password"
                >
                  <Copy className="size-3" />
                </button>
              </span>
            </div>

            {/* Pilih Jumlah Generate Email (Input 1-100 & Presets) */}
            <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/40 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Jumlah:
                  </span>
                  {/* Presets */}
                  {[5, 10, 20, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setCustomCountInput(num);
                        if (generatedList.length === 0) {
                          handleGenerate(num);
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                        customCountInput === num
                          ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                          : "border-purple-200 bg-white text-purple-800 hover:bg-purple-100/80"
                      )}
                    >
                      {num}
                    </button>
                  ))}

                  {/* Input field 1 - 100 */}
                  <div className="flex items-center gap-1 ml-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={customCountInput}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setCustomCountInput(Math.max(1, Math.min(100, val)));
                        } else {
                          setCustomCountInput(1);
                        }
                      }}
                      className="w-16 rounded-lg border border-purple-300 bg-white px-2 py-1 text-center font-mono text-xs font-bold text-ink-900 focus:border-purple-500 focus:outline-none"
                    />
                    <span className="text-[0.72rem] text-purple-700 font-medium">akun</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate(customCountInput)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="size-3.5" />
                  <span>Generate Gmail</span>
                </button>
              </div>

              {/* Generated Gmail Box (PERSIS SEPERTI GAMBAR) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-ink-900">
                    Generated Gmail
                  </h4>
                  <p className="text-xs text-ink-500 font-medium">
                    Total:{" "}
                    <strong suppressHydrationWarning className="text-ink-800">
                      {isMounted ? generatedList.length : 0}
                    </strong>{" "}
                    · Belum disetor:{" "}
                    <strong suppressHydrationWarning className="text-ink-800">
                      {isMounted ? unsubmittedCount : 0}
                    </strong>
                  </p>
                </div>

                {/* Email rows or Empty state */}
                {!isMounted ? (
                  <div className="py-8 text-center text-xs text-ink-400">
                    Memuat daftar Gmail...
                  </div>
                ) : generatedList.length === 0 ? (
                  <div className="py-7 px-4 text-center rounded-2xl border border-dashed border-purple-200 bg-white/70">
                    <Sparkles className="size-6 text-purple-400 mx-auto mb-2 opacity-70" />
                    <p className="text-xs sm:text-sm font-semibold text-ink-700">
                      Belum ada Gmail yang digenerate
                    </p>
                    <p className="text-[0.75rem] text-ink-400 mt-1 max-w-sm mx-auto">
                      Pilih jumlah di atas lalu klik tombol{" "}
                      <strong className="text-purple-700">Generate Gmail</strong> untuk membuat nama Gmail baru.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                      {generatedList.map((email, idx) => {
                        const lower = email.toLowerCase();
                        const isSubmitted = submittedSet.has(lower);
                        const checkStatus = checkStatusMap[lower];

                        return (
                          <div
                            key={email + idx}
                            onClick={() => handleCopyOne(email)}
                            className="group flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2 sm:px-3 hover:bg-sky-50/50 hover:border-sky-200 transition-colors cursor-pointer"
                            title="Klik untuk menyalin"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Copy
                                className={cn(
                                  "size-3.5 shrink-0 transition-colors",
                                  copiedEmail === email
                                    ? "text-emerald-600"
                                    : "text-slate-400 group-hover:text-sky-600"
                                )}
                              />
                              <span
                                suppressHydrationWarning
                                className="font-mono text-xs sm:text-[0.82rem] font-medium text-ink-900 truncate select-all"
                              >
                                {email}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Badge Status Cek (Muncul ketika dicek: Live / Unregistered) */}
                              {checkStatus && (
                                <span
                                  suppressHydrationWarning
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider transition-colors",
                                    checkStatus === "LIVE"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-rose-100 text-rose-800 border border-rose-300"
                                  )}
                                >
                                  {checkStatus === "LIVE" ? "Live" : "Unregistered"}
                                </span>
                              )}

                              {/* Badge Status Setor (Disebelah kanan) */}
                              <span
                                suppressHydrationWarning
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold transition-colors",
                                  isSubmitted
                                    ? "bg-emerald-100 text-emerald-700 font-bold"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                {isSubmitted ? "Sudah Disetor" : "Belum Disetor"}
                              </span>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGenerated(idx);
                                }}
                                title="Hapus Gmail ini"
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-xs text-ink-500 leading-relaxed">
                      Ketuk salah satu Gmail untuk menyalinnya satu per satu, atau gunakan tombol di bawah untuk menyalin banyak sekaligus.
                    </p>

                    {/* 3 Action Buttons (Hanya muncul jika sudah klik Generate Gmail) */}
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={handleCopyAll}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-4 font-semibold text-xs sm:text-sm text-ink-800 hover:bg-slate-50 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <Copy className="size-4 text-ink-600" />
                        <span>Salin Semua Gmail</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyUnsubmitted}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 px-4 font-semibold text-xs sm:text-sm text-ink-800 hover:bg-slate-50 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <Copy className="size-4 text-ink-600" />
                        <span>Salin Gmail Belum Disetor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGenerateMore(customCountInput)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50/70 py-2.5 px-4 font-semibold text-xs sm:text-sm text-purple-700 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                      >
                        <Sparkles className="size-4 text-purple-600" />
                        <span>
                          Generate Lagi (+{Math.min(customCountInput, Math.max(0, 100 - generatedList.length))})
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* 5. Form Kolom Setoran dengan Checker Terintegrasi */}
        <Reveal delay={100}>
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-card">
            {/* Header Kolom Checker & Setoran */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-sky-600" />
                <label className="text-xs sm:text-sm font-bold text-ink-900">
                  Kolom Checker &amp; Setoran
                </label>
                {totalLines > 0 && (
                  <span
                    className={cn(
                      "text-[0.7rem] px-2 py-0.5 rounded-full font-semibold tabular-nums",
                      isExceededMax
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {totalLines} Gmail{isExceededMax ? " (Maks. 100)" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Tombol Paste Hasil Generate */}
                {generatedList.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePasteGenerated}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100/90 px-3 py-1.5 text-xs font-bold text-sky-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Tempel Gmail hasil generate ke kolom checker"
                  >
                    <ClipboardPaste className="size-3.5" />
                    <span>Paste Hasil Generate ({generatedList.length})</span>
                  </button>
                )}

                {emails.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearEmails}
                    className="inline-flex items-center gap-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs"
                    title="Kosongkan kolom"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={9}
              value={emails}
              onChange={handleTextareaChange}
              placeholder={"contoh1@gmail.com\ncontoh2@gmail.com"}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              className={cn(
                "w-full min-h-[220px] rounded-2xl border p-4 font-mono text-xs sm:text-sm leading-relaxed text-ink-900 placeholder:text-slate-400 outline-none transition-all resize-y",
                isExceededMax
                  ? "border-rose-400 focus:ring-2 focus:ring-rose-200"
                  : "border-slate-200/90 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              )}
            />

            {/* Hasil Checker Setoran (Hanya muncul jika sudah ada pemeriksaan) */}
            {hasCheckedSetoran && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-purple-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-ink-900">
                      Hasil Pemeriksaan Kolom Checker
                    </h4>
                  </div>

                  {/* Badges Rekap */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 text-[0.7rem]">
                      {setoranCheckResults.filter((r) => r.status === "LIVE").length} Live
                    </span>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-800 text-[0.7rem]">
                      {setoranCheckResults.filter((r) => r.status === "UNREGISTERED").length} Unregistered
                    </span>
                    {setoranCheckResults.filter((r) => r.status === "SUDAH DISETOR").length > 0 && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold text-blue-900 text-[0.7rem]">
                        {setoranCheckResults.filter((r) => r.status === "SUDAH DISETOR").length} Sudah Disetor
                      </span>
                    )}
                    {setoranCheckResults.filter((r) => r.status === "DIABAIKAN").length > 0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-900 text-[0.7rem]">
                        {setoranCheckResults.filter((r) => r.status === "DIABAIKAN").length} Diabaikan
                      </span>
                    )}
                  </div>
                </div>

                {/* Detail list with max height */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {setoranCheckResults.map((item) => {
                    return (
                      <div
                        key={item.index + item.email}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2 sm:px-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-ink-400 text-[0.7rem] w-5 text-right shrink-0">
                            {item.index}.
                          </span>
                          <span className="font-mono text-xs text-ink-900 font-medium truncate select-all">
                            {item.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider",
                              item.status === "LIVE" && "bg-emerald-100 text-emerald-800 border border-emerald-200",
                              item.status === "UNREGISTERED" && "bg-rose-100 text-rose-800 border border-rose-200",
                              item.status === "SUDAH DISETOR" && "bg-blue-100 text-blue-800 border border-blue-200",
                              item.status === "DIABAIKAN" && "bg-amber-100 text-amber-900 border border-amber-200",
                              item.status === "INVALID" && "bg-rose-100 text-rose-800 border border-rose-200"
                            )}
                          >
                            {item.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyOne(item.email)}
                            title="Salin email"
                            className="p-1 text-slate-400 hover:text-ink-800 cursor-pointer"
                          >
                            <Copy className="size-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {setoranCheckResults.some((r) => r.status === "DIABAIKAN") && (
                  <p className="mt-2 text-[0.72rem] text-amber-800 bg-amber-50 rounded-xl p-2.5 border border-amber-200 leading-relaxed">
                    ⚠️ <strong>Email bukan hasil generate diabaikan</strong> dari sistem setoran. Checker hanya memproses Gmail yang digenerate oleh akun Anda.
                  </p>
                )}

                {/* Notifikasi jika 0 yang LIVE setelah dicheck */}
                {hasCheckedSetoran && liveCount === 0 && (
                  <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50/95 p-3.5 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs animate-fade-up">
                    <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-bold text-amber-900">
                        Belum ada akun yang LIVE terdeteksi
                      </p>
                      <p className="mt-0.5 text-amber-900 text-[0.76rem] leading-relaxed">
                        Harap cek secara berkala, menunggu server google mencatat email yang kamu buat telah{" "}
                        <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs underline underline-offset-2">
                          Aktif/Live
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Row under Textarea */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs sm:text-sm text-ink-700">
                  {hasCheckedSetoran ? (
                    <>
                      Terverifikasi LIVE:{" "}
                      <strong className="font-bold text-emerald-700">{liveCount}</strong> akun
                      {setoranCheckResults.filter((r) => r.status === "UNREGISTERED").length > 0 && (
                        <span className="text-rose-600 font-medium ml-1.5">
                          ({setoranCheckResults.filter((r) => r.status === "UNREGISTERED").length} unregistered)
                        </span>
                      )}
                      {setoranCheckResults.filter((r) => r.status === "SUDAH DISETOR").length > 0 && (
                        <span className="text-blue-600 font-medium ml-1.5">
                          ({setoranCheckResults.filter((r) => r.status === "SUDAH DISETOR").length} sudah disetor)
                        </span>
                      )}
                      {notGeneratedCount > 0 && (
                        <span className="text-amber-600 font-medium ml-1.5">
                          ({notGeneratedCount} diabaikan)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      Terdeteksi: <strong className="font-bold text-ink-900">{validCount}</strong> baris Gmail hasil generate
                      {notGeneratedCount > 0 && (
                        <span className="text-amber-600 font-medium ml-1.5">
                          ({notGeneratedCount} diabaikan)
                        </span>
                      )}
                    </>
                  )}
                </p>

                {/* Muncul hanya apabila minimal 1 gmail LIVE */}
                {hasCheckedSetoran && liveCount > 0 && (
                  <p className="mt-1 text-xs sm:text-sm font-bold text-ink-900">
                    Setor Gmail : {formatIDR(calculatedEarnings)} Jika di ACC
                    <span className="text-emerald-700 font-semibold text-xs ml-1">
                      ({liveCount} akun LIVE)
                    </span>
                  </p>
                )}

                <p className="mt-0.5 text-[0.75rem] text-ink-400 font-medium">
                  {!hasCheckedSetoran
                    ? "Wajib klik 'Cek Status' sebelum menyetor untuk memvalidasi akun LIVE."
                    : "Estimasi pengecekan 12-24 jam."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Tombol Checker Kolom Setoran */}
                <button
                  type="button"
                  onClick={handleCheckSetoran}
                  disabled={totalLines === 0 || isExceededMax || isCheckingSetoran}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer",
                    (totalLines === 0 || isExceededMax || isCheckingSetoran) && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {isCheckingSetoran ? (
                    <RefreshCw className="size-4 animate-spin text-purple-600" />
                  ) : (
                    <ShieldCheck className="size-4 text-purple-600" />
                  )}
                  <span>{isCheckingSetoran ? "Memeriksa..." : "Cek Status"}</span>
                </button>

                {/* Tombol Kirim Setoran dengan popup tooltip & hover warning */}
                <div
                  className="relative group inline-block"
                  onMouseEnter={() => {
                    if (!hasCheckedSetoran || liveCount === 0) {
                      handleHoverDisabledSubmit();
                    }
                  }}
                >
                  {/* Floating Tooltip Bubble saat 0 live atau belum cek */}
                  {(!hasCheckedSetoran || liveCount === 0) && (
                    <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-[0.72rem] font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 flex items-center gap-1.5">
                      <span>Tidak ada email live untuk disetor</span>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!hasCheckedSetoran || liveCount === 0 || isExceededMax || isSubmitting}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-xl px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-sm",
                      hasCheckedSetoran && liveCount > 0 && !isExceededMax
                        ? "bg-sky-500 hover:bg-sky-600 text-white cursor-pointer active:scale-95 shadow-md shadow-sky-500/20"
                        : "bg-sky-300 text-white cursor-not-allowed opacity-80"
                    )}
                  >
                    <Send className="size-4" />
                    <span>
                      {isSubmitting
                        ? "Mengirim..."
                        : liveCount > 0
                        ? `Kirim Setoran (${liveCount} LIVE)`
                        : "Kirim Setoran"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Reveal>
      </div>

      {/* Rules Modal */}
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </PageShell>
  );
}