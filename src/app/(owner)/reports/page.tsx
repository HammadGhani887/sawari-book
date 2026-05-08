"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, FileText, Share2 } from "lucide-react";
import { ScreenHeader, Card, DateRangeSelector, Button } from "@/components/ui";
import { WeeklyBarChart, ExpensePieChart, PlatformSplitBar, ProfitLineChart } from "@/components/charts";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useSettlementStore } from "@/lib/store/settlementStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useDailySnapshotStore } from "@/lib/store/dailySnapshotStore";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import { formatCurrency } from "@/lib/utils/format";
import { exportToPDF } from "@/lib/utils/pdfExport";

type DateRange = "today" | "week" | "month" | "custom";

// Real current month prefix e.g. "2026-05"
const NOW        = new Date();
const THIS_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;
const LAST_MONTH = (() => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();
const TODAY = NOW.toISOString().slice(0, 10);
const WEEK_START = (() => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
})();

function ChartCard({ title, titleUrdu, children }: {
  title: string; titleUrdu: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-[10px] text-slate-600 font-[system-ui]" dir="rtl">{titleUrdu}</p>
      </div>
      {children}
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <span className="text-3xl">📊</span>
      <p className="text-sm text-slate-500 text-center">{label}</p>
    </div>
  );
}

