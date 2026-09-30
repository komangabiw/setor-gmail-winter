"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const emptySubscribe = () => () => {};

/** `true` only after hydration, so the portal never touches SSR. */
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Id of the element that labels the dialog, for `aria-labelledby`. */
  labelledBy: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Bottom sheet on mobile, centred dialog from `sm` up.
 *
 * Rendered through a portal so it escapes the `Reveal` transform context — a
 * transformed ancestor would otherwise re-base `position: fixed` and break the
 * overlay. Enter/exit are driven by CSS keyframes so the exit can finish before
 * the node is removed.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  className,
}: ModalProps) {
  const [exiting, setExiting] = React.useState(false);
  const [lastOpen, setLastOpen] = React.useState(open);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const mounted = useHydrated();

  // Sync to the `open` prop during render, then let the exit animation run
  // to completion before unmounting.
  if (open !== lastOpen) {
    setLastOpen(open);
    if (!open) setExiting(true);
    else setExiting(false);
  }

  const handleAnimationEnd = () => {
    if (exiting) setExiting(false);
  };

  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Escape to close, Tab trapping, scroll lock and focus restoration.
  React.useEffect(() => {
    if (!open) return;

    // Copied into a local so the cleanup does not read a stale ref.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !panel.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Only set focus to panel if focus is not already inside it
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!mounted || (!open && !exiting)) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        onMouseDown={onClose}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-ink-900/45 backdrop-blur-[3px]",
          exiting ? "animate-backdrop-out" : "animate-fade-in",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
        className={cn(
          "relative flex max-h-[88dvh] w-full flex-col overflow-hidden bg-white shadow-2xl outline-none",
          "rounded-t-3xl sm:max-w-lg sm:rounded-3xl",
          exiting ? "animate-modal-out" : "animate-modal-in",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Circular close button used in the modal header. */
export function ModalCloseButton({
  onClick,
  label = "Tutup",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-[background-color,color,transform] duration-300 hover:bg-white/20 hover:text-white active:scale-90"
    >
      <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}
