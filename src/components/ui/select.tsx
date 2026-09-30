"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { FieldShell } from "./input";
import { cn } from "@/lib/utils";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  label?: string;
  hint?: React.ReactNode;
  error?: string;
  options: SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  containerClassName?: string;
}

/**
 * Native select styled to match the app fields. Native is deliberate: it keeps
 * the mobile wheel picker, keyboard support and screen-reader semantics for
 * free, which a custom listbox would have to re-implement.
 */
export function Select<T extends string>({
  className,
  containerClassName,
  label,
  hint,
  error,
  options,
  value,
  onValueChange,
  placeholder,
  id,
  required,
  ...props
}: SelectProps<T>) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;

  return (
    <FieldShell
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative">
        <select
          id={selectId}
          value={value}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          onChange={(event) => onValueChange(event.target.value as T)}
          className={cn(
            "w-full appearance-none rounded-2xl border border-slate-200/90 bg-slate-50/60 pr-11 pl-4 text-[0.95rem] text-ink-800 transition-[border-color,box-shadow,background-color] duration-300 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/80",
            "h-12 cursor-pointer disabled:opacity-60",
            error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100/80",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}
