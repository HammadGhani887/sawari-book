"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface DataPoint {
  name: string;
  amount: number;
  color: string;
}

interface ExpensePieChartProps {
  data: DataPoint[];
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: DataPoint }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-elevated rounded-xl px-3 py-2 shadow-lg border border-slate-700/50">
      <p className="text-slate-400 text-xs mb-1">{payload[0].name}</p>
      <p className="text-white text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-slate-500 text-sm">No data</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="w-full overflow-hidden">
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-500">Total</span>
          <span className="text-lg font-bold text-white">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Custom legend */}
      <div className="mt-3 space-y-2">
        {data.map((entry) => {
          const pct = total > 0 ? ((entry.amount / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-400 text-sm">{entry.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-xs">{pct}%</span>
                <span className="text-white text-sm font-medium tabular-nums">
                  {formatCurrency(entry.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
