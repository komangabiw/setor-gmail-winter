"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const baseField =
  "w-full rounded-2xl border border-slate-200/90 bg-slate-50/60 text-[0.95rem] text-ink-800 placeholder:text-ink-400 transition-[border-color,box-shadow,background-color] duration-300 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/80 disabled:opacity-60";

export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
  trailing,
}: {
  id: string;
  label?: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || trailing) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={id}
              className="text-[0.78rem] font-medium text-ink-700"
            >
              {label}
              {required && <span className="ml-0.5 text-rose-500">*</span>}
            </label>
          )}
          {trailing}
        </div>
      )}
      {children}
      {error ? (
        <p className="animate-fade-in text-[0.72rem] font-medium text-rose-600">{error}</p>
      ) : (
        hint && <p className="text-[0.72rem] text-ink-500">{hint}</p>
      )}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: React.ReactNode;
  error?: string;
  leftIcon?: React.ReactNode;
  trailingSlot?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      hint,
      error,
      leftIcon,
      trailingSlot,
      id,
      required,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <FieldShell
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={containerClassName}
      >
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400 transition-colors duration-300 peer-focus:text-sky-500">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={Boolean(error) || undefined}
            className={cn(
              baseField,
              "peer h-12",
              leftIcon ? "pl-11" : "pl-4",
              trailingSlot ? "pr-11" : "pr-4",
              error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100/80",
              className,
            )}
            {...props}
          />
          {trailingSlot && (
            <span className="absolute top-1/2 right-2 -translate-y-1/2">{trailingSlot}</span>
          )}
        </div>
      </FieldShell>
    );
  },
);
Input.displayName = "Input";

export type PasswordInputProps = Omit<InputProps, "type" | "trailingSlot">;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, containerClassName, id, label, hint, error, leftIcon, required, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = React.useState(false);

    return (
      <FieldShell
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={containerClassName}
      >
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400 transition-colors duration-300">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-invalid={Boolean(error) || undefined}
            className={cn(
              baseField,
              "peer h-12 pr-11",
              leftIcon ? "pl-11" : "pl-4",
              error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100/80",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-ink-400 transition-colors duration-200 hover:bg-slate-100 hover:text-ink-600"
          >
            {visible ? (
              <EyeOff className="size-[1.05rem]" aria-hidden="true" />
            ) : (
              <Eye className="size-[1.05rem]" aria-hidden="true" />
            )}
          </button>
        </div>
      </FieldShell>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, containerClassName, label, hint, error, id, required, ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;

    return (
      <FieldShell
        id={textareaId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            baseField,
            "min-h-40 resize-y px-4 py-3 leading-relaxed",
            error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100/80",
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);
Textarea.displayName = "Textarea";
