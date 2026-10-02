"use client";

import * as React from "react";
import {
  BadgeCheck,
  CircleDollarSign,
  Gift,
  Info,
  Link2,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatBox, StatusBadge } from "@/components/ui/status";
import { Tabs } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState, PageShell, PageHeader, Reveal } from "@/components/layout/page-shell";
import { formatIDR, formatDateTime } from "@/lib/utils";
import {
  mockBonusHistory,
  mockReferralHistory,
  referralMission,
  type BonusRecord,
  type ReferralRecord,
} from "@/lib/mock-data";

type ReferralTab = "referral" | "bonus";

const TABS: { value: ReferralTab; label: string; icon: React.ReactNode }[] = [
  { value: "referral", label: "Riwayat Referral", icon: <Users className="size-3.5" aria-hidden="true" /> },
  { value: "bonus", label: "Riwayat Bonus", icon: <Gift className="size-3.5" aria-hidden="true" /> },
];

export function ReferralView() {
  const [tab, setTab] = React.useState<ReferralTab>("referral");

  const mission = referralMission;
  const progress = Math.min(100, Math.round((mission.successful / mission.target) * 100));
  const remaining = Math.max(mission.target - mission.successful, 0);

  return (
    <PageShell>
      <PageHeader
        title="Misi Referral"
        subtitle="Undang teman dan dapatkan bonus"
        right={
          <StatusBadge tone="info" dot pulse>
            Aktif
          </StatusBadge>
        }
      />

      {/* Gradient mission banner + progress */}
      <Reveal delay={40}>
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
                <h2 className="mt-1 text-lg leading-snug font-bold tracking-tight text-white md:text-xl">
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
      </Reveal>

      {/* Compact stats */}
      <Reveal delay={80} className="mt-4">
        <div className="grid grid-cols-3 gap-2.5 md:gap-3.5">
          <StatBox
            label="Total Diundang"
            value={mission.invited}
            tone="info"
            icon={<UserPlus className="size-3.5" aria-hidden="true" />}
          />
          <StatBox
            label="Referral Berhasil"
            value={mission.successful}
            tone="success"
            icon={<BadgeCheck className="size-3.5" aria-hidden="true" />}
          />
          <StatBox
            label="Bonus Diterima"
            value={formatIDR(mission.bonusReceived)}
            tone="warning"
            icon={<CircleDollarSign className="size-3.5" aria-hidden="true" />}
          />
        </div>
      </Reveal>

      {/* Code & link */}
      <Reveal delay={120} className="mt-4">
        <Card>
          <CardContent className="space-y-3.5 md:p-6">
            <div className="flex items-start gap-2.5 rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5">
              <Info className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
              <p className="text-[0.73rem] leading-relaxed text-sky-900">
                {mission.requirement}
              </p>
            </div>

            <CopyField
              icon={<Ticket className="size-4" aria-hidden="true" />}
              label="Kode Referral"
              value={mission.code}
              mono
              copyLabel="Salin"
            />
            <CopyField
              icon={<Link2 className="size-4" aria-hidden="true" />}
              label="Link Undangan"
              value={mission.link}
              copyLabel="Salin"
            />
          </CardContent>
        </Card>
      </Reveal>

      {/* History tabs */}
      <Reveal delay={160} className="mt-4">
        <Card>
          <CardContent className="space-y-4 md:p-6">
            <Tabs items={TABS} value={tab} onValueChange={setTab} />

            {tab === "referral" ? (
              <ReferralList records={mockReferralHistory} />
            ) : (
              <BonusList records={mockBonusHistory} />
            )}
          </CardContent>
        </Card>
      </Reveal>
    </PageShell>
  );
}

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
