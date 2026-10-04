"use client";

import * as React from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, PageShell, PageHeader, Reveal } from "@/components/layout/page-shell";
import { cn, formatIDR } from "@/lib/utils";
import {
  getLeaderboard,
  leaderboardRanges,
  type LeaderboardEntry,
  type LeaderboardRange,
} from "@/lib/mock-data";

const RANGE_TABS = leaderboardRanges.map((range) => ({
  value: range.value,
  label: range.label,
}));

const PODIUM_ORDER = [1, 0, 2] as const;

const podiumStyles = {
  1: {
    card: "order-1 mt-0 items-stretch sm:-mt-6 bg-gradient-to-b from-amber-50 to-white border-amber-200 shadow-lg shadow-amber-500/10",
    avatar: "size-16 sm:size-20 ring-4 ring-amber-400 ring-offset-2 ring-offset-white",
    name: "text-[0.82rem] sm:text-[0.95rem]",
    revenue: "text-[0.95rem] sm:text-[1.15rem] text-amber-700",
  },
  2: {
    card: "order-0 mt-5 items-stretch bg-gradient-to-b from-slate-50 to-white border-slate-200",
    avatar: "size-13 sm:size-16 ring-4 ring-slate-300 ring-offset-2 ring-offset-white",
    name: "text-[0.76rem] sm:text-[0.85rem]",
    revenue: "text-[0.85rem] sm:text-base text-slate-700",
  },
  3: {
    card: "order-2 mt-5 items-stretch bg-gradient-to-b from-orange-50 to-white border-orange-200",
    avatar: "size-13 sm:size-16 ring-4 ring-orange-300 ring-offset-2 ring-offset-white",
    name: "text-[0.76rem] sm:text-[0.85rem]",
    revenue: "text-[0.85rem] sm:text-base text-orange-700",
  },
} as const;

export function LeaderboardView() {
  const [range, setRange] = React.useState<LeaderboardRange>("7d");

  const entries = React.useMemo(() => getLeaderboard(range), [range]);
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <PageShell>
      <PageHeader
        title="Leaderboard"
        subtitle="Peringkat penyedia Gmail terbaik"
        right={
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm">
            <Trophy className="size-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
        }
      />

      {/* Time filter */}
      <Reveal delay={40}>
        <Tabs
          items={RANGE_TABS}
          value={range}
          onValueChange={setRange}
          className="no-scrollbar overflow-x-auto"
        />
      </Reveal>

      {/* Podium */}
      {podium.length === 3 ? (
        <Reveal delay={80} className="mt-5">
          <section
            aria-label="Peringkat tiga teratas"
            className="grid grid-cols-3 items-end gap-2.5 md:gap-4"
          >
            {PODIUM_ORDER.map((index) => {
              const entry = podium[index];
              const style = podiumStyles[entry.rank as 1 | 2 | 3];

              return (
                <article
                  key={entry.rank}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-3xl border p-3 pt-5 text-center shadow-card transition-transform duration-300 ease-out hover:-translate-y-1 sm:p-4 sm:pt-6",
                    style.card,
                  )}
                >
                  <Avatar entry={entry} className={style.avatar} />

                  <p
                    className={cn(
                      "line-clamp-2 w-full font-bold text-ink-900 mt-1",
                      style.name,
                    )}
                    title={entry.name}
                  >
                    {entry.name}
                  </p>

                  <p
                    className={cn(
                      "w-full font-bold tracking-tight tabular-nums",
                      style.revenue,
                    )}
                  >
                    {formatIDR(entry.revenue)}
                  </p>

                  <p className="w-full text-[0.65rem] text-ink-500 sm:text-[0.7rem]">
                    <span className="font-semibold text-ink-700 tabular-nums">
                      {entry.gmailAccepted}
                    </span>{" "}
                    Gmail diterima
                  </p>
                </article>
              );
            })}
          </section>
        </Reveal>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={<Trophy className="size-6" aria-hidden="true" />}
            title="Belum ada peringkat"
            description="Peringkat akan muncul setelah ada Gmail yang diterima."
          />
        </div>
      )}

      {/* #4 downwards (Top 4 to 50) */}
      {rest.length > 0 && (
        <Reveal delay={120} className="mt-5">
          <Card>
            <CardContent className="space-y-2.5 md:p-6">
              <h2 className="sr-only">Peringkat Lainnya</h2>
              <ul className="space-y-2.5">
                {rest.map((entry) => (
                  <li
                    key={entry.rank}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 transition-[border-color,transform] duration-300 ease-out hover:border-sky-200 active:scale-[0.995]"
                  >
                    {/* Sebelah kiri: Hanya foto profil dan nama */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar entry={entry} className="size-11 ring-2 ring-white" />
                      <p
                        className="truncate text-[0.85rem] font-semibold text-ink-800"
                        title={entry.name}
                      >
                        {entry.name}
                      </p>
                    </div>

                    {/* Sebelah kanan: Total uang di atas, Gmail diterima di bawah menggantikan total pendapatan */}
                    <div className="shrink-0 text-right">
                      <p className="text-[0.88rem] font-bold text-ink-900 tabular-nums">
                        {formatIDR(entry.revenue)}
                      </p>
                      <p className="mt-0.5 text-[0.68rem] font-medium text-ink-500 tabular-nums">
                        {entry.gmailAccepted} Gmail diterima
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>
      )}
    </PageShell>
  );
}

function Avatar({
  entry,
  className,
}: {
  entry: LeaderboardEntry;
  className?: string;
}) {
  return (
    <span className={cn("relative shrink-0 rounded-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- mock avatars from pravatar */}
      <img
        src={entry.avatarUrl}
        alt={`Avatar ${entry.name}`}
        width={80}
        height={80}
        loading="lazy"
        className="size-full rounded-full bg-sky-100 object-cover"
      />
      <span className="absolute -right-1 -bottom-0.5 flex min-w-[1.25rem] h-5 px-1 items-center justify-center rounded-full bg-brand-600 font-mono text-[0.6rem] font-bold text-white ring-2 ring-white shadow-2xs">
        {entry.rank}
      </span>
    </span>
  );
}

