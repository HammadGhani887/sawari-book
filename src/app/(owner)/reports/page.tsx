"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ArrowUpRight, ArrowDownRight, FileText, Share2 } from "lucide-react";
import { ScreenHeader, Card, DateRangeSelector, Button } from "@/components/ui";
import { WeeklyBarChart, ExpensePieChart, PlatformSplitBar, ProfitLineChart } from "@/components/charts";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useSettlementStore } from "@/lib/store/settlementStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import { formatCurrency } from "@/lib/utils/format";

type DateRange = "today" | "week" | "month" | "custom";

function ChartCard({ title, titleUrdu, children }: {
  title: string; titleUrdu: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <p className="text-[10px] text-slate-600 font-[system-ui]" dir="rtl">{titleUrdu}</p>
      </div>
      {children}
    </Card>
  );
}

function ComparisonRow({ label, value, pct, good, arrow }: {
  label: string; value: string; pct: string; good: boolean; arrow: "up" | "down";
}) {
  const colorClass = good ? "text-accent-green" : "text-status-red";
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
        <div className={`flex items-center gap-0.5 ${colorClass}`}>
          {arrow === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          <span className="text-xs font-semibold">{pct}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const rides       = useRideStore((s) => s.rides);
  const expenses    = useExpenseStore((s) => s.expenses);
  const settlements = useSettlementStore((s) => s.settlements);
  const vehicles    = useVehicleStore((s) => s.vehicles);

  const [vehicleId,  setVehicleId]  = useState("all");
  const [dateRange,  setDateRange]  = useState<DateRange>("month");

  // Filter rides/expenses by selected vehicle
  const filteredRides = useMemo(() => {
    const base = vehicleId === "all" ? rides : rides.filter((r) => r.vehicleId === vehicleId);
    return base;
  }, [rides, vehicleId]);

  const filteredExpenses = useMemo(() => {
    const base = vehicleId === "all" ? expenses : expenses.filter((e) => e.vehicleId === vehicleId);
    return base.filter((e) => e.status === "approved");
  }, [expenses, vehicleId]);

  // Daily revenue — group by day-of-month for current month
  const dailyRevenue = useMemo(() => {
    const byDay: Record<string, number> = {};
    filteredRides
      .filter((r) => r.rideTime.startsWith("2026-05"))
      .forEach((r) => {
        const day = r.rideTime.slice(8, 10).replace(/^0/, "");
        byDay[day] = (byDay[day] ?? 0) + r.fareAmount;
      });
    // Show days 1–15 with 0s for missing days
    return Array.from({ length: 15 }, (_, i) => {
      const day = String(i + 1);
      return { day, revenue: byDay[day] ?? 0 };
    });
  }, [filteredRides]);

  // Expense breakdown by category (approved)
  const expenseBreakdown = useMemo(() => {
    const COLORS: Record<string, string> = {
      fuel: "#F59E0B", maintenance: "#3B82F6", oil_change: "#8B5CF6",
      tyre: "#10B981", wash: "#06B6D4", fine: "#EF4444",
      insurance: "#6366F1", token_tax: "#EC4899", other: "#64748B",
    };
    const byCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    });
    return Object.entries(byCategory)
      .filter(([, v]) => v > 0)
      .map(([id, amount]) => ({
        name:   EXPENSE_CATEGORIES.find((c) => c.id === id)?.name ?? id,
        amount,
        color:  COLORS[id] ?? "#64748B",
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Platform split
  const platformSplit = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredRides.forEach((r) => {
      totals[r.platform] = (totals[r.platform] ?? 0) + r.fareAmount;
    });
    const total = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
    const COLORS: Record<string, string> = {
      indrive: "#2DB543", yango: "#FFC107", other: "#64748B", private: "#3B82F6",
    };
    const LABELS: Record<string, string> = {
      indrive: "inDrive", yango: "Yango", other: "Other", private: "Private",
    };
    return Object.entries(totals).map(([id, amount]) => ({
      platform:   LABELS[id] ?? id,
      amount,
      color:      COLORS[id] ?? "#64748B",
      percentage: Math.round((amount / total) * 100),
    }));
  }, [filteredRides]);

  // Profit trend — settled months
  const profitTrend = useMemo(() => {
    return settlements
      .filter((s) => s.status === "settled" && (vehicleId === "all" || s.vehicleId === vehicleId))
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
      .slice(-6)
      .map((s) => ({
        week:   new Date(s.periodStart + "T00:00:00Z").toLocaleString("en-PK", { month: "short" }),
        profit: s.ownerProfit,
      }));
  }, [settlements, vehicleId]);

  // Month-over-month comparison
  const thisMonthRevenue  = filteredRides.filter((r) => r.rideTime.startsWith("2026-05")).reduce((s, r) => s + r.fareAmount, 0);
  const thisMonthExpenses = filteredExpenses.filter((e) => e.date.startsWith("2026-05")).reduce((s, e) => s + e.amount, 0);
  const thisMonthProfit   = thisMonthRevenue - thisMonthExpenses;

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Reports" titleUrdu="رپورٹس" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">

        {/* Vehicle selector */}
        <div className="relative">
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full appearance-none bg-brand-surface border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent-green focus:border-accent-green"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.makeModel} · {v.plateNumber}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <DateRangeSelector selected={dateRange} onChange={setDateRange} />

        <ChartCard title="Daily Revenue" titleUrdu="روزانہ آمدنی">
          <WeeklyBarChart data={dailyRevenue} height={180} />
        </ChartCard>

        {expenseBreakdown.length > 0 && (
          <ChartCard title="Expense Breakdown" titleUrdu="اخراجات کی تفصیل">
            <ExpensePieChart data={expenseBreakdown} />
          </ChartCard>
        )}

        {platformSplit.length > 0 && (
          <ChartCard title="Platform Split" titleUrdu="پلیٹ فارم تقسیم">
            <PlatformSplitBar data={platformSplit} />
          </ChartCard>
        )}

        {profitTrend.length > 0 && (
          <ChartCard title="Profit Trend" titleUrdu="منافع">
            <ProfitLineChart data={profitTrend} height={180} />
          </ChartCard>
        )}

        {/* Month comparison */}
        <Card>
          <p className="text-sm font-medium text-slate-300 mb-1">This Month vs Last Month</p>
          <ComparisonRow label="Revenue"  value={formatCurrency(thisMonthRevenue)}  pct="12%" good arrow="up"   />
          <ComparisonRow label="Expenses" value={formatCurrency(thisMonthExpenses)} pct="5%"  good arrow="down" />
          <ComparisonRow label="Profit"   value={formatCurrency(thisMonthProfit)}   pct="18%" good arrow="up"   />
        </Card>

        <div className="space-y-3 pt-1">
          <Button variant="primary" fullWidth icon={<FileText size={16} />} onClick={() => toast("PDF export coming soon")}>
            Export PDF 📄
          </Button>
          <Button variant="outline" fullWidth icon={<Share2 size={16} />} onClick={() => toast("Coming soon")}>
            Share via WhatsApp
          </Button>
        </div>

      </div>
    </div>
  );
}
