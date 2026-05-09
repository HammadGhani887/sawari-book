"use client";

import { useMemo, useState } from "react";
import { ChevronDown, FileText, Share2 } from "lucide-react";
import { ScreenHeader, Card, Button } from "@/components/ui";
import { WeeklyBarChart, ExpensePieChart, PlatformSplitBar, ProfitLineChart } from "@/components/charts";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useSettlementStore } from "@/lib/store/settlementStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import { formatCurrency } from "@/lib/utils/format";
import { exportToPDF } from "@/lib/utils/pdfExport";

type DateRange = "today" | "week" | "month" | "custom";

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

const RANGE_TABS: { id: DateRange; label: string }[] = [
  { id: "today",  label: "Today"  },
  { id: "week",   label: "Week"   },
  { id: "month",  label: "Month"  },
  { id: "custom", label: "Custom" },
];

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

const PLATFORM_LABELS: Record<string, string> = {
  indrive: "inDrive", yango: "Yango", other: "Other", private: "Private",
};

export default function ReportsPage() {
  const rides       = useRideStore((s) => s.rides);
  const expenses    = useExpenseStore((s) => s.expenses);
  const fuelLogs    = useFuelStore((s) => s.fuelLogs);
  const settlements = useSettlementStore((s) => s.settlements);
  const vehicles    = useVehicleStore((s) => s.vehicles);
  const drivers     = useDriverStore((s) => s.drivers);

  const [vehicleId,   setVehicleId]   = useState("all");
  const [dateRange,   setDateRange]   = useState<DateRange>("month");
  const [customStart, setCustomStart] = useState(TODAY);
  const [customEnd,   setCustomEnd]   = useState(TODAY);

  // Compute effective date range
  const { rangeStart, rangeEnd, isSingleDay } = useMemo(() => {
    if (dateRange === "today")  return { rangeStart: TODAY,      rangeEnd: TODAY,      isSingleDay: true  };
    if (dateRange === "week")   return { rangeStart: WEEK_START, rangeEnd: TODAY,      isSingleDay: false };
    if (dateRange === "month")  return { rangeStart: THIS_MONTH + "-01", rangeEnd: TODAY, isSingleDay: false };
    // custom
    const start = customStart || TODAY;
    const end   = customEnd   || TODAY;
    return { rangeStart: start, rangeEnd: end, isSingleDay: start === end };
  }, [dateRange, customStart, customEnd]);

  // Filter rides
  const filteredRides = useMemo(() => {
    const base = vehicleId === "all" ? rides : rides.filter((r) => r.vehicleId === vehicleId);
    return base.filter((r) => {
      const d = r.rideTime.slice(0, 10);
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [rides, vehicleId, rangeStart, rangeEnd]);

  // Filter approved expenses
  const filteredExpenses = useMemo(() => {
    const base = vehicleId === "all" ? expenses : expenses.filter((e) => e.vehicleId === vehicleId);
    return base
      .filter((e) => e.status === "approved")
      .filter((e) => {
        const d = e.date.slice(0, 10);
        return d >= rangeStart && d <= rangeEnd;
      });
  }, [expenses, vehicleId, rangeStart, rangeEnd]);

  // Filter fuel logs
  const filteredFuel = useMemo(() => {
    const base = vehicleId === "all" ? fuelLogs : fuelLogs.filter((f) => f.vehicleId === vehicleId);
    return base.filter((f) => {
      const d = f.date.slice(0, 10);
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [fuelLogs, vehicleId, rangeStart, rangeEnd]);

  // KPIs
  const totalRevenue  = filteredRides.reduce((s, r) => s + r.fareAmount, 0);
  const totalFuelCost = filteredFuel.reduce((s, f) => s + f.amountPkr, 0) ||
                        filteredRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalBoost    = filteredRides.reduce((s, r) => s + (r.boostCost ?? 0), 0);
  const netProfit     = totalRevenue - totalFuelCost - totalExpenses - totalBoost;

  // Single day detail — rides list
  const singleDayRides = isSingleDay ? filteredRides.sort((a, b) => a.rideTime.localeCompare(b.rideTime)) : [];
  const singleDayFuel  = isSingleDay ? filteredFuel : [];
  const singleDayExp   = isSingleDay ? filteredExpenses : [];

  // Daily revenue chart
  const dailyRevenue = useMemo(() => {
    const byDay: Record<string, number> = {};
    filteredRides.forEach((r) => {
      const day = r.rideTime.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + r.fareAmount;
    });
    // Generate days in range
    const days: { day: string; revenue: number }[] = [];
    const start = new Date(rangeStart + "T00:00:00");
    const end   = new Date(rangeEnd   + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      days.push({ day: String(d.getDate()), revenue: byDay[key] ?? 0 });
    }
    return days.slice(-30); // max 30 days
  }, [filteredRides, rangeStart, rangeEnd]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const COLORS: Record<string, string> = {
      fuel: "#F59E0B", maintenance: "#3B82F6", oil_change: "#8B5CF6",
      tyre: "#10B981", wash: "#06B6D4", fine: "#EF4444",
      insurance: "#6366F1", token_tax: "#EC4899", boost: "#8B5CF6", other: "#64748B",
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
    return Object.entries(totals).map(([id, amount]) => ({
      platform:   PLATFORM_LABELS[id] ?? id,
      amount,
      color:      COLORS[id] ?? "#64748B",
      percentage: Math.round((amount / total) * 100),
    }));
  }, [filteredRides]);

  // Profit trend
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

  // Month comparison
  const thisMonthRides   = rides.filter((r) => (vehicleId === "all" || r.vehicleId === vehicleId) && r.rideTime.startsWith(THIS_MONTH));
  const lastMonthRides   = rides.filter((r) => (vehicleId === "all" || r.vehicleId === vehicleId) && r.rideTime.startsWith(LAST_MONTH));
  const thisMonthRevenue = thisMonthRides.reduce((s, r) => s + r.fareAmount, 0);
  const lastMonthRevenue = lastMonthRides.reduce((s, r) => s + r.fareAmount, 0);
  const thisMonthExp     = expenses.filter((e) => (vehicleId === "all" || e.vehicleId === vehicleId) && e.status === "approved" && e.date.startsWith(THIS_MONTH)).reduce((s, e) => s + e.amount, 0);
  const lastMonthExp     = expenses.filter((e) => (vehicleId === "all" || e.vehicleId === vehicleId) && e.status === "approved" && e.date.startsWith(LAST_MONTH)).reduce((s, e) => s + e.amount, 0);
  const thisMonthProfit  = thisMonthRevenue - thisMonthExp;
  const lastMonthProfit  = lastMonthRevenue - lastMonthExp;

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? "+100%" : "—";
    const p = Math.round(((curr - prev) / prev) * 100);
    return `${p > 0 ? "+" : ""}${p}%`;
  }

  const hasAnyData = rides.length > 0 || expenses.length > 0;

  const rangeLabel = dateRange === "today" ? "Today"
    : dateRange === "week"  ? "Last 7 Days"
    : dateRange === "month" ? NOW.toLocaleString("en-PK", { month: "long", year: "numeric" })
    : customStart === customEnd
    ? new Date(customStart + "T00:00:00").toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
    : `${customStart} → ${customEnd}`;

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Reports" titleUrdu="رپورٹس" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

        {/* Vehicle selector */}
        <div className="relative">
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-accent-green shadow-sm"
          >
            <option value="all">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.makeModel} · {v.plateNumber}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* Date range tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {RANGE_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setDateRange(id)}
              className={[
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
                dateRange === id
                  ? "bg-accent-green text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 shadow-sm",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date pickers */}
        {dateRange === "custom" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Select Date or Range</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">From</p>
                <input
                  type="date"
                  value={customStart}
                  max={TODAY}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    if (e.target.value > customEnd) setCustomEnd(e.target.value);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-accent-green"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">To</p>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={TODAY}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-accent-green"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              {customStart === customEnd ? "Single day selected" : `${customStart} to ${customEnd}`}
            </p>
          </div>
        )}

        {!hasAnyData ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📊</span>
            <p className="text-slate-700 font-semibold text-center">No data yet</p>
            <p className="text-sm text-slate-500 text-center">Reports will appear once rides and expenses are logged.</p>
          </div>
        ) : (
          <>
            {/* KPI summary for selected range */}
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">{rangeLabel}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Rides",    value: String(filteredRides.length),   color: "text-slate-900" },
                  { label: "Revenue",  value: formatCurrency(totalRevenue),   color: "text-accent-green" },
                  { label: "Fuel",     value: formatCurrency(totalFuelCost),  color: "text-status-amber" },
                  { label: "Net Profit", value: formatCurrency(netProfit),    color: netProfit >= 0 ? "text-accent-green" : "text-status-red" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Single day detail view */}
            {isSingleDay && singleDayRides.length > 0 && (
              <Card>
                <p className="text-sm font-semibold text-slate-900 mb-3">
                  Rides on {new Date(rangeStart + "T00:00:00").toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "short" })}
                </p>
                <div className="flex flex-col gap-2">
                  {singleDayRides.map((r) => {
                    const driver = drivers.find((d) => d.id === r.driverId);
                    const profit = (r.estimatedFuelCost !== undefined || r.boostCost !== undefined)
                      ? r.fareAmount - (r.estimatedFuelCost ?? 0) - (r.boostCost ?? 0)
                      : null;
                    return (
                      <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(r.rideTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}
                            {" · "}{PLATFORM_LABELS[r.platform] ?? r.platform}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[r.pickupArea, r.dropoffArea].filter(Boolean).join(" → ") || "—"}
                            {driver && ` · ${driver.name}`}
                            {r.distanceKm && ` · ${r.distanceKm}km`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(r.fareAmount)}</p>
                          {profit !== null && (
                            <p className={`text-xs font-semibold ${profit >= 0 ? "text-accent-green" : "text-status-red"}`}>
                              {formatCurrency(profit)} net
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Day totals */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-1">
                  {singleDayFuel.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Fuel logs</span>
                      <span className="text-status-amber font-semibold">{formatCurrency(singleDayFuel.reduce((s, f) => s + f.amountPkr, 0))}</span>
                    </div>
                  )}
                  {singleDayExp.length > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Expenses</span>
                      <span className="text-status-amber font-semibold">{formatCurrency(singleDayExp.reduce((s, e) => s + e.amount, 0))}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Charts — only for multi-day ranges */}
            {!isSingleDay && (
              <>
                <ChartCard title="Daily Revenue" titleUrdu="روزانہ آمدنی">
                  {dailyRevenue.some((d) => d.revenue > 0)
                    ? <WeeklyBarChart data={dailyRevenue} height={180} />
                    : <EmptyChart label="No rides in this period" />}
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
                {dateRange === "month" && (
                  <Card>
                    <p className="text-sm font-medium text-slate-700 mb-1">This Month vs Last Month</p>
                    {[
                      { label: "Revenue",  curr: thisMonthRevenue, prev: lastMonthRevenue, good: (c: number, p: number) => c >= p },
                      { label: "Expenses", curr: thisMonthExp,     prev: lastMonthExp,     good: (c: number, p: number) => c <= p },
                      { label: "Profit",   curr: thisMonthProfit,  prev: lastMonthProfit,  good: (c: number, p: number) => c >= p },
                    ].map(({ label, curr, prev, good }) => (
                      <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <p className="text-sm text-slate-600">{label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(curr)}</span>
                          {prev > 0 && (
                            <span className={`text-xs font-semibold ${good(curr, prev) ? "text-accent-green" : "text-status-red"}`}>
                              {pctChange(curr, prev)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </>
            )}

            {/* Export buttons */}
            <div className="space-y-3 pt-1">
              <Button variant="primary" fullWidth icon={<FileText size={16} />} onClick={() => {
                const vName = vehicleId === "all"
                  ? "All Vehicles"
                  : (() => { const v = vehicles.find((v) => v.id === vehicleId); return v ? `${v.makeModel} · ${v.plateNumber}` : ""; })();

                const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d.name]));

                exportToPDF({
                  title:       "Report",
                  period:      rangeLabel,
                  vehicleName: vName,
                  rows: [
                    { label: "Total Rides",    value: String(filteredRides.length) },
                    { label: "Total Revenue",  value: `Rs ${totalRevenue.toLocaleString()}`,  color: "green" },
                    { label: "Fuel Cost",      value: `Rs ${totalFuelCost.toLocaleString()}`, color: "amber" },
                    { label: "Expenses",       value: `Rs ${totalExpenses.toLocaleString()}`, color: "amber" },
                    ...(totalBoost > 0 ? [{ label: "Boost / Pop-up", value: `Rs ${totalBoost.toLocaleString()}`, color: "amber" as const }] : []),
                    { label: "Net Profit",     value: `Rs ${netProfit.toLocaleString()}`,     color: netProfit >= 0 ? "green" as const : "red" as const, bold: true },
                  ],
                  rides: filteredRides.map((r) => ({
                    time:      new Date(r.rideTime).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
                    platform:  PLATFORM_LABELS[r.platform] ?? r.platform,
                    route:     [r.pickupArea, r.dropoffArea].filter(Boolean).join(" → ") || "—",
                    fare:      r.fareAmount,
                    fuelCost:  r.estimatedFuelCost,
                    boostCost: r.boostCost,
                    netProfit: (r.estimatedFuelCost !== undefined || r.boostCost !== undefined)
                      ? r.fareAmount - (r.estimatedFuelCost ?? 0) - (r.boostCost ?? 0)
                      : undefined,
                    driver:    driverMap[r.driverId],
                    distance:  r.distanceKm,
                  })),
                  expenses: filteredExpenses.map((e) => ({
                    date:     new Date(e.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
                    category: EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category,
                    amount:   e.amount,
                    note:     e.note,
                    status:   e.status,
                  })),
                  fuelLogs: filteredFuel.map((f) => ({
                    date:   new Date(f.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
                    amount: f.amountPkr,
                    litres: f.litres,
                    pump:   f.pumpName,
                  })),
                });
              }}>
                Export PDF 📄
              </Button>
              <Button variant="outline" fullWidth icon={<Share2 size={16} />} onClick={() => {
                const vName = vehicleId === "all" ? "All Vehicles" : vehicles.find((v) => v.id === vehicleId)?.makeModel ?? "Vehicle";
                const msg = encodeURIComponent(
                  `📊 *Sawari Book Report*\n🚗 ${vName}\n📅 ${rangeLabel}\n\n` +
                  `💰 Revenue: Rs ${totalRevenue.toLocaleString()}\n` +
                  `⛽ Fuel: Rs ${totalFuelCost.toLocaleString()}\n` +
                  `🧾 Expenses: Rs ${totalExpenses.toLocaleString()}\n` +
                  `📈 Profit: Rs ${netProfit.toLocaleString()}\n` +
                  `🚗 Rides: ${filteredRides.length}\n\n_Sent from Sawari Book_`
                );
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}>
                Share via WhatsApp
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
