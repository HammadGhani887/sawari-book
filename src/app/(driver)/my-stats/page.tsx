"use client";

import { useMemo, useState } from "react";
import { Card, ScreenHeader } from "@/components/ui";
import { WeeklyBarChart } from "@/components/charts";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { formatCurrency } from "@/lib/utils/format";

type Period = "today" | "week" | "month" | "year" | "custom";

const PLATFORM_LABELS: Record<string, string> = {
  indrive: "inDrive", yango: "Yango", other: "Other", private: "Private",
};
const PLATFORM_COLORS: Record<string, string> = {
  indrive: "#2DB543", yango: "#FFC107", other: "#64748B", private: "#8B5CF6",
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getRange(period: Period, customStart: string, customEnd: string): { start: string; end: string } {
  const today = TODAY;
  const d = new Date(today + "T00:00:00.000Z");

  if (period === "today")  return { start: today, end: today };
  if (period === "week") {
    const s = new Date(d); s.setUTCDate(d.getUTCDate() - 6);
    return { start: s.toISOString().slice(0, 10), end: today };
  }
  if (period === "month")  return { start: today.slice(0, 7) + "-01", end: today };
  if (period === "year")   return { start: today.slice(0, 4) + "-01-01", end: today };
  return { start: customStart || today.slice(0, 7) + "-01", end: customEnd || today };
}

function KPIBlock({ label, urdu, value, sub, color = "text-slate-900" }: {
  label: string; urdu?: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-brand-elevated rounded-2xl p-4 flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      {urdu && <p className="text-[9px] text-slate-700 font-[system-ui]" dir="rtl">{urdu}</p>}
      <p className={`text-2xl font-bold tabular-nums leading-tight ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function MyStatsPage() {
  const driver        = useCurrentDriver();
  const rides         = useRideStore((s) => s.rides);
  const fuelLogs      = useFuelStore((s) => s.fuelLogs);
  const expenses      = useExpenseStore((s) => s.expenses);
  const estimateFuel  = useVehicleStore((s) => s.estimateFuelCost);
  const getEffective  = useVehicleStore((s) => s.getEffectiveAverage);

  const [period,      setPeriod]      = useState<Period>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd,   setCustomEnd]   = useState("");

  const driverId   = driver?.id  ?? "";
  const vehicleId  = driver?.vehicleId ?? "";
  const effectiveAvg = getEffective(vehicleId, fuelLogs);

  const { start, end } = getRange(period, customStart, customEnd);

  // Filter data to range
  const filteredRides = useMemo(
    () => rides.filter((r) => r.driverId === driverId && r.rideTime.slice(0, 10) >= start && r.rideTime.slice(0, 10) <= end),
    [rides, driverId, start, end]
  );
  const filteredFuel = useMemo(
    () => fuelLogs.filter((f) => f.vehicleId === vehicleId && f.date.slice(0, 10) >= start && f.date.slice(0, 10) <= end),
    [fuelLogs, vehicleId, start, end]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.loggedBy === driverId && e.date.slice(0, 10) >= start && e.date.slice(0, 10) <= end),
    [expenses, driverId, start, end]
  );

  // Core metrics
  const totalRevenue      = filteredRides.reduce((s, r) => s + r.fareAmount, 0);
  const actualFuelCost    = filteredFuel.reduce((s, f) => s + f.amountPkr, 0);
  const totalExpenses     = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalKm           = filteredRides.reduce((s, r) => s + (r.distanceKm ?? 0), 0);
  const totalLitres       = filteredFuel.reduce((s, f) => s + f.litres, 0);

  // Estimated fuel from rides that have distance
  const estimatedFuelCost = filteredRides
    .filter((r) => r.distanceKm)
    .reduce((s, r) => s + estimateFuel(vehicleId, r.distanceKm!, fuelLogs), 0);

  // Use saved estimatedFuelCost on ride if available, else calculate
  const rideEstFuel = filteredRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);

  const fuelCostDisplay = actualFuelCost > 0
    ? actualFuelCost
    : rideEstFuel > 0
    ? rideEstFuel
    : estimatedFuelCost;

  const netProfit = totalRevenue - fuelCostDisplay - totalExpenses;

  // Days in range
  const dayCount  = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
  const avgPerDay = totalRevenue / dayCount;

  // Best single day
  const byDay = filteredRides.reduce<Record<string, number>>((acc, r) => {
    const d = r.rideTime.slice(0, 10);
    acc[d] = (acc[d] ?? 0) + r.fareAmount;
    return acc;
  }, {});
  const bestDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const bestDayLabel = bestDayEntry
    ? `${new Date(bestDayEntry[0] + "T00:00:00Z").toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · ${formatCurrency(bestDayEntry[1])}`
    : "—";

  // Platform split
  const platformTotals = filteredRides.reduce<Record<string, { count: number; revenue: number }>>((acc, r) => {
    if (!acc[r.platform]) acc[r.platform] = { count: 0, revenue: 0 };
    acc[r.platform].count++;
    acc[r.platform].revenue += r.fareAmount;
    return acc;
  }, {});

  // Chart data
  const chartData = useMemo(() => {
    if (period === "today") {
      return [{ day: "Today", revenue: totalRevenue }];
    }
    if (period === "week" || period === "month" || period === "custom") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(end + "T00:00:00.000Z");
        d.setUTCDate(d.getUTCDate() - (6 - i));
        const ds = d.toISOString().slice(0, 10);
        const revenue = filteredRides
          .filter((r) => r.rideTime.startsWith(ds))
          .reduce((s, r) => s + r.fareAmount, 0);
        return { day: WEEK_DAYS[d.getUTCDay()], revenue };
      });
    }
    // year — last 7 months
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end + "T00:00:00.000Z");
      d.setUTCMonth(d.getUTCMonth() - (6 - i));
      const prefix = d.toISOString().slice(0, 7);
      const revenue = filteredRides
        .filter((r) => r.rideTime.startsWith(prefix))
        .reduce((s, r) => s + r.fareAmount, 0);
      return { day: d.toLocaleString("en-PK", { month: "short", timeZone: "UTC" }), revenue };
    });
  }, [filteredRides, period, end, totalRevenue]);

  const TABS: { key: Period; label: string; urdu: string }[] = [
    { key: "today",  label: "Today",  urdu: "آج"     },
    { key: "week",   label: "Week",   urdu: "ہفتہ"  },
    { key: "month",  label: "Month",  urdu: "مہینہ" },
    { key: "year",   label: "Year",   urdu: "سال"   },
    { key: "custom", label: "Custom", urdu: "خاص"   },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="My Stats" titleUrdu="میری رپورٹ" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">

        {/* Period tabs */}
        <div className="flex bg-brand-surface rounded-xl p-1 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={[
                "flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors leading-tight",
                period === tab.key
                  ? "bg-accent-blue text-white"
                  : "text-slate-600 active:text-slate-900",
              ].join(" ")}
            >
              <p>{tab.label}</p>
              <p className="text-[8px] font-[system-ui] opacity-60" dir="rtl">{tab.urdu}</p>
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {period === "custom" && (
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 mb-1">From</p>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                max={TODAY}
                className="w-full bg-brand-surface border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-blue"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 mb-1">To</p>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                max={TODAY}
                className="w-full bg-brand-surface border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-blue"
              />
            </div>
          </div>
        )}

        {/* Revenue chart */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Revenue Trend</p>
          <WeeklyBarChart data={chartData} height={160} barColor="#3B82F6" />
        </Card>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          <KPIBlock label="Total Revenue" urdu="کل آمدنی"   value={formatCurrency(totalRevenue)}  color="text-accent-green" />
          <KPIBlock label="Net Profit"    urdu="خالص فائدہ" value={formatCurrency(netProfit)}
            color={netProfit >= 0 ? "text-slate-900" : "text-status-red"} />
          <KPIBlock
            label="Fuel Cost"
            urdu="تیل خرچ"
            value={formatCurrency(fuelCostDisplay)}
            sub={actualFuelCost > 0 ? "actual fill-ups" : fuelCostDisplay > 0 ? "estimated" : ""}
            color="text-status-amber"
          />
          <KPIBlock label="Expenses" urdu="اخراجات" value={formatCurrency(totalExpenses)} color="text-status-red" />
        </div>

        {/* Rides + distance */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Rides Summary</p>
          <div className="grid grid-cols-2 gap-y-3">
            {[
              { label: "Total Rides",  value: String(filteredRides.length)                        },
              { label: "Avg / Day",    value: formatCurrency(avgPerDay)                           },
              { label: "Best Day",     value: bestDayLabel                                        },
              { label: "Total KM",     value: totalKm > 0 ? `${totalKm.toFixed(1)} km` : "—"     },
              { label: "Fuel Litres",  value: totalLitres > 0 ? `${totalLitres.toFixed(1)} L` : "—" },
              { label: "Fuel Average", value: effectiveAvg > 0 ? `${effectiveAvg} km/L` : "—"    },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Platform breakdown */}
        {Object.keys(platformTotals).length > 0 && (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Platform Breakdown</p>
            <div className="flex flex-col gap-3">
              {Object.entries(platformTotals)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([platform, data]) => {
                  const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[platform] ?? "#64748B" }} />
                          <span className="text-sm text-slate-900 font-medium">{PLATFORM_LABELS[platform] ?? platform}</span>
                          <span className="text-xs text-slate-500">{data.count} rides</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatCurrency(data.revenue)}</span>
                          <span className="text-xs text-slate-500 w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-brand-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: PLATFORM_COLORS[platform] ?? "#64748B" }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {filteredRides.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="text-5xl opacity-20">📊</span>
            <p className="text-slate-500 text-sm">No rides in this period</p>
            <p className="text-[11px] text-slate-600" dir="rtl">اس مدت میں کوئی سواری نہیں</p>
          </div>
        )}

        {/* Fuel note */}
        {fuelCostDisplay > 0 && actualFuelCost === 0 && (
          <p className="text-[11px] text-slate-400 text-center px-4">
            * Fuel cost is estimated. Add fuel fill-ups for exact figures.
          </p>
        )}

      </div>
    </div>
  );
}
