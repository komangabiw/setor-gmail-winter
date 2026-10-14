"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  ClipboardCopy,
  Play,
  Trash2,
  Inbox,
  Copy,
  Check,
  ArrowRight,
  ArrowDownToLine,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status";
import { ShineBorder } from "@/components/ui/shine-border-04";
import { EmptyState, PageShell, PageHeader, Reveal } from "@/components/layout/page-shell";
import { type CheckResult, type CheckStatus, checkStatusMeta } from "@/lib/checker";
import { splitLines } from "@/lib/email";
import { getStoredGeneratedGmails } from "@/lib/generated-storage";
import { verifyEmailClientSide } from "@/lib/email-checker";
import { cn } from "@/lib/utils";

/** Pacing santai & bertahap: 2 email per request dengan jeda halus agar progres terlihat stabil dan pasti */
const BATCH_SIZE = 2;
const MAX_LINES = 100;

export function CheckerView() {
  const [input, setInput] = React.useState("");
  const [results, setResults] = React.useState<CheckResult[]>([]);
  const [scanned, setScanned] = React.useState(0);
  const [totalToScan, setTotalToScan] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);
  const [hasRun, setHasRun] = React.useState(false);
  const [copiedLive, setCopiedLive] = React.useState(false);
  const [copiedUnregistered, setCopiedUnregistered] = React.useState(false);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"all" | CheckStatus>("all");
  const [storedGenerated, setStoredGenerated] = React.useState<string[]>([]);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Sync generated emails from Setor tab
  const refreshStoredGenerated = React.useCallback(() => {
    setStoredGenerated(getStoredGeneratedGmails());
  }, []);

  React.useEffect(() => {
    refreshStoredGenerated();
    window.addEventListener("focus", refreshStoredGenerated);
    return () => {
      window.removeEventListener("focus", refreshStoredGenerated);
    };
  }, [refreshStoredGenerated]);

  // Cancel any running scan on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const lineCount = React.useMemo(() => splitLines(input).length, [input]);

  // Summarize results
  const summary = React.useMemo(() => {
    const live: string[] = [];
    const die: string[] = [];
    const invalid: string[] = [];

    for (const r of results) {
      if (r.status === "live") live.push(r.email);
      else if (r.status === "die") die.push(r.email);
      else invalid.push(r.email);
    }

    return {
      total: results.length,
      live,
      die,
      invalid,
      liveCount: live.length,
      dieCount: die.length,
      invalidCount: invalid.length,
    };
  }, [results]);

  const progress =
    totalToScan === 0 ? 0 : Math.min(100, Math.round((scanned / totalToScan) * 100));

  const isComplete = hasRun && !isRunning;

  // Filtered results list
  const filteredResults = React.useMemo(() => {
    if (activeFilter === "all") return results;
    return results.filter((r) => r.status === activeFilter);
  }, [results, activeFilter]);

  const handleStart = async () => {
    const rawLines = splitLines(input);
    if (rawLines.length === 0) {
      toast.error("Tidak ada email untuk dicek", {
        description: "Masukkan minimal satu email, satu baris per email.",
      });
      return;
    }

    if (rawLines.length > MAX_LINES) {
      toast.error(`Maksimal ${MAX_LINES} email per cek!`, {
        description: `Anda memasukkan ${rawLines.length} baris. Mohon kurangi hingga maksimal ${MAX_LINES} email.`,
      });
      return;
    }

    // Abort previous scan if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setResults([]);
    setScanned(0);
    setTotalToScan(rawLines.length);
    setCopiedLive(false);
    setCopiedUnregistered(false);
    setIsRunning(true);
    setHasRun(true);
    setActiveFilter("all");

    try {
      const allResults: CheckResult[] = [];
      let currentStartIndex = 1;

      // Process in small batches to display precise real-time progress
      for (let i = 0; i < rawLines.length; i += BATCH_SIZE) {
        if (controller.signal.aborted) break;

        const chunk = rawLines.slice(i, i + BATCH_SIZE);
        let batchResults: CheckResult[] = [];

        try {
          const res = await fetch("/api/check-gmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              emails: chunk,
              startIndex: currentStartIndex,
              storedGenerated: getStoredGeneratedGmails(),
            }),
            signal: controller.signal,
          });

          if (res.ok) {
            const data = await res.json();
            batchResults = data.results || [];
          } else {
            throw new Error(`Server returned ${res.status}`);
          }
        } catch {
          // Client-side fallback if static or offline
          const genPool = new Set(getStoredGeneratedGmails().map((g) => g.toLowerCase()));
          batchResults = chunk.map((email, idx) =>
            verifyEmailClientSide(email, currentStartIndex + idx, genPool)
          );
        }

        allResults.push(...batchResults);

        // Update live results & progress
        setResults([...allResults]);
        setScanned(allResults.length);
        currentStartIndex += chunk.length;

        // Pacing santai & teratur agar proses verifikasi tenang dan progres bertahap
        if (i + BATCH_SIZE < rawLines.length && !controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 380));
        }
      }

      if (!controller.signal.aborted) {
        setIsRunning(false);
        const liveTotal = allResults.filter((r) => r.status === "live").length;
        const dieTotal = allResults.filter((r) => r.status === "die").length;
        const invalidTotal = allResults.filter((r) => r.status === "invalid").length;

        toast.success("Pemeriksaan selesai!", {
          description: `${liveTotal} Live · ${dieTotal} Unregistered · ${invalidTotal} Invalid`,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setIsRunning(false);
      const errMsg = err instanceof Error ? err.message : "Gagal memeriksa email";
      toast.error("Terjadi kendala saat memeriksa email", {
        description: errMsg,
      });
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setInput("");
    setResults([]);
    setScanned(0);
    setTotalToScan(0);
    setIsRunning(false);
    setHasRun(false);
    setCopiedLive(false);
    setCopiedUnregistered(false);
    setActiveFilter("all");
    toast.info("Kolom email dibersihkan.");
  };

  const handlePasteGenerated = () => {
    const list = getStoredGeneratedGmails();
    if (list.length === 0) {
      toast.info("Belum ada email yang digenerate di tab Setor.");
      return;
    }
    const capped = list.slice(0, MAX_LINES);
    setInput(capped.join("\n"));
    if (hasRun && !isRunning) {
      setHasRun(false);
      setResults([]);
    }
    toast.success(`${capped.length} Gmail hasil Generate berhasil ditempel!`);
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = event.target.value;

    // Auto-separate any concatenated emails without newline
    if (/@gmail\.com[a-zA-Z0-9]/i.test(val)) {
      val = val.replace(/(@gmail\.com)([a-zA-Z0-9])/gi, "$1\n$2");
    }

    const lines = val.split("\n");
    if (lines.length > MAX_LINES) {
      toast.error(`Maksimal ${MAX_LINES} baris email!`, {
        description: `Kelebihan baris otomatis dibatasi hingga ${MAX_LINES} baris.`,
      });
      val = lines.slice(0, MAX_LINES).join("\n");
    }

    setInput(val);
    if (hasRun && !isRunning) {
      setHasRun(false);
      setResults([]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      const currentLines = input.split("\n").length;
      if (currentLines >= MAX_LINES) {
        event.preventDefault();
        toast.error(`Maksimal ${MAX_LINES} baris email tercapai!`, {
          description: "Tidak dapat menambah baris baru lagi.",
        });
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasteData = event.clipboardData.getData("text");
    if (!pasteData) return;

    let formattedPaste = pasteData;
    if (/@gmail\.com[a-zA-Z0-9]/i.test(formattedPaste)) {
      formattedPaste = formattedPaste.replace(/(@gmail\.com)([a-zA-Z0-9])/gi, "$1\n$2");
    }

    const currentLines = input ? input.split("\n") : [];
    const pastedLines = formattedPaste
      .split(/\r\n|\r|\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // If textarea is currently empty, paste up to MAX_LINES directly
    if (currentLines.length === 0) {
      event.preventDefault();
      const finalLines = pastedLines.slice(0, MAX_LINES);
      setInput(finalLines.join("\n"));
      if (pastedLines.length > MAX_LINES) {
        toast.error(`Maksimal ${MAX_LINES} baris email!`, {
          description: `Hanya ${MAX_LINES} baris pertama yang dimasukkan.`,
        });
      } else {
        toast.success(`${finalLines.length} email berhasil ditempel!`);
      }
      return;
    }

    // If already at or above 100 lines, reject pasting additional lines
    if (currentLines.length >= MAX_LINES) {
      event.preventDefault();
      toast.error(`Maksimal ${MAX_LINES} baris email tercapai!`, {
        description: "Tidak dapat menempel baris lebih dari 100.",
      });
      return;
    }
  };

  const handleCopyLive = async () => {
    if (summary.liveCount === 0) {
      toast.error("Tidak ada Gmail valid untuk disalin");
      return;
    }
    try {
      await navigator.clipboard.writeText(summary.live.join("\n"));
      setCopiedLive(true);
      window.setTimeout(() => setCopiedLive(false), 2000);
      toast.success(`${summary.liveCount} Gmail valid disalin ke clipboard!`, {
        description: "Hanya email berstatus LIVE yang disalin.",
      });
    } catch {
      toast.error("Gagal menyalin ke clipboard");
    }
  };

  const handleCopyUnregistered = async () => {
    if (summary.dieCount === 0) {
      toast.error("Tidak ada Gmail unregistered untuk disalin");
      return;
    }
    try {
      await navigator.clipboard.writeText(summary.die.join("\n"));
      setCopiedUnregistered(true);
      window.setTimeout(() => setCopiedUnregistered(false), 2000);
      toast.success(`${summary.dieCount} Gmail unregistered disalin ke clipboard!`, {
        description: "Daftar email berstatus UNREGISTERED disalin.",
      });
    } catch {
      toast.error("Gagal menyalin ke clipboard");
    }
  };

  const handleCopySingle = async (email: string, index: number) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedIndex(index);
      toast.success(`Disalin: ${email}`);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      toast.error("Gagal menyalin email");
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Email Checker"
        subtitle="Periksa status keaktifan email Gmail apapun secara akurat dan real-time langsung ke server Google."
        right={
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#121217]/80 border border-white/10 text-sky-400 shadow-card">
            <ShieldCheck className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
        }
      />

      {/* Input Card */}
      <Reveal delay={40}>
        <Card className="rounded-3xl border border-white/10 bg-[#121217]/85 backdrop-blur-xl shadow-2xl">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white">
                Daftar Gmail yang Akan Dicek
              </label>

              {/* Tombol Paste Generate Gmail muncul jika ada email yang sudah di-generate di Setor */}
              {storedGenerated.length > 0 && (
                <button
                  type="button"
                  onClick={handlePasteGenerated}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 border border-sky-500/25 shadow-2xs"
                  title="Tempel email hasil generate dari tab Setor"
                >
                  <ArrowDownToLine className="size-3.5" />
                  <span>Paste Hasil Generate ({storedGenerated.length})</span>
                </button>
              )}
            </div>

            <ShineBorder
              borderWidth={2}
              duration={5}
              color="var(--color-blue-500, #0ea5e9)"
              onClick={() => textareaRef.current?.focus()}
              className="w-full rounded-2xl shadow-sm cursor-text border border-white/10 bg-black/40"
            >
              <textarea
                ref={textareaRef}
                rows={7}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder={"contoh1@gmail.com\ncontoh2@gmail.com\ncontoh3@gmail.com"}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="w-full min-h-40 resize-y px-4 py-3 leading-relaxed font-mono text-xs sm:text-sm bg-black/40 border-0 outline-none focus:outline-none focus:ring-0 rounded-2xl text-white placeholder:text-zinc-500 relative z-30 pointer-events-auto cursor-text select-text"
              />
            </ShineBorder>

            <p className="text-[0.78rem] leading-relaxed text-zinc-400 px-0.5">
              {lineCount > 0 ? (
                <span
                  className={cn(
                    "tabular-nums font-semibold",
                    lineCount >= MAX_LINES ? "text-amber-400 font-bold" : "text-zinc-300"
                  )}
                >
                  {lineCount} email terdeteksi · 1 per baris · maks {MAX_LINES} email per cek. Memeriksa status keaktifan Gmail langsung ke server Google.
                  {lineCount >= MAX_LINES && " (Maksimal 100 baris tercapai)"}
                </span>
              ) : (
                `1 per baris · maks ${MAX_LINES} email per cek. Memeriksa status keaktifan Gmail langsung ke server Google.`
              )}
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row pt-1">
              <Button
                size="lg"
                fullWidth
                isLoading={isRunning}
                onClick={handleStart}
                leftIcon={isRunning ? undefined : <Play className="size-4" aria-hidden="true" />}
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-2xl shadow-md shadow-sky-500/20"
              >
                {isRunning ? `Memeriksa ${scanned}/${totalToScan}...` : "Mulai Checker"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={handleReset}
                disabled={isRunning || (!input && !hasRun)}
                leftIcon={<Trash2 className="size-4 text-slate-500 group-hover:text-rose-600" aria-hidden="true" />}
                className="rounded-2xl sm:w-auto hover:text-rose-600 hover:border-rose-200"
              >
                Hapus
              </Button>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* Real-time Progress Bar */}
      {isRunning && (
        <Reveal className="mt-4">
          <Card className="rounded-3xl border border-sky-500/30 bg-[#121217]/90 backdrop-blur-xl p-5 shadow-xl">
            <CardContent className="space-y-3 p-0">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-200">
                  <ShieldCheck className="size-4 animate-pulse text-sky-400" aria-hidden="true" />
                  <span>Memeriksa Akun Gmail:</span>
                  <span className="font-mono text-sky-400 font-bold">
                    {scanned} / {totalToScan} email
                  </span>
                </span>
                <span className="text-xs sm:text-sm font-black text-sky-400 tabular-nums">
                  {progress}%
                </span>
              </div>

              {/* Precise Animated Progress Bar */}
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress pemeriksaan email"
                className="h-3 w-full overflow-hidden rounded-full bg-black/50 border border-white/10 p-0.5"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 transition-all duration-200 ease-out shadow-xs shadow-sky-500/30"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-[0.72rem] text-zinc-400 text-center">
                Mengecek status keberadaan akun secara real-time
              </p>
            </CardContent>
          </Card>
        </Reveal>
      )}

      {/* Results Section */}
      {(hasRun || results.length > 0) && (
        <Reveal className="mt-5 space-y-5" delay={40}>
          {/* Rekap Status */}
          <Card className="rounded-3xl border border-white/10 bg-[#121217]/85 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
            <CardContent className="space-y-4 p-0">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-sm sm:text-base font-bold tracking-tight text-white">
                    Rekap Status
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Ringkasan hasil pemeriksaan akun Gmail
                  </p>
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-xs font-bold text-zinc-300 tabular-nums">
                  {summary.total} email diperiksa
                </span>
              </div>

              {/* 3 Status Cards: LIVE, UNREGISTERED, INVALID */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                <SummaryStat
                  label="LIVE"
                  value={summary.liveCount}
                  tone="success"
                  active={activeFilter === "live"}
                  onClick={() => setActiveFilter(activeFilter === "live" ? "all" : "live")}
                />
                <SummaryStat
                  label="UNREGISTERED"
                  value={summary.dieCount}
                  tone="danger"
                  active={activeFilter === "die"}
                  onClick={() => setActiveFilter(activeFilter === "die" ? "all" : "die")}
                />
                <SummaryStat
                  label="INVALID"
                  value={summary.invalidCount}
                  tone="neutral"
                  active={activeFilter === "invalid"}
                  onClick={() => setActiveFilter(activeFilter === "invalid" ? "all" : "invalid")}
                />
              </div>

              {/* Action Buttons: Salin Gmail Valid & Salin Gmail Unregistered */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  onClick={handleCopyLive}
                  disabled={summary.liveCount === 0 || isRunning}
                  leftIcon={
                    copiedLive ? (
                      <Check className="size-4 text-emerald-200" aria-hidden="true" />
                    ) : (
                      <ClipboardCopy className="size-4" aria-hidden="true" />
                    )
                  }
                  className="rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-500/20"
                >
                  {copiedLive ? "Gmail Valid Berhasil Disalin!" : `Salin Gmail Valid (${summary.liveCount})`}
                </Button>

                <Button
                  type="button"
                  size="lg"
                  fullWidth
                  variant="secondary"
                  onClick={handleCopyUnregistered}
                  disabled={summary.dieCount === 0 || isRunning}
                  leftIcon={
                    copiedUnregistered ? (
                      <Check className="size-4 text-rose-300" aria-hidden="true" />
                    ) : (
                      <ClipboardCopy className="size-4 text-rose-300" aria-hidden="true" />
                    )
                  }
                  className="rounded-2xl font-bold border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 shadow-xs"
                >
                  {copiedUnregistered ? "Gmail Unregistered Disalin!" : `Salin Gmail Unregistered (${summary.dieCount})`}
                </Button>
              </div>

              {/* Lanjut ke Setor Link */}
              {summary.liveCount > 0 && isComplete && (
                <div className="pt-0.5">
                  <Link
                    href="/setor"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-5 py-3 text-xs sm:text-sm font-bold text-sky-300 shadow-xs hover:bg-sky-500/20 active:scale-95 transition-all whitespace-nowrap"
                  >
                    <span>Lanjut ke Setor ({summary.liveCount} Gmail Valid)</span>
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail Hasil Table / List */}
          <Card className="rounded-3xl border border-white/10 bg-[#121217]/85 backdrop-blur-xl overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Detail Hasil Pemeriksaan
                </h3>
                <p className="text-xs text-zinc-400">
                  Status spesifik per alamat email
                </p>
              </div>

              {/* Filter Tabs: Semua / Live / Unregistered / Invalid */}
              <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activeFilter === "all"
                      ? "bg-white/15 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Semua ({results.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("live")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activeFilter === "live"
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-xs"
                      : "text-emerald-400 hover:bg-emerald-500/10"
                  )}
                >
                  Live ({summary.liveCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("die")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activeFilter === "die"
                      ? "bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-xs"
                      : "text-rose-400 hover:bg-rose-500/10"
                  )}
                >
                  Unregistered ({summary.dieCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("invalid")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activeFilter === "invalid"
                      ? "bg-white/15 border border-white/20 text-zinc-200 shadow-xs"
                      : "text-zinc-400 hover:bg-white/5"
                  )}
                >
                  Invalid ({summary.invalidCount})
                </button>
              </div>
            </div>

            {/* List */}
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Tidak ada hasil dengan status {activeFilter === "die" ? "UNREGISTERED" : activeFilter.toUpperCase()}.
              </div>
            ) : (
              <ul className="divide-y divide-white/10 max-h-[420px] overflow-y-auto">
                {filteredResults.map((result) => {
                  const meta = checkStatusMeta[result.status];
                  return (
                    <li
                      key={result.index}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/5 transition-colors"
                    >
                      {/* Left: Index & Email Address */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 shrink-0 text-xs font-mono font-semibold text-zinc-500">
                          {result.index}.
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate font-mono text-xs sm:text-[0.84rem] font-medium",
                              result.status === "live"
                                ? "text-white font-semibold"
                                : result.status === "die"
                                ? "text-zinc-300"
                                : "text-zinc-500"
                            )}
                            title={result.email}
                          >
                            {result.email}
                          </p>
                          {result.message && (
                            <p className="text-[0.68rem] text-zinc-400 truncate">
                              {result.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Status Badge on left, Copy button on FAR RIGHT so it is perfectly aligned */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Status Badge with fixed width for vertical consistency */}
                        <div className="w-[108px] flex justify-end">
                          <StatusBadge tone={meta.tone} dot className="w-full justify-center font-bold text-[0.68rem] tracking-wide">
                            {meta.label}
                          </StatusBadge>
                        </div>

                        {/* Copy button on the far right edge */}
                        <button
                          type="button"
                          onClick={() => handleCopySingle(result.email, result.index)}
                          title="Salin email ini"
                          className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-zinc-400 hover:text-sky-300 hover:border-sky-500/40 transition-all cursor-pointer active:scale-90 shrink-0 shadow-2xs"
                        >
                          {copiedIndex === result.index ? (
                            <Check className="size-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </Reveal>
      )}

      {/* Empty State when never run */}
      {!hasRun && (
        <Reveal className="mt-5" delay={80}>
          <EmptyState
            compact
            icon={<Inbox className="size-5" aria-hidden="true" />}
            title="Belum ada hasil pemeriksaan"
            description="Masukkan daftar Gmail di atas lalu klik Mulai Checker untuk memverifikasi akun secara real-time."
          />
        </Reveal>
      )}
    </PageShell>
  );
}

function SummaryStat({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: "success" | "danger" | "neutral";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClasses = {
    success: active
      ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-300 ring-2 ring-emerald-500/40"
      : "border-emerald-500/25 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50",
    danger: active
      ? "border-rose-500/60 bg-rose-950/60 text-rose-300 ring-2 ring-rose-500/40"
      : "border-rose-500/25 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50",
    neutral: active
      ? "border-sky-500/60 bg-sky-950/60 text-sky-200 ring-2 ring-sky-500/40"
      : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border py-3.5 sm:py-4 px-2.5 sm:px-4 text-center transition-all cursor-pointer select-none",
        toneClasses[tone]
      )}
    >
      <p className="text-xl sm:text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-[0.66rem] sm:text-xs font-bold tracking-wider uppercase opacity-90 truncate">
        {label}
      </p>
    </button>
  );
}
