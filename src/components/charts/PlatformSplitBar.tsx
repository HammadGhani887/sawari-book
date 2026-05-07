"use client";

import { formatCurrency } from "@/lib/utils/format";

interface DataPoint {
  platform: string;
  amount: number;
  color: string;
  percentage: number;
}

interface PlatformSplitBarProps {
  data: DataPoint[];
}

export default function PlatformSplitBar({ data }: PlatformSplitBarProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-slate-500 text-sm">No data</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Stacked bar */}
      <div className="h-7 w-full rounded-full overflow-hidden flex">
        {data.map((entry) => (
          <div
            key={entry.platform}
            style={{ width: `${entry.percentage}%`, backgroundColor: entry.color }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 space-y-2">
        {data.map((entry) => (
          <div key={entry.platform} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-400 text-sm">{entry.platform}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs">{entry.percentage.toFixed(1)}%</span>
              <span className="text-white text-sm font-medium tabular-nums">
                {formatCurrency(entry.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
