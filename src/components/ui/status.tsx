import * as React from "react";
import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  info: "bg-sky-500/10 text-sky-400 border-sky-500/25",
  neutral: "bg-white/5 text-zinc-300 border-white/10",
};

const dotClasses: Record<Tone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  info: "bg-sky-400",
  neutral: "bg-zinc-400",
};

export function StatusBadge({
  tone = "neutral",
  children,
  icon,
  dot,
  pulse,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold tracking-wide whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5 shrink-0">
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-70",
                dotClasses[tone],
              )}
            />
          )}
          <span className={cn("relative inline-flex size-1.5 rounded-full", dotClasses[tone])} />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
}

export function StatBox({
  label,
  value,
  tone = "neutral",
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex flex-col items-center justify-center text-center gap-1.5 rounded-2xl border p-3.5 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md sm:p-4",
        toneClasses[tone],
        className,
      )}
    >
      <div className="flex items-center justify-center gap-1.5 text-center">
        <span className="text-[0.66rem] font-bold tracking-[0.08em] uppercase opacity-85">
          {label}
        </span>
        {icon && <span className="opacity-70">{icon}</span>}
      </div>
      <span className="text-xl leading-none font-black tracking-tight tabular-nums sm:text-2xl text-center">
        {value}
      </span>
    </div>
  );
}
