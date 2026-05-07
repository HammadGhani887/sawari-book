"use client";

import { ChangeEvent } from "react";

interface InputProps {
  label?: string;
  labelUrdu?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "tel" | "password" | "email" | "date";
  error?: string;
  prefix?: string;
  multiline?: boolean;
  maxLength?: number;
  disabled?: boolean;
  driverMode?: boolean;
}

export default function Input({
  label,
  labelUrdu,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  prefix,
  multiline = false,
  maxLength,
  disabled = false,
  driverMode = false,
}: InputProps) {
  const focusRing = driverMode
    ? "focus:ring-accent-blue focus:border-accent-blue"
    : "focus:ring-accent-green focus:border-accent-green";

  const baseInputClass = [
    "w-full bg-brand-surface text-white placeholder-slate-500",
    "border rounded-xl py-3 text-sm outline-none",
    "transition-all ring-0 focus:ring-2 ring-offset-0",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    error ? "border-status-red" : "border-slate-700",
    focusRing,
    prefix ? "pl-12 pr-4" : "px-4",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      {(label || labelUrdu) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label className="text-sm font-medium text-white">{label}</label>
          )}
          {labelUrdu && (
            <span className="text-xs text-slate-500 font-[system-ui]" dir="rtl">
              {labelUrdu}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {prefix && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-11 bg-brand-elevated rounded-l-xl border-r border-slate-700">
            <span className="text-slate-400 text-sm font-medium select-none">
              {prefix}
            </span>
          </div>
        )}

        {multiline ? (
          <textarea
            value={value}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              onChange(e.target.value)
            }
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            rows={3}
            className={`${baseInputClass} resize-none`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(e.target.value)
            }
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className={baseInputClass}
          />
        )}

        {maxLength && (
          <span className="absolute bottom-2 right-3 text-xs text-slate-600 select-none">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-status-red mt-0.5">{error}</p>
      )}
    </div>
  );
}
