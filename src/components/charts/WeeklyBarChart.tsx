"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface DataPoint {
  day: string;
  revenue: number;
}

interface WeeklyBarChartProps {
  data: DataPoint[];
  height?: number;
  barColor?: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-elevated rounded-xl px-3 py-2 shadow-lg border border-slate-700/50">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function WeeklyBarChart({ data, height = 200, barColor = "#10B981" }: WeeklyBarChartProps) {
  if (!data.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <p className="text-slate-500 text-sm">No data</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="revenue" fill={barColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
