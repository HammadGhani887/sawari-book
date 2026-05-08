"use client";

type DateRange = "today" | "week" | "month" | "custom";

interface DateRangeSelectorProps {
  selected: DateRange;
  onChange: (range: DateRange) => void;
}

const OPTIONS: { id: DateRange; label: string }[] = [
  { id: "today",  label: "Today"  },
  { id: "week",   label: "Week"   },
  { id: "month",  label: "Month"  },
  { id: "custom", label: "Custom" },
];

export default function DateRangeSelector({
  selected,
  onChange,
}: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {OPTIONS.map(({ id, label }) => {
        const isActive = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
              "transition-all active:scale-95",
              isActive
                ? "bg-accent-green text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 shadow-sm",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
