"use client";

import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "driver";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children?: ReactNode;
  title?: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const variantClasses: Record<Variant, string> = {
  primary:   "bg-accent-green text-white",
  driver:    "bg-accent-blue text-white",
  outline:   "border border-slate-600 text-white bg-transparent",
  danger:    "bg-status-red text-white",
  secondary: "bg-brand-surface text-white border border-slate-700/50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-5 py-3 text-sm gap-2",
  lg: "px-6 py-4 text-base gap-2",
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function Button({
  children,
  title,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  onClick,
  type = "button",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-semibold rounded-xl",
        "transition-all active:scale-[0.97] select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? <Spinner /> : icon ? <span className="flex-shrink-0">{icon}</span> : null}
      <span>{children ?? title}</span>
    </button>
  );
}
