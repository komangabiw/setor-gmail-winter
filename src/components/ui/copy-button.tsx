"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard control that swaps to a check mark for a moment so the
 * user gets feedback without a toast covering the page.
 */
export function CopyButton({
  value,
  label = "Salin",
  copiedLabel = "Tersalin",
  className,
  onCopied,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context / denied permission).
      onCopied?.();
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `${copiedLabel}` : `${label}: ${value}`}
      className={cn(
        "group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[0.72rem] font-semibold transition-[background-color,color,transform] duration-300 active:scale-95",
        copied
          ? "bg-emerald-50 text-emerald-700"
          : "bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5" strokeWidth={2.6} aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}
