"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, Badge, ScreenHeader } from "@/components/ui";
import { WeeklyBarChart } from "@/components/charts";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useSettlementStore } from "@/lib/store/settlementStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { formatCurrency } from "@/lib/utils/format";

type Period = "this-month" | "last-month";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const THIS_MONTH = "2026-05";
const LAST_MONTH = "2026-04";

export default function EarningsPage() {
  const driver      = useCurrentDriver();
  const rides       = useRideStore((s) => s.rides);
  const settlements = useSettlementStore((s) => s.settlements);

  const [period, setPeriod] = useState<Period>("this-month");

  const driverId  = driver?.id ?? "d1";
  const monthKey  = period === "this-month" ? THIS_MONTH : LAST_MONTH;

  // Past settled months for this driver
  const pastSettlements = useMemo(
    () =>
      settlements
        .filter((s) => s.driverId === driverId && s.status === "settled")
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
        .slice(0, 3),
    [settlements, driverId]
  );

  // Current period settlement (find or compute from rides)
  const currentSettlement = useMemo(
    () => settlements.find((s) => s.driverId === driverId && s.periodStart.startsWith(monthKey)),
    [settlements, driverId, monthKey]
  );

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

  const totalRevenue = currentSettlement?.totalRevenue ??
    rides.filter((r) => r.driverId === driverId && r.rideTime.startsWith(monthKey)).reduce((s, r) => s + r.fareAmount, 0);

  const salary   = driver?.salaryAmount ?? 25000;
  const isPending = currentSettlement?.status !== "settled";

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="My Earnings" titleUrdu="میری کمائی" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

        {/* Period selector */}
        <div className="flex gap-1 bg-brand-surface rounded-xl p-1">
          {(["this-month", "last-month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                period === p ? "bg-accent-blue text-white" : "text-slate-400",
              ].join(" ")}
            >
              {p === "this-month" ? "This Month" : "Last Month"}
            </button>
          ))}
        </div>

        {/* Earnings breakdown */}
        <Card>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700/30">
            <span className="text-sm text-slate-300">Total Revenue Generated</span>
            <span className="text-sm text-white tabular-nums">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700/30">
            <span className="text-sm text-accent-blue">My Salary (Fixed)</span>
            <span className="text-xl font-bold text-accent-blue tabular-nums">{formatCurrency(salary)}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-slate-700/30">
            <span className="text-sm text-slate-300">Status</span>
            <Badge type={isPending ? "pending" : "settled"} />
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-slate-400">Settlement Date</span>
            <span className="text-sm text-slate-500">
              {currentSettlement?.settledAt
                ? new Date(currentSettlement.settledAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                : "Not yet settled"}
            </span>
          </div>
        </Card>

        {/* Weekly chart */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Weekly Revenue</p>
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
                const monthLabel = new Date(s.periodStart + "T00:00:00Z")
                  .toLocaleString("en-PK", { month: "long", year: "numeric" });
                const settledLabel = s.settledAt
                  ? new Date(s.settledAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })
                  : "";
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{monthLabel}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Settled {settledLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {formatCurrency(s.driverSalary)}
                      </span>
                      <CheckCircle2 size={16} className="text-accent-green shrink-0" />
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