export default function ReportsPage() {
  const rides       = useRideStore((s) => s.rides);
  const expenses    = useExpenseStore((s) => s.expenses);
  const settlements = useSettlementStore((s) => s.settlements);
  const vehicles    = useVehicleStore((s) => s.vehicles);
  const snapshots   = useDailySnapshotStore((s) => s.getByVehicle);

  const [vehicleId, setVehicleId] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("month");

  const vehicleSnapshots = useMemo(() => {
    if (vehicleId === "all") return [];
    return snapshots(vehicleId).slice(0, 30);
  }, [snapshots, vehicleId]);

  // Filter rides by vehicle + date range
  const filteredRides = useMemo(() => {
    let base = vehicleId === "all" ? rides : rides.filter((r) => r.vehicleId === vehicleId);
    if (dateRange === "today") base = base.filter((r) => r.rideTime.startsWith(TODAY));
    else if (dateRange === "week") base = base.filter((r) => r.rideTime.slice(0, 10) >= WEEK_START);
    else if (dateRange === "month") base = base.filter((r) => r.rideTime.startsWith(THIS_MONTH));
    return base;
  }, [rides, vehicleId, dateRange]);

  // Filter approved expenses by vehicle + date range
  const filteredExpenses = useMemo(() => {
    let base = vehicleId === "all" ? expenses : expenses.filter((e) => e.vehicleId === vehicleId);
    base = base.filter((e) => e.status === "approved");
    if (dateRange === "today") base = base.filter((e) => e.date.startsWith(TODAY));
    else if (dateRange === "week") base = base.filter((e) => e.date.slice(0, 10) >= WEEK_START);
    else if (dateRange === "month") base = base.filter((e) => e.date.startsWith(THIS_MONTH));
    return base;
  }, [expenses, vehicleId, dateRange]);

  // Daily revenue — group by day for current month (up to today)
  const dailyRevenue = useMemo(() => {
    const daysInMonth = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0).getDate();
    const byDay: Record<string, number> = {};
    filteredRides
      .filter((r) => r.rideTime.startsWith(THIS_MONTH))
      .forEach((r) => {
        const day = r.rideTime.slice(8, 10).replace(/^0/, "");
        byDay[day] = (byDay[day] ?? 0) + r.fareAmount;
      });
    return Array.from({ length: Math.min(daysInMonth, NOW.getDate()) }, (_, i) => {
      const day = String(i + 1);
      return { day, revenue: byDay[day] ?? 0 };
    });
  }, [filteredRides]);

  // Expense breakdown by category
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
        name:  EXPENSE_CATEGORIES.find((c) => c.id === id)?.name ?? id,
        amount,
        color: COLORS[id] ?? "#64748B",
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

  // Profit trend — last 6 settled months
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

  // This month vs last month — real calculation
  const thisMonthRides    = rides.filter((r) => (vehicleId === "all" || r.vehicleId === vehicleId) && r.rideTime.startsWith(THIS_MONTH));
  const lastMonthRides    = rides.filter((r) => (vehicleId === "all" || r.vehicleId === vehicleId) && r.rideTime.startsWith(LAST_MONTH));
  const thisMonthRevenue  = thisMonthRides.reduce((s, r) => s + r.fareAmount, 0);
  const lastMonthRevenue  = lastMonthRides.reduce((s, r) => s + r.fareAmount, 0);

  const thisMonthExp      = expenses.filter((e) => (vehicleId === "all" || e.vehicleId === vehicleId) && e.status === "approved" && e.date.startsWith(THIS_MONTH)).reduce((s, e) => s + e.amount, 0);
  const lastMonthExp      = expenses.filter((e) => (vehicleId === "all" || e.vehicleId === vehicleId) && e.status === "approved" && e.date.startsWith(LAST_MONTH)).reduce((s, e) => s + e.amount, 0);

  const thisMonthProfit   = thisMonthRevenue - thisMonthExp;
  const lastMonthProfit   = lastMonthRevenue - lastMonthExp;

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? "+100%" : "—";
    const p = Math.round(((curr - prev) / prev) * 100);
    return `${p > 0 ? "+" : ""}${p}%`;
  }

  const hasAnyData = rides.length > 0 || expenses.length > 0;

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Reports" titleUrdu="رپورٹس" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">

        {/* Vehicle selector */}
        <div className="relative">
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-accent-green focus:border-accent-green shadow-sm"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.makeModel} · {v.plateNumber}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <DateRangeSelector selected={dateRange} onChange={setDateRange} />

        {!hasAnyData ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📊</span>
            <p className="text-slate-700 font-semibold text-center">No data yet</p>
            <p className="text-sm text-slate-500 text-center">Reports will appear once rides and expenses are logged.</p>
          </div>
        ) : (
          <>
            <ChartCard title="Daily Revenue" titleUrdu="روزانہ آمدنی">
              {dailyRevenue.some((d) => d.revenue > 0)
                ? <WeeklyBarChart data={dailyRevenue} height={180} />
                : <EmptyChart label="No rides this month yet" />}
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

            {/* Month comparison — real calculated values */}
            <Card>
              <p className="text-sm font-medium text-slate-700 mb-1">This Month vs Last Month</p>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <p className="text-sm text-slate-600">Revenue</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(thisMonthRevenue)}</span>
                  {lastMonthRevenue > 0 && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${thisMonthRevenue >= lastMonthRevenue ? "text-accent-green" : "text-status-red"}`}>
                      {pctChange(thisMonthRevenue, lastMonthRevenue)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <p className="text-sm text-slate-600">Expenses</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(thisMonthExp)}</span>
                  {lastMonthExp > 0 && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${thisMonthExp <= lastMonthExp ? "text-accent-green" : "text-status-red"}`}>
                      {pctChange(thisMonthExp, lastMonthExp)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <p className="text-sm text-slate-600">Profit</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(thisMonthProfit)}</span>
                  {lastMonthProfit !== 0 && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${thisMonthProfit >= lastMonthProfit ? "text-accent-green" : "text-status-red"}`}>
                      {pctChange(thisMonthProfit, lastMonthProfit)}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Daily snapshot history — only when a specific vehicle is selected */}
            {vehicleId !== "all" && vehicleSnapshots.length > 0 && (
              <Card>
                <p className="text-sm font-medium text-slate-700 mb-3">Daily History</p>
                <p className="text-[11px] text-slate-500 mb-3">Petrol price & average recorded each day</p>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-1 text-slate-500 font-medium">Date</th>
                        <th className="text-right py-2 px-1 text-slate-500 font-medium">Rides</th>
                        <th className="text-right py-2 px-1 text-slate-500 font-medium">Revenue</th>
                        <th className="text-right py-2 px-1 text-slate-500 font-medium">Fuel</th>
                        <th className="text-right py-2 px-1 text-slate-500 font-medium">Rs/L</th>
                        <th className="text-right py-2 px-1 text-slate-500 font-medium">km/L</th>
                        <th className="text-right py-2 px-1 text-slate-500 font-medium">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleSnapshots.map((snap) => (
                        <tr key={snap.id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 px-1 text-slate-700 font-medium">
                            {new Date(snap.date + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-2 px-1 text-right text-slate-700">{snap.totalRides}</td>
                          <td className="py-2 px-1 text-right text-accent-green font-semibold">{formatCurrency(snap.totalRevenue)}</td>
                          <td className="py-2 px-1 text-right text-status-amber">{formatCurrency(snap.totalFuelCost)}</td>
                          <td className="py-2 px-1 text-right text-slate-600">{snap.petrolPricePkrL}</td>
                          <td className="py-2 px-1 text-right text-slate-600">{snap.fuelAverageKmL}</td>
                          <td className={`py-2 px-1 text-right font-semibold ${snap.netProfit >= 0 ? "text-accent-green" : "text-status-red"}`}>
                            {formatCurrency(snap.netProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        <div className="space-y-3 pt-1">
          <Button variant="primary" fullWidth icon={<FileText size={16} />} onClick={() => {
            const vName = vehicleId === "all"
              ? "All Vehicles"
              : vehicles.find((v) => v.id === vehicleId)?.makeModel + " · " + vehicles.find((v) => v.id === vehicleId)?.plateNumber ?? "";
            exportToPDF({
              title:       "Monthly Report",
              period:      `${new Date().toLocaleString("en-PK", { month: "long", year: "numeric" })}`,
              vehicleName: vName,
              rows: [
                { label: "Total Revenue",  value: formatCurrency(thisMonthRevenue),  color: "green" },
                { label: "Total Expenses", value: formatCurrency(thisMonthExp),       color: "amber" },
                { label: "Net Profit",     value: formatCurrency(thisMonthProfit),    color: thisMonthProfit >= 0 ? "green" : "red", bold: true },
                { label: "Total Rides",    value: String(thisMonthRides.length) },
                { label: "Last Month Revenue", value: formatCurrency(lastMonthRevenue) },
                { label: "Last Month Profit",  value: formatCurrency(lastMonthProfit) },
              ],
            });
          }}>
            Export PDF 📄
          </Button>
          <Button variant="outline" fullWidth icon={<Share2 size={16} />} onClick={() => {
            const vName = vehicleId === "all" ? "All Vehicles" : vehicles.find((v) => v.id === vehicleId)?.makeModel ?? "Vehicle";
            const msg = encodeURIComponent(
              `📊 *Sawari Book Report*\n` +
              `🚗 ${vName}\n` +
              `📅 ${new Date().toLocaleString("en-PK", { month: "long", year: "numeric" })}\n\n` +
              `💰 Revenue: Rs ${thisMonthRevenue.toLocaleString()}\n` +
              `🧾 Expenses: Rs ${thisMonthExp.toLocaleString()}\n` +
              `📈 Profit: Rs ${thisMonthProfit.toLocaleString()}\n` +
              `🚗 Rides: ${thisMonthRides.length}\n\n` +
              `_Sent from Sawari Book_`
            );
            window.open(`https://wa.me/?text=${msg}`, "_blank");
          }}>
            Share via WhatsApp
          </Button>
        </div>

      </div>
    </div>
  );
}
