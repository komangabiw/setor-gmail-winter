"use client";

import * as React from "react";
import {
  Search,
  X,
  CalendarDays,
  History as HistoryIcon,
  Mail,
  CircleCheck,
  Clock,
  CircleX,
  ScanSearch,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card, SectionHeading } from "@/components/ui/card";
import { StatusSummaryGrid, type StatusCardItem } from "@/components/ui/status-summary-cards";
import { Button } from "@/components/ui/button";
import { StatusBadge, StatBox } from "@/components/ui/status";
import { PageShell, PageHeader, Reveal, EmptyState } from "@/components/layout/page-shell";
import {
  timeRanges,
  type DepositRecord,
  type DepositStatus,
  type TimeRange,
} from "@/lib/mock-data";
import { cn, formatDateTime, formatIDR } from "@/lib/utils";
import { useUserProfile } from "@/context/user-profile-context";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

type StatusFilter = DepositStatus;

const statusFilters: {
  value: StatusFilter;
  label: string;
  icon?: React.ReactNode;
}[] = [
  { value: "semua", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "dicek", label: "Di Cek" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

const statusMeta: Record<
  Exclude<DepositStatus, "semua">,
  { label: string; tone: "success" | "warning" | "info" | "danger"; icon: React.ReactNode }
> = {
  diterima: {
    label: "DITERIMA",
    tone: "success",
    icon: <CircleCheck className="size-3" aria-hidden="true" />,
  },
  pending: {
    label: "PENDING",
    tone: "warning",
    icon: <Clock className="size-3" aria-hidden="true" />,
  },
  dicek: {
    label: "DI CEK",
    tone: "info",
    icon: <ScanSearch className="size-3" aria-hidden="true" />,
  },
  ditolak: {
    label: "DITOLAK",
    tone: "danger",
    icon: <CircleX className="size-3" aria-hidden="true" />,
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function withinRange(iso: string, range: TimeRange): boolean {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (range === "today") return diff < day;
  if (range === "7d") return diff < 7 * day;
  return diff < 30 * day;
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

function DepositRow({ record, index }: { record: DepositRecord; index: number }) {
  const meta = statusMeta[record.status];
  const isRejected = record.status === "ditolak";

  return (
    <div
      className="animate-fade-up group flex items-center gap-3 px-4 py-3.5 transition-colors duration-300 hover:bg-white/5 sm:gap-4 sm:px-5 md:px-6 md:py-4"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 md:size-11",
          record.status === "diterima" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
          record.status === "pending" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          record.status === "dicek" && "bg-sky-500/10 text-sky-400 border border-sky-500/20",
          record.status === "ditolak" && "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        )}
      >
        <Mail className="size-4.5" strokeWidth={2.1} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[0.82rem] font-semibold text-zinc-100">
          {record.gmail}
        </p>
        <p className="mt-0.5 truncate text-[0.7rem] text-zinc-400">
          {formatDateTime(record.createdAt)} · {record.category === "good" ? "Good" : "Bebas"}
        </p>
        {isRejected && record.note && (
          <p className="mt-1 truncate text-[0.7rem] font-medium text-rose-400">
            {record.note}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[0.85rem] font-bold tracking-tight text-white tabular-nums">
          {formatIDR(record.amount)}
        </span>
        <StatusBadge tone={meta.tone} icon={meta.icon} dot pulse={record.status === "pending"}>
          {meta.label}
        </StatusBadge>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function RiwayatView() {
  const { deposits, isDepositsLoading } = useUserProfile();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("semua");
  const [range, setRange] = React.useState<TimeRange>("today");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return deposits
      .filter((d) => (status === "semua" ? true : d.status === status))
      .filter((d) => withinRange(d.createdAt, range))
      .filter((d) => (q ? d.gmail.toLowerCase().includes(q) : true))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [deposits, query, status, range]);

  const counts = React.useMemo(() => {
    const base = { semua: 0, pending: 0, dicek: 0, diterima: 0, ditolak: 0 };
    for (const d of deposits) {
      if (withinRange(d.createdAt, range)) {
        base.semua += 1;
        base[d.status] += 1;
      }
    }
    return base;
  }, [deposits, range]);

  const riwayatStatusItems: StatusCardItem[] = React.useMemo(
    () => [
      {
        title: "Diterima",
        value: counts.diterima,
        bg: "bg-emerald-600",
        svgType: "blur2",
      },
      {
        title: "Pending",
        value: counts.pending,
        bg: "bg-amber-600",
        svgType: "blur4",
      },
      {
        title: "Di Cek",
        value: counts.dicek,
        bg: "bg-blue-600",
        svgType: "circles",
      },
      {
        title: "Ditolak",
        value: counts.ditolak,
        bg: "bg-rose-600",
        svgType: "blur3",
      },
    ],
    [counts],
  );

  const activeFilter = status !== "semua" || query.trim().length > 0;

  const resetFilters = () => {
    setQuery("");
    setStatus("semua");
  };

  return (
    <PageShell>
      <PageHeader
        title="Riwayat Setoran"
        subtitle={`${counts.semua} setoran dalam periode ini`}
        right={
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#121215]/80 border border-white/10 text-sky-400 shadow-card">
            <HistoryIcon className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
        }
      />

      {/* Search */}
      <Reveal delay={40}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-zinc-500 transition-colors duration-300 peer-focus:text-sky-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Gmail..."
            aria-label="Cari Gmail"
            className="h-12 w-full rounded-2xl border border-white/10 bg-[#121215]/80 pr-11 pl-11 text-[0.95rem] text-white shadow-card transition-[border-color,box-shadow] duration-300 outline-none placeholder:text-zinc-500 focus:border-sky-500/50 focus:ring-4 focus:ring-sky-500/10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Hapus pencarian"
              className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 transition-[background-color,color,transform] duration-300 hover:bg-white/10 hover:text-white active:scale-90"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </Reveal>

      {/* Status tabs */}
      <Reveal delay={80} className="mt-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {statusFilters.map((filter) => {
            const isActive = status === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                aria-pressed={isActive}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.78rem] font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-300 ease-out active:scale-95",
                  isActive
                    ? "border-sky-500/40 bg-gradient-to-r from-sky-500 to-brand-600 text-white shadow-md shadow-sky-500/20"
                    : "border-white/10 bg-[#121215]/80 text-zinc-300 shadow-sm hover:border-white/20 hover:text-white",
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold tabular-nums transition-colors duration-300",
                    isActive ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400",
                  )}
                >
                  {counts[filter.value]}
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Time range filter */}
      <Reveal delay={120} className="mt-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#121215]/80 p-1.5 shadow-card md:gap-3 md:p-2">
          <span className="flex shrink-0 items-center gap-1.5 pl-2 pr-1 text-[0.72rem] font-semibold text-zinc-400">
            <CalendarDays className="size-3.5" aria-hidden="true" />
          </span>
          {timeRanges.map((option) => {
            const isActive = range === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                aria-pressed={isActive}
                className={cn(
                  "flex-1 rounded-xl px-2 py-2 text-[0.76rem] font-semibold transition-[background-color,color,box-shadow] duration-300",
                  isActive
                    ? "bg-gradient-to-br from-sky-400 to-brand-600 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Ringkasan status */}
      <Reveal delay={160} className="mt-6">
        <SectionHeading
          title="Ringkasan Status"
          subtitle="Pantau aktivitas setoran kamu"
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        />
        <StatusSummaryGrid items={riwayatStatusItems} isLoading={isDepositsLoading} />
      </Reveal>

      {/* List */}
      <Reveal delay={200} className="mt-5">
        {isDepositsLoading ? (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5 md:px-6 md:py-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="divide-y divide-white/10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 md:px-6 md:py-4">
                  <Skeleton className="size-10 md:size-11 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : filtered.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5 md:px-6 md:py-4">
              <p className="text-[0.8rem] font-semibold text-white">Daftar Setoran</p>
              <span className="text-[0.72rem] text-zinc-400">
                {filtered.length} data · {range === "today" ? "Hari ini" : range === "7d" ? "7 Hari" : "30 Hari"}
              </span>
            </div>
            <div className="divide-y divide-white/10">
              {filtered.map((record, index) => (
                <DepositRow key={record.id} record={record} index={index} />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<Search className="size-6" aria-hidden="true" />}
            title="Tidak ada setoran"
            description={
              activeFilter
                ? "Coba ubah kata kunci atau filter yang dipilih."
                : "Belum ada setoran pada periode ini."
            }
            action={
              activeFilter ? (
                <Button variant="soft" size="sm" onClick={resetFilters}>
                  Reset filter
                </Button>
              ) : undefined
            }
          />
        )}
      </Reveal>

      {/* See all */}
      {filtered.length > 0 && (
        <Reveal delay={240} className="mt-4">
          <button
            type="button"
            onClick={() => setRange("30d")}
            className="flex w-full items-center justify-center gap-1 rounded-2xl py-2.5 text-[0.78rem] font-semibold text-sky-600 transition-colors duration-300 hover:bg-sky-50/70 hover:text-sky-700"
          >
            Muat lebih banyak
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
        </Reveal>
      )}
    </PageShell>
  );
}
