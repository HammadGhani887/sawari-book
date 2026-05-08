"use client";

import { Delete } from "lucide-react";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  compact?: boolean;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["00", "0", "⌫"],
] as const;

type Key = (typeof KEYS)[number][number];

export default function NumericKeypad({
  value,
  onChange,
  maxLength = 6,
  compact = false,
}: NumericKeypadProps) {
  function handleKey(key: Key) {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }

    // Prevent leading zeros
    const next = value === "0" ? key : value + key;

    if (next.length > maxLength) return;

    // Disallow "00" when field is empty
    if (next === "00") return;

    onChange(next);
  }

  const displayValue = value === "" ? "0" : value;

  return (
    <div className="w-full max-w-[360px] mx-auto flex flex-col gap-3">
      {/* Display area */}
      <div className={`bg-white border border-slate-200 shadow-sm rounded-2xl px-6 flex items-baseline justify-center gap-2 ${compact ? "py-3" : "py-5"}`}>
        <span className="text-2xl font-medium text-slate-500 select-none">₨</span>
        <span className="text-5xl font-bold text-slate-900 tabular-nums tracking-tight leading-none">
          {Number(displayValue).toLocaleString("en-PK")}
        </span>
      </div>

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((row, ri) =>
          row.map((key) => {
            const isBackspace = key === "⌫";

            return (
              <button
                key={`${ri}-${key}`}
                type="button"
                onClick={() => handleKey(key)}
                className={[
                  `${compact ? "h-12" : "h-14"} rounded-xl text-xl font-semibold text-slate-900`,
                  "bg-white border border-slate-200 shadow-sm",
                  "hover:bg-slate-50 active:bg-slate-200",
                  "transition-colors select-none",
                  "flex items-center justify-center",
                  isBackspace ? "text-slate-600" : "",
                ].join(" ")}
              >
                {isBackspace ? <Delete size={20} /> : key}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
