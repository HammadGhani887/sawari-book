"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Card, ScreenHeader } from "@/components/ui";
import { WeeklyBarChart } from "@/components/charts";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useSettlementStore } from "@/lib/store/settlementStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { formatCurrency } from "@/lib/utils/format";

type Period = "this-month" | "last-month";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const NOW        = new Date();
const THIS_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;
const LAST_MONTH = (() => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

export default function EarningsPage() {
  const driver      = useCurrentDriver();
  const rides       = useRideStore((s) => s.rides);
  const fuelLogs    = useFuelStore((s) => s.fuelLogs);
  const expenses    = useExpenseStore((s) => s.expenses);
  const settlements = useSettlementStore((s) => s.settlements);

  const [period, setPeriod] = useState<Period>("this-month");

  const driverId  = driver?.id  ?? "";
  const vehicleId = driver?.vehicleId ?? "";
  const monthKey  = period === "this-month" ? THIS_MONTH : LAST_MONTH;

  // Rides for selected month
  const monthRides = useMemo(
    () => rides.filter((r) => r.driverId === driverId && r.rideTime.startsWith(monthKey)),
    [rides, driverId, monthKey]
  );

  // Fuel cost for selected month
  const monthFuelLogs = fuelLogs.filter((f) => f.vehicleId === vehicleId && f.date.startsWith(monthKey));
  const actualFuelCost = monthFuelLogs.reduce((s, f) => s + f.amountPkr, 0);
  const estFuelFromRides = monthRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
  const fuelCost = actualFuelCost > 0 ? actualFuelCost : estFuelFromRides;

  // Approved expenses for month
  const monthExpenses = expenses.filter((e) => e.loggedBy === driverId && e.date.startsWith(monthKey) && e.status === "approved");
  const otherExpenses = monthExpenses.filter((e) => e.category !== "fuel").reduce((s, e) => s + e.amount, 0);

  // Settlement record for this month
  const settlement = useMemo(
    () => settlements.find((s) => s.driverId === driverId && s.periodStart.startsWith(monthKey)),
    [settlements, driverId, monthKey]
  );

  const totalRevenue = settlement?.totalRevenue ??
    monthRides.reduce((s, r) => s + r.fareAmount, 0);

  // Salary calculation
  const salary = driver?.salaryType === "fixed"
    ? driver.salaryAmount
    : driver?.salaryType === "percentage"
    ? Math.round(totalRevenue * (driver.salaryAmount / 100))
    : 0;

  const isPending  = !settlement || settlement.status !== "settled";
  const isSettled  = settlement?.status === "settled";

  // Weekly chart — 7 days ending today
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(TODAY + "T00:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const revenue = rides
        .filter((r) => r.driverId === driverId && r.rideTime.startsWith(dateStr))
        .reduce((s, r) => s + r.fareAmount, 0);
      return { day: WEEK_DAYS[d.getUTCDay()], revenue };
    });
  }, [rides, driverId]);

  // Past settled months
  const pastSettlements = useMemo(
    () => settlements
      .filter((s) => s.driverId === driverId && s.status === "settled")
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
      .slice(0, 6),
    [settlements, driverId]
  );

  const monthLabel = period === "this-month"
    ? NOW.toLocaleString("en-PK", { month: "long", year: "numeric" })
    : new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1).toLocaleString("en-PK", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="My Earnings" titleUrdu="میری کمائی" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

        {/* Period selector */}
        <div className="flex gap-1 bg-brand-surface rounded-xl p-1">
          {(["this-month", "last-month"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={["flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                period === p ? "bg-accent-blue text-white" : "text-slate-600"].join(" ")}>
              {p === "this-month" ? "This Month" : "Last Month"}
            </button>
          ))}
        </div>

        {/* Month label + status */}
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-900">{monthLabel}</p>
          <div className={["flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
            isSettled ? "bg-accent-greenDim text-accent-green" : "bg-status-amberDim text-status-amber"
          ].join(" ")}>
            {isSettled ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            {isSettled ? "Settled" : "Pending"}
          </div>
        </div>

        {/* Salary highlight card */}
        <div className="bg-accent-blue rounded-2xl p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">My Salary</p>
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(salary)}</p>
          <p className="text-xs opacity-70 mt-1">
            {driver?.salaryType === "fixed"
              ? "Fixed monthly salary"
              : driver?.salaryType === "percentage"
              ? `${driver.salaryAmount}% of Rs ${totalRevenue.toLocaleString()} revenue`
              : "Not set"}
          </p>
          {isSettled && settlement?.settledAt && (
            <p className="text-xs opacity-60 mt-1">
              Settled on {new Date(settlement.settledAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Earnings breakdown */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Breakdown</p>
          <div className="flex flex-col gap-0">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <span className="text-sm text-slate-600">Total Revenue Generated</span>
              <span className="text-sm font-semibold text-accent-green tabular-nums">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <span className="text-sm text-slate-600">Fuel Cost{actualFuelCost === 0 && estFuelFromRides > 0 ? " (est.)" : ""}</span>
              <span className="text-sm font-semibold text-status-amber tabular-nums">− {formatCurrency(fuelCost)}</span>
            </div>
            {otherExpenses > 0 && (
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-sm text-slate-600">Other Expenses</span>
                <span className="text-sm font-semibold text-status-amber tabular-nums">− {formatCurrency(otherExpenses)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <span className="text-sm text-slate-600">Rides</span>
              <span className="text-sm font-semibold text-slate-900">{monthRides.length}</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-accent-blue">
              <span className="text-sm font-bold text-slate-900">My Salary</span>
              <span className="text-xl font-bold text-accent-blue tabular-nums">{formatCurrency(salary)}</span>
            </div>
          </div>
        </Card>

        {/* Weekly chart */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">This Week&apos;s Revenue</p>
          <WeeklyBarChart data={weeklyData} height={160} barColor="#3B82F6" />
        </Card>

        {/* Past settlements */}
        {pastSettlements.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Past Settlements</p>
              <p className="text-[10px] text-slate-600" dir="rtl">پچھلے تصفیے</p>
            </div>
            <Card>
              {pastSettlements.map((s) => {
                const mLabel = new Date(s.periodStart + "T00:00:00Z")
                  .toLocaleString("en-PK", { month: "long", year: "numeric" });
                const sLabel = s.settledAt
                  ? new Date(s.settledAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
                  : "";
                return (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{mLabel}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Settled {sLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent-blue tabular-nums">{formatCurrency(s.driverSalary)}</p>
                        <p className="text-[10px] text-slate-400">salary</p>
                      </div>
                      <CheckCircle2 size={16} className="text-accent-green shrink-0" />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* Empty state */}
        {monthRides.length === 0 && (
          <div className="flex flex-col items-center py-10 gap-3">
            <span className="text-4xl opacity-20">💰</span>
            <p className="text-slate-500 text-sm">No rides this month yet</p>
          </div>
        )}

      </div>
    </div>
  );
}
