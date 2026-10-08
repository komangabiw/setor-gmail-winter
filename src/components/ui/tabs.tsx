"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
};

export type TabsProps<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  variant?: "pill" | "underline";
  indicatorClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

/** Segmented tab switcher with a smoothly sliding indicator. */
export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  className,
  variant = "pill",
  indicatorClassName,
  activeClassName,
  inactiveClassName,
}: TabsProps<T>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null);

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const sync = () => {
      const activeBtn = list.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`);
      if (!activeBtn) {
        setIndicator(null);
        return;
      }
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(list);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [value, items.length]);

  if (variant === "underline") {
    return (
      <div
        ref={listRef}
        role="tablist"
        className={cn(
          "no-scrollbar relative flex gap-1 overflow-x-auto border-b border-slate-200/80",
          className,
        )}
      >
        {items.map((item) => {
          const isActive = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              data-value={item.value}
              aria-selected={isActive}
              onClick={() => onValueChange(item.value)}
              className={cn(
                "relative shrink-0 px-3.5 pt-2 pb-3 text-[0.82rem] font-medium whitespace-nowrap transition-colors duration-300",
                isActive ? "text-brand-600" : "text-ink-500 hover:text-ink-700",
              )}
            >
              <span className="flex items-center gap-1.5">
                {item.icon}
                {item.label}
                {typeof item.count === "number" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold transition-colors duration-300",
                      isActive ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-ink-500",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-[2.5px] animate-fade-in rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        "relative flex gap-1 rounded-full bg-sky-100/70 p-1",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 bottom-1 rounded-full bg-white shadow-[0_2px_8px_-2px_rgb(14_165_233/0.35)] transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            indicatorClassName,
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={isActive}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative z-10 flex-1 rounded-full px-3 py-2 text-[0.85rem] font-semibold whitespace-nowrap transition-colors duration-300 cursor-pointer",
              isActive
                ? (activeClassName || "text-brand-700")
                : (inactiveClassName || "text-ink-500 hover:text-ink-700"),
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              {item.icon}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
