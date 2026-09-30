import * as React from "react";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "soft" | "danger";
type ButtonSize = "xs" | "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 active:scale-[0.995] disabled:opacity-60",
  secondary:
    "bg-white text-ink-800 border border-slate-200/90 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 active:scale-[0.995] disabled:opacity-60",
  ghost: "bg-transparent text-ink-700 hover:bg-sky-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30 active:scale-[0.995] disabled:opacity-60",
  soft: "bg-sky-50 text-sky-700 hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 active:scale-[0.995] disabled:opacity-60",
  danger: "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 active:scale-[0.995] disabled:opacity-60",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-2.5 text-xs rounded-full gap-1.5",
  sm: "h-9 px-3 text-sm rounded-full gap-1.5",
  md: "h-11 px-4 text-[0.98rem] font-medium rounded-full gap-2",
  lg: "h-12 px-5 text-base font-medium rounded-full gap-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "relative inline-flex items-center justify-center whitespace-nowrap transition-[transform,box-shadow,background-color,color,border-color] duration-300 ease-out select-none will-change-transform active:duration-150",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          isLoading && "cursor-wait",
          className,
        )}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle className="size-5 animate-spin opacity-90" aria-hidden="true" />
            <span className="sr-only">Loading...</span>
          </span>
        )}
        <span
          className={cn(
            "flex items-center justify-center gap-2",
            isLoading && "invisible",
          )}
        >
          {leftIcon}
          {children}
          {rightIcon}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
