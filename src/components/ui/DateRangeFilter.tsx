"use client";

import { DateRangeType } from "@/lib/utils/date";

interface DateRangeFilterProps {
  selected: DateRangeType;
  onChange: (type: DateRangeType) => void;
  customRange?: { start: string; end: string };
  onCustomChange?: (range: { start: string; end: string }) => void;
  accentColor?: "green" | "blue" | "amber";
}

const RANGES: { id: DateRangeType; label: string; urdu: string }[] = [
  { id: "today",     label: "Today",     urdu: "آج" },
  { id: "yesterday", label: "Yesterday", urdu: "کل" },
  { id: "week",      label: "Week",      urdu: "ہفتہ" },
  { id: "month",     label: "Month",     urdu: "مہینہ" },
  { id: "year",      label: "Year",      urdu: "سال" },
];

export default function DateRangeFilter({ 
  selected, 
  onChange, 
  customRange,
  onCustomChange,
  accentColor = "green" 
}: DateRangeFilterProps) {
  const activeClass = 
    accentColor === "green" ? "bg-accent-green text-white shadow-sm" :
    accentColor === "blue" ? "bg-accent-blue text-white shadow-sm" :
    "bg-status-amber text-white shadow-sm";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        {RANGES.map((range) => (
          <button
            key={range.id}
            onClick={() => onChange(range.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
              selected === range.id
                ? `${activeClass} border-transparent`
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className="flex flex-col items-center">
              <span>{range.label}</span>
              <span className="text-[9px] opacity-70 font-[system-ui]" dir="rtl">{range.urdu}</span>
            </div>
          </button>
        ))}
        <button
          onClick={() => onChange("custom")}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
            selected === "custom"
              ? `${activeClass} border-transparent`
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex flex-col items-center">
            <span>Custom</span>
            <span className="text-[9px] opacity-70 font-[system-ui]" dir="rtl">انتخاب</span>
          </div>
        </button>
      </div>

      {selected === "custom" && onCustomChange && (
        <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">Start Date</label>
            <input
              type="date"
              value={customRange?.start || ""}
              onChange={(e) => onCustomChange({ ...customRange!, start: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 transition-colors shadow-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 px-1">End Date</label>
            <input
              type="date"
              value={customRange?.end || ""}
              onChange={(e) => onCustomChange({ ...customRange!, end: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 transition-colors shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
