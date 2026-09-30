import * as React from "react";
import { cn } from "@/lib/utils";

/** Consistent page frame: centred responsive column, safe bottom padding for the nav. */
export function PageShell({
  children,
  className,
  withNavPadding = true,
}: {
  children: React.ReactNode;
  className?: string;
  withNavPadding?: boolean;
}) {
  return (
    <div className="min-h-dvh w-full">
      <div
        className={cn(
          "mx-auto w-full max-w-md px-4 sm:max-w-lg sm:px-6 md:max-w-4xl md:px-8 lg:max-w-5xl xl:px-10",
          withNavPadding ? "pb-safe-nav" : "pb-safe-auth",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Staggered entrance wrapper so sections cascade in on mount/navigation. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-fade-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 pt-6 pb-4 md:pt-8 md:pb-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-ink-900 md:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-[0.78rem] text-ink-500 md:text-[0.85rem]">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Tighter padding, smaller icon well and smaller type for inline panels. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 text-center",
        compact ? "gap-2.5 py-7" : "gap-3 py-12",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex items-center justify-center rounded-2xl bg-sky-100/80 text-sky-500",
            compact ? "size-10" : "size-14",
          )}
        >
          {icon}
        </span>
      )}
      <div className="space-y-1">
        <p className={cn("font-semibold text-ink-800", compact ? "text-[0.82rem]" : "text-sm")}>
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "mx-auto leading-relaxed text-ink-500",
              compact ? "max-w-[18rem] text-[0.74rem]" : "max-w-[16rem] text-[0.8rem]",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
