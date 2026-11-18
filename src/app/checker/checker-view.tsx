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
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { EmptyState, PageShell, Reveal } from "@/components/layout/page-shell";
import { splitLines } from "@/lib/email";
import {
  getStoredCheckStatusMap,
  saveStoredCheckStatusMap,
} from "@/lib/generated-storage";
import {
  type GmailProbeItem,
  type GmailProbeStatus,
  validateGmailForProbe,
} from "@/lib/gmail-check-shared";
import { cn } from "@/lib/utils";

const MAX_LINES = 10;

const probeStatusMeta: Record<
  GmailProbeStatus,
  { label: string; tone: "success" | "info" | "warning" | "danger" | "neutral" }
> = {
  LIVE: { label: "LIVE", tone: "success" },
  AVAILABLE: { label: "AVAILABLE", tone: "info" },
  LIMIT: { label: "LIMIT", tone: "warning" },
  INVALID: { label: "INVALID", tone: "danger" },
  ERROR: { label: "ERROR", tone: "neutral" },
};

export function CheckerView() {
  const [input, setInput] = React.useState("");
  const [results, setResults] = React.useState<GmailProbeItem[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [hasRun, setHasRun] = React.useState(false);
  const [totalElapsedMs, setTotalElapsedMs] = React.useState<number | null>(null);
  const [copiedLive, setCopiedLive] = React.useState(false);
  const [copiedAvailable, setCopiedAvailable] = React.useState(false);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<"ALL" | GmailProbeStatus>("ALL");

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const lineCount = React.useMemo(() => splitLines(input).length, [input]);

  const summary = React.useMemo(() => {
    const live: string[] = [];
    const available: string[] = [];
    const limit: string[] = [];
    const invalid: string[] = [];

    for (const r of results) {
      if (r.status === "LIVE") live.push(r.email);
      else if (r.status === "AVAILABLE") available.push(r.email);
      else if (r.status === "LIMIT" || r.status === "ERROR") limit.push(r.email);
      else invalid.push(r.email);
    }

    return {
      total: results.length,
      live,
      available,
      limit,
      invalid,
      liveCount: live.length,
      availableCount: available.length,
      limitCount: limit.length,
      invalidCount: invalid.length,
    };
  }, [results]);

  const isComplete = hasRun && !isRunning;

  const filteredResults = React.useMemo(() => {
    if (activeFilter === "ALL") return results;
    if (activeFilter === "LIMIT") {
      return results.filter((r) => r.status === "LIMIT" || r.status === "ERROR");
    }
    return results.filter((r) => r.status === activeFilter);
  }, [results, activeFilter]);

  const handleStart = async () => {
    const rawLines = splitLines(input);
    if (rawLines.length === 0) {
      toast.error("Tidak ada email untuk dicek", {
        description: "Masukkan minimal satu alamat @gmail.com pada kolom di atas.",
      });
      return;
    }

    if (rawLines.length > MAX_LINES) {
      toast.error(`Maksimal ${MAX_LINES} email per cek!`, {
        description: `Anda memasukkan ${rawLines.length} baris. Mohon kurangi hingga maksimal ${MAX_LINES} email.`,
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setResults([]);
    setTotalElapsedMs(null);
    setCopiedLive(false);
    setCopiedAvailable(false);
    setIsRunning(true);
    setHasRun(true);
    setActiveFilter("ALL");

    const t0 = Date.now();

    try {
      const res = await fetch("/api/gmail-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: rawLines }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Server merespons ${res.status}`);
      }

      const probeItems: GmailProbeItem[] = Array.isArray(data.results) ? data.results : [];
      setResults(probeItems);
      setTotalElapsedMs(typeof data.total_elapsed_ms === "number" ? data.total_elapsed_ms : Date.now() - t0);
      setIsRunning(false);

      // Sync LIVE / AVAILABLE statuses into localStorage map for Setor page
      const statusMap = { ...getStoredCheckStatusMap() };
      for (const item of probeItems) {
        if (item.status === "LIVE") {
          statusMap[item.email.toLowerCase()] = "LIVE";
        } else if (item.status === "AVAILABLE") {
          statusMap[item.email.toLowerCase()] = "UNREGISTERED";
        }
      }
      saveStoredCheckStatusMap(statusMap);

      const liveCount = probeItems.filter((r) => r.status === "LIVE").length;
      const availCount = probeItems.filter((r) => r.status === "AVAILABLE").length;
      const invCount = probeItems.filter(
        (r) => r.status === "INVALID" || r.status === "ERROR" || r.status === "LIMIT"
      ).length;

      toast.success("Pemeriksaan Gmail selesai!", {
        description: `${liveCount} LIVE · ${availCount} Available · ${invCount} Lainnya`,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      const fallbackItems: GmailProbeItem[] = rawLines.map((line, idx) => {
        const syntax = validateGmailForProbe(line);
        if (!syntax.valid) {
          return {
            index: idx + 1,
            email: syntax.cleanEmail || line,
            status: "INVALID",
            code: 400,
            message: syntax.reason || "Format email tidak valid",
            elapsed_ms: 0,
            engine: "SYNTAX",
          };
        }
        return {
          index: idx + 1,
          email: syntax.cleanEmail,
          status: "ERROR",
          code: 503,
          message: err instanceof Error ? err.message : "Gagal terhubung ke server checker",
          elapsed_ms: Date.now() - t0,
          engine: "HTTPS",
        };
      });

      setResults(fallbackItems);
      setIsRunning(false);
      toast.error("Kendala koneksi ke server checker", {
        description: err instanceof Error ? err.message : "Silakan coba lagi beberapa saat.",
      });
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setInput("");
    setResults([]);
    setTotalElapsedMs(null);
    setIsRunning(false);
    setHasRun(false);
    setCopiedLive(false);
    setCopiedAvailable(false);
    setActiveFilter("ALL");
    toast.info("Kolom email dibersihkan.");
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = event.target.value;

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

    if (currentLines.length >= MAX_LINES) {
      event.preventDefault();
      toast.error(`Maksimal ${MAX_LINES} baris email tercapai!`, {
        description: `Tidak dapat menempel baris lebih dari ${MAX_LINES}.`,
      });
      return;
    }
  };

  const handleCopyLive = async () => {
    if (summary.liveCount === 0) {
      toast.error("Tidak ada Gmail LIVE untuk disalin");
      return;
    }
    try {
      await navigator.clipboard.writeText(summary.live.join("\n"));
      setCopiedLive(true);
      window.setTimeout(() => setCopiedLive(false), 2000);
      toast.success(`${summary.liveCount} Gmail LIVE disalin ke clipboard!`, {
        description: "Siap ditempel pada kolom Setor.",
      });
    } catch {
      toast.error("Gagal menyalin ke clipboard");
    }
  };

  const handleCopyAvailable = async () => {
    if (summary.availableCount === 0) {
      toast.error("Tidak ada Gmail Available untuk disalin");
      return;
    }
    try {
      await navigator.clipboard.writeText(summary.available.join("\n"));
      setCopiedAvailable(true);
      window.setTimeout(() => setCopiedAvailable(false), 2000);
      toast.success(`${summary.availableCount} Gmail Available disalin ke clipboard!`, {
        description: "Alamat tersedia & belum pernah didaftarkan di Google.",
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
      <div className="flex flex-col justify-center min-h-[calc(100dvh-10rem)] py-5 sm:py-8">
        <div className="w-full my-auto space-y-5">
          {/* Input Card */}
          <Reveal delay={40}>
            <Card className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-[#151824]/92 via-[#11131c]/95 to-[#0c0d14]/95 backdrop-blur-2xl shadow-2xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent"
              />

              <CardContent className="space-y-4 p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-sky-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
                      <ShieldCheck className="size-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                          Gmail Live Checker
                        </h1>
                        {lineCount > 0 && (
                          <span
                            className={cn(
                              "text-[0.68rem] px-2 py-0.5 rounded-full font-bold tabular-nums border",
                              lineCount >= MAX_LINES
                                ? "bg-amber-500/15 border-amber-500/35 text-amber-300"
                                : "bg-sky-500/15 border-sky-500/35 text-sky-200"
                            )}
                          >
                            {lineCount}/{MAX_LINES} Gmail
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Periksa ketersediaan dan status aktif akun Gmail secara real-time
                      </p>
                    </div>
                  </div>

                  {input.trim().length > 0 && !isRunning && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer text-xs"
                      title="Kosongkan kolom"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  rows={8}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder={"contoh1@gmail.com\ncontoh2@gmail.com\ncontoh3@gmail.com"}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  className={cn(
                    "w-full min-h-[210px] rounded-2xl border p-4 font-mono text-xs sm:text-sm leading-relaxed text-white placeholder:text-zinc-500 bg-black/45 outline-none transition-all resize-y",
                    lineCount >= MAX_LINES
                      ? "border-amber-500/70 focus:ring-2 focus:ring-amber-500/30"
                      : "border-white/10 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                  )}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 text-[0.76rem] text-zinc-400 px-0.5">
                  <span>
                    {lineCount > 0 ? (
                      <span
                        className={cn(
                          "tabular-nums font-semibold",
                          lineCount >= MAX_LINES ? "text-amber-300 font-bold" : "text-zinc-300"
                        )}
                      >
                        {lineCount} email siap diperiksa · 1 baris per email (maks. {MAX_LINES})
                      </span>
                    ) : (
                      `Masukkan 1 alamat @gmail.com per baris · maksimal ${MAX_LINES} email sekali cek.`
                    )}
                  </span>
                  <span className="text-[0.7rem] text-zinc-500">
                    <strong className="text-emerald-400">LIVE</strong> = Sudah terdaftar ·{" "}
                    <strong className="text-sky-400">AVAILABLE</strong> = Belum dibuat
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row pt-1">
                  <Button
                    size="lg"
                    fullWidth
                    isLoading={isRunning}
                    onClick={handleStart}
                    leftIcon={
                      isRunning ? undefined : (
                        <Play className="size-4 fill-current" aria-hidden="true" />
                      )
                    }
                    className="btn-shimmer bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-extrabold rounded-2xl border border-sky-400/30 shadow-lg shadow-sky-500/25 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    {isRunning ? `Memeriksa ${lineCount} Gmail...` : "Mulai Live Checker"}
                  </Button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isRunning || (!input && !hasRun)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 h-12 px-6 text-sm font-bold rounded-2xl border transition-all active:scale-95 shadow-sm sm:w-auto shrink-0 select-none cursor-pointer",
                      isRunning || (!input && !hasRun)
                        ? "border-white/10 bg-white/5 text-zinc-500 cursor-not-allowed opacity-40 active:scale-100"
                        : "border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50 text-rose-300 hover:text-rose-200"
                    )}
                    title="Hapus / Bersihkan kolom"
                  >
                    <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* Active Scan Banner */}
          {isRunning && (
            <Reveal className="mt-4">
              <Card className="rounded-3xl border border-sky-400/25 bg-[#11131c]/90 backdrop-blur-xl p-5 shadow-2xl">
                <CardContent className="space-y-3 p-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-100">
                      <RefreshCw className="size-4 animate-spin text-sky-400" aria-hidden="true" />
                      <span>Memeriksa {lineCount} alamat Gmail ke server Google...</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-300 animate-pulse">
                      PROSES LIVE
                    </span>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/50 border border-white/10 p-0.5">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-600 animate-pulse" />
                  </div>

                  <p className="text-[0.72rem] text-zinc-400 text-center">
                    Mengecek status aktif akun secara real-time
                  </p>
                </CardContent>
              </Card>
            </Reveal>
          )}

          {/* Results Section */}
          {(hasRun || results.length > 0) && !isRunning && (
            <Reveal className="mt-5 space-y-5" delay={40}>
              {/* Rekap Status */}
              <Card className="rounded-3xl border border-white/12 bg-[#11131c]/90 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl">
                <CardContent className="space-y-4 p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                        Rekap Status Live Checker
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Klik kartu status di bawah untuk memfilter daftar hasil
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {totalElapsedMs !== null && (
                        <span className="rounded-full bg-sky-500/10 border border-sky-400/25 px-3 py-1 font-mono text-xs font-bold text-sky-300 tabular-nums">
                          {totalElapsedMs}ms
                        </span>
                      )}
                      <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 font-mono text-xs font-bold text-zinc-300 tabular-nums">
                        {summary.total} diperiksa
                      </span>
                    </div>
                  </div>

                  {/* 4 Status Cards: LIVE, AVAILABLE, LIMIT, INVALID */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    <SummaryStat
                      label="LIVE (Aktif)"
                      value={summary.liveCount}
                      tone="success"
                      active={activeFilter === "LIVE"}
                      onClick={() =>
                        setActiveFilter(activeFilter === "LIVE" ? "ALL" : "LIVE")
                      }
                    />
                    <SummaryStat
                      label="AVAILABLE"
                      value={summary.availableCount}
                      tone="info"
                      active={activeFilter === "AVAILABLE"}
                      onClick={() =>
                        setActiveFilter(activeFilter === "AVAILABLE" ? "ALL" : "AVAILABLE")
                      }
                    />
                    <SummaryStat
                      label="LIMIT"
                      value={summary.limitCount}
                      tone="warning"
                      active={activeFilter === "LIMIT"}
                      onClick={() =>
                        setActiveFilter(activeFilter === "LIMIT" ? "ALL" : "LIMIT")
                      }
                    />
                    <SummaryStat
                      label="INVALID"
                      value={summary.invalidCount}
                      tone="danger"
                      active={activeFilter === "INVALID"}
                      onClick={() =>
                        setActiveFilter(activeFilter === "INVALID" ? "ALL" : "INVALID")
                      }
                    />
                  </div>

                  {/* Copy Action Buttons */}
                  <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                    <Button
                      type="button"
                      size="lg"
                      fullWidth
                      onClick={handleCopyLive}
                      disabled={summary.liveCount === 0}
                      leftIcon={
                        copiedLive ? (
                          <Check className="size-4 text-emerald-200" aria-hidden="true" />
                        ) : (
                          <ClipboardCopy className="size-4" aria-hidden="true" />
                        )
                      }
                      className="rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    >
                      {copiedLive
                        ? "Gmail LIVE Berhasil Disalin!"
                        : `Salin Gmail LIVE (${summary.liveCount})`}
                    </Button>

                    <Button
                      type="button"
                      size="lg"
                      fullWidth
                      variant="secondary"
                      onClick={handleCopyAvailable}
                      disabled={summary.availableCount === 0}
                      leftIcon={
                        copiedAvailable ? (
                          <Check className="size-4 text-sky-300" aria-hidden="true" />
                        ) : (
                          <ClipboardCopy className="size-4 text-sky-300" aria-hidden="true" />
                        )
                      }
                      className="rounded-2xl font-bold border border-sky-500/35 bg-sky-500/12 text-sky-200 hover:bg-sky-500/20 hover:border-sky-400/50 shadow-xs"
                    >
                      {copiedAvailable
                        ? "Gmail Available Disalin!"
                        : `Salin Gmail Available (${summary.availableCount})`}
                    </Button>
                  </div>

                  {summary.liveCount > 0 && isComplete && (
                    <div className="pt-0.5">
                      <Link
                        href="/setor"
                        className="btn-shimmer inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-5 py-3 text-xs sm:text-sm font-extrabold text-emerald-200 shadow-xs active:scale-[0.99] transition-all whitespace-nowrap"
                      >
                        <span>Lanjut Setor ({summary.liveCount} Gmail LIVE)</span>
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detail Hasil List */}
              <Card className="rounded-3xl border border-white/12 bg-[#11131c]/90 backdrop-blur-2xl overflow-hidden shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      Detail Hasil Per Alamat
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Status ketersediaan dan waktu eksekusi tiap email
                    </p>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-black/45 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setActiveFilter("ALL")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        activeFilter === "ALL"
                          ? "bg-white/15 text-white shadow-xs"
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      Semua ({results.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("LIVE")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        activeFilter === "LIVE"
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                          : "text-emerald-400 hover:bg-emerald-500/10"
                      )}
                    >
                      Live ({summary.liveCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("AVAILABLE")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        activeFilter === "AVAILABLE"
                          ? "bg-sky-500/20 border border-sky-500/40 text-sky-300"
                          : "text-sky-400 hover:bg-sky-500/10"
                      )}
                    >
                      Available ({summary.availableCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("INVALID")}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        activeFilter === "INVALID"
                          ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                          : "text-rose-400 hover:bg-rose-500/10"
                      )}
                    >
                      Invalid ({summary.invalidCount})
                    </button>
                  </div>
                </div>

                {filteredResults.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    Tidak ada hasil dengan filter {activeFilter}.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10 max-h-[440px] overflow-y-auto">
                    {filteredResults.map((result) => {
                      const meta = probeStatusMeta[result.status] || probeStatusMeta.ERROR;
                      return (
                        <li
                          key={`${result.index}-${result.email}`}
                          className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 shrink-0 text-xs font-mono font-semibold text-zinc-500">
                              {result.index}.
                            </span>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "truncate font-mono text-xs sm:text-[0.84rem] font-medium select-all",
                                  result.status === "LIVE"
                                    ? "text-white font-semibold"
                                    : result.status === "AVAILABLE"
                                    ? "text-sky-200"
                                    : "text-zinc-400"
                                )}
                                title={result.email}
                              >
                                {result.email}
                              </p>
                              <p className="text-[0.68rem] text-zinc-400 truncate">
                                {result.message}
                                {result.elapsed_ms > 0 && (
                                  <span className="ml-1.5 font-mono text-zinc-500">
                                    · {result.elapsed_ms}ms
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-[104px] flex justify-end">
                              <StatusBadge
                                tone={meta.tone}
                                dot
                                className="w-full justify-center font-bold text-[0.66rem] tracking-wide"
                              >
                                {meta.label}
                              </StatusBadge>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopySingle(result.email, result.index)}
                              title="Salin email ini"
                              className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-zinc-400 hover:text-sky-300 hover:border-sky-500/40 transition-all cursor-pointer active:scale-90 shrink-0"
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
            <Reveal delay={80}>
              <EmptyState
                compact
                className="border-white/10 bg-[#11131c]/85"
                icon={<Inbox className="size-5 text-sky-400" aria-hidden="true" />}
                title="Belum ada hasil pemeriksaan"
                description="Masukkan daftar alamat @gmail.com di atas lalu klik tombol 'Mulai Live Checker'."
              />
            </Reveal>
          )}
        </div>
      </div>
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
  tone: "success" | "info" | "warning" | "danger";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClasses = {
    success: active
      ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-300 ring-2 ring-emerald-500/40"
      : "border-emerald-500/25 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50",
    info: active
      ? "border-sky-500/60 bg-sky-950/60 text-sky-200 ring-2 ring-sky-500/40"
      : "border-sky-500/25 bg-sky-950/30 text-sky-300 hover:bg-sky-500/50",
    warning: active
      ? "border-amber-500/60 bg-amber-950/60 text-amber-200 ring-2 ring-amber-500/40"
      : "border-amber-500/25 bg-amber-950/25 text-amber-300 hover:bg-amber-950/45",
    danger: active
      ? "border-rose-500/60 bg-rose-950/60 text-rose-300 ring-2 ring-rose-500/40"
      : "border-rose-500/25 bg-rose-950/30 text-rose-300 hover:bg-rose-950/50",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border py-3.5 px-3 text-center transition-all cursor-pointer select-none",
        toneClasses[tone]
      )}
    >
      <p className="text-xl sm:text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-[0.65rem] sm:text-[0.7rem] font-extrabold tracking-wider uppercase opacity-90 truncate">
        {label}
      </p>
    </button>
  );
}
