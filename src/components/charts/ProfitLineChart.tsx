"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface DataPoint {
  week: string;
  profit: number;
}

interface ProfitLineChartProps {
  data: DataPoint[];
  height?: number;
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

export default function ProfitLineChart({ data, height = 200 }: ProfitLineChartProps) {
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
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 11 }}
            tickFormatter={(v: number) => `₨${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#334155", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#profitGradient)"
            dot={{ r: 4, fill: "#10B981", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#10B981", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
