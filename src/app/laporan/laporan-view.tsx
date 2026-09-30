"use client";

import * as React from "react";
import { Clock, Inbox, MessageCircle, Paperclip, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type Tone } from "@/components/ui/status";
import { EmptyState, PageShell, PageHeader, Reveal } from "@/components/layout/page-shell";
import { CreateReportModal } from "./create-report-modal";
import { cn, formatDateTime } from "@/lib/utils";
import { mockReports, type ReportStatus, type ReportTicket } from "@/lib/mock-data";
import { getCurrentAuthUser, fetchUserTickets } from "@/lib/supabase";

const statusMeta: Record<ReportStatus, { label: string; tone: Tone }> = {
  baru: { label: "Baru", tone: "info" },
  diproses: { label: "Diproses", tone: "warning" },
  selesai: { label: "Selesai", tone: "success" },
};

export function LaporanView() {
  const [reports, setReports] = React.useState<ReportTicket[]>(mockReports);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentAuthUser();
        if (user) {
          const res = await fetchUserTickets(user.id);
          if (!res.isFallback && res.tickets.length > 0) {
            setReports(res.tickets);
            setSelectedId(res.tickets[0].id);
          }
        }
      } catch (err) {
        console.warn("Supabase fetch tickets error:", err);
      }
    })();
  }, []);

  const selected = reports.find((report) => report.id === selectedId) ?? null;

  const handleCreated = (ticket: ReportTicket) => {
    setReports((current) => [ticket, ...current]);
    setSelectedId(ticket.id);
  };

  return (
    <PageShell>
      {/* Header */}
      <PageHeader
        title="Laporan Saya"
        subtitle="Riwayat tiket dukungan"
        right={
          <button
            type="button"
            id="buat-laporan-btn"
            onClick={() => setModalOpen(true)}
            aria-haspopup="dialog"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-[0.84rem] font-semibold text-white shadow-lg shadow-sky-200/60 transition-all duration-300 hover:from-sky-400 hover:to-blue-500 hover:shadow-xl hover:shadow-sky-300/50 active:scale-[0.97]"
          >
            {/* Shimmer sweep on hover */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-700 group-hover:translate-x-full"
            />
            {/* Telegram icon */}
            <svg
              className="relative size-4 fill-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.94z"/>
            </svg>
            <span className="relative">Buat Laporan</span>
            <Send className="relative size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        }
      />

      {/* Two columns on desktop, stacked on mobile */}
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
        {/* Left: ticket list */}
        <Reveal delay={40} className="h-full">
          <Card className="flex h-full min-h-[400px] flex-col">
            <CardContent className="flex flex-1 flex-col gap-4 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[0.7rem] font-bold tracking-[0.14em] text-ink-400 uppercase">
                  Tiket Saya
                </h2>
                {reports.length > 0 && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[0.68rem] font-bold text-sky-700 tabular-nums">
                    {reports.length}
                  </span>
                )}
              </div>

              {reports.length === 0 ? (
                <EmptyState
                  compact
                  className="flex-1"
                  icon={<Inbox className="size-5" aria-hidden="true" />}
                  title="Belum ada laporan"
                  description="Laporan yang kamu kirim akan muncul di sini."
                />
              ) : (
                <ul className="space-y-2.5">
                  {reports.map((report) => {
                    const meta = statusMeta[report.status];
                    const isActive = report.id === selectedId;
                    return (
                      <li key={report.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(report.id)}
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "group w-full rounded-2xl border p-3.5 text-left transition-[border-color,background-color,transform] duration-300 ease-out active:scale-[0.99]",
                            isActive
                              ? "border-sky-300 bg-sky-50/80 shadow-sm"
                              : "border-slate-200/90 bg-white hover:border-sky-200 hover:bg-sky-50/40",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "line-clamp-1 text-[0.85rem] font-semibold",
                                isActive ? "text-sky-900" : "text-ink-800",
                              )}
                            >
                              {report.subject}
                            </p>
                            <StatusBadge tone={meta.tone} className="shrink-0">
                              {meta.label}
                            </StatusBadge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[0.73rem] leading-relaxed text-ink-500">
                            {report.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-[0.65rem] text-ink-400">
                            <span className="font-mono">{report.code}</span>
                            <span aria-hidden="true">·</span>
                            <span>{report.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatDateTime(report.createdAt)}</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </Reveal>

        {/* Right: ticket detail */}
        <Reveal delay={90} className="h-full">
          <Card className="flex h-full min-h-[400px] flex-col">
            <CardContent className="flex flex-1 flex-col md:p-6">
              {!selected ? (
                <EmptyState
                  compact
                  className="flex-1"
                  icon={<MessageCircle className="size-5" aria-hidden="true" />}
                  title="Pilih tiket di sebelah kiri atau buat laporan baru."
                  description="Detail laporan dan balasan admin akan tampil di sini."
                  action={
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3.5 py-1.5 text-[0.78rem] font-semibold text-sky-700 transition-colors hover:bg-sky-100 active:scale-95"
                    >
                      <Send className="size-3.5" />
                      Buat Laporan Baru
                    </button>
                  }
                />
              ) : (
                <TicketDetail ticket={selected} />
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <CreateReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreated}
      />
    </PageShell>
  );
}

function TicketDetail({ ticket }: { ticket: ReportTicket }) {
  const meta = statusMeta[ticket.status];

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[1.02rem] leading-snug font-bold tracking-tight text-ink-900">
            {ticket.subject}
          </h3>
          <StatusBadge tone={meta.tone} dot>
            {meta.label}
          </StatusBadge>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-ink-500">
          <span className="font-mono font-semibold text-ink-600">{ticket.code}</span>
          <span aria-hidden="true">·</span>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
            {ticket.category}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDateTime(ticket.createdAt)}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50/80 p-4">
        <p className="text-[0.68rem] font-bold tracking-[0.1em] text-ink-400 uppercase">
          Deskripsi Masalah
        </p>
        <p className="mt-1.5 text-[0.83rem] leading-relaxed whitespace-pre-wrap text-ink-700">
          {ticket.description}
        </p>
        {ticket.attachmentName && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Paperclip className="size-3.5 shrink-0 text-sky-500" aria-hidden="true" />
            <span className="truncate text-[0.73rem] font-medium text-ink-700">
              {ticket.attachmentName}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.1em] text-ink-400 uppercase">
          <MessageCircle className="size-3.5" aria-hidden="true" />
          Balasan
        </p>

        {ticket.replies.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-dashed border-slate-200 px-4 py-3.5">
            <Clock className="mt-0.5 size-4 shrink-0 text-ink-300" aria-hidden="true" />
            <p className="text-[0.76rem] leading-relaxed text-ink-500">
              Belum ada balasan. Admin biasanya merespons dalam 1x24 jam.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {ticket.replies.map((reply) => (
              <li
                key={reply.id}
                className={cn(
                  "rounded-2xl p-3.5",
                  reply.from === "admin"
                    ? "border border-sky-200 bg-sky-50/70"
                    : "border border-slate-200 bg-white",
                )}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[0.7rem] font-bold text-ink-700">
                    {reply.from === "admin" ? "Admin" : "Kamu"}
                  </span>
                  <span className="text-[0.65rem] text-ink-400">
                    {formatDateTime(reply.createdAt)}
                  </span>
                </div>
                <p className="text-[0.79rem] leading-relaxed whitespace-pre-wrap text-ink-700">
                  {reply.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
