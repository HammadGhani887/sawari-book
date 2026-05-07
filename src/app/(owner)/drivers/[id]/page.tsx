"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Phone, User } from "lucide-react";
import { ScreenHeader, Card, DateRangeSelector, Badge } from "@/components/ui";
import { ProfitLineChart } from "@/components/charts";
import { formatCurrency } from "@/lib/utils/format";
import { useDriverStore } from "@/lib/store/driverStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useSettlementStore } from "@/lib/store/settlementStore";

type DateRange = "today" | "week" | "month" | "custom";

const WEEK_START = "2026-05-01";

interface ActivityEntry {
  time: string;
  icon: string;
  description: string;
  sub: string;
  amount: string;
  dotColor: string;
  amountColor: string;
}

function ActivityRow({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
  return (
    <div className="flex items-start">
      <div className="w-[4.5rem] shrink-0 text-right pr-3 pt-0.5">
        <span className="text-xs text-slate-500 leading-tight">{entry.time}</span>
      </div>
      <div className="flex flex-col items-center shrink-0 self-stretch w-3">
        <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: entry.dotColor }} />
        {!isLast && <div className="w-px flex-1 mt-1 bg-slate-700/50" />}
      </div>
      <div className="flex-1 pl-3 pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-200 leading-snug">{entry.icon} {entry.description}</p>
          <p className={`text-sm font-semibold tabular-nums shrink-0 leading-snug ${entry.amountColor}`}>
            {entry.amount}
          </p>
        </div>
        {entry.sub && <p className="text-xs text-slate-500 mt-0.5">{entry.sub}</p>}
      </div>
    </div>
  );
}

function DriverStat({ icon, value, label, colorClass = "text-white" }: {
  icon: string; value: string; label: string; colorClass?: string;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl flex flex-col items-center gap-2 py-4 px-2 text-center">
      <span className="text-2xl leading-none">{icon}</span>
      <span className={`text-xl font-bold tabular-nums leading-none ${colorClass}`}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">
        {label}
      </span>
    </div>
  );
}

export default function DriverDetailPage({ params }: { params: { id: string } }) {
  const driverId = params.id;

  const driver   = useDriverStore((s) => s.drivers.find((d) => d.id === driverId));
  const vehicles = useVehicleStore((s) => s.vehicles);
  const allRides = useRideStore((s) => s.rides);
  const expenses = useExpenseStore((s) => s.expenses);
  const settlements = useSettlementStore((s) => s.settlements);

  const [dateRange, setDateRange] = useState<DateRange>("month");

  const vehicle = vehicles.find((v) => v.id === driver?.vehicleId);

  const driverRides = useMemo(() => {
    const all = allRides.filter((r) => r.driverId === driverId);
    if (dateRange === "today") return all.filter((r) => r.rideTime.startsWith(TODAY));
    if (dateRange === "week")  return all.filter((r) => r.rideTime.slice(0, 10) >= WEEK_START);
    return all;
  }, [allRides, driverId, dateRange]);

  const pendingExpenses = useMemo(
    () => expenses.filter((e) => e.loggedBy === driverId && e.status === "pending"),
    [expenses, driverId]
  );

  // Recent activity: last 5 rides + today's expenses, sorted desc
  const recentActivity = useMemo((): ActivityEntry[] => {
    const rideEntries: ActivityEntry[] = allRides
      .filter((r) => r.driverId === driverId)
      .slice(0, 5)
      .map((r) => ({
        time:        new Date(r.rideTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🚗",
        description: `${r.platform === "indrive" ? "inDrive" : r.platform === "yango" ? "Yango" : "Other"} · ${r.dropoffArea ?? ""}`.trimEnd().replace(/ ·$/, ""),
        sub:         r.paymentType === "cash" ? "Cash" : "Wallet",
        amount:      `+${formatCurrency(r.fareAmount)}`,
        dotColor:    "#10B981",
        amountColor: "text-accent-green",
      }));

    const expenseEntries: ActivityEntry[] = expenses
      .filter((e) => e.loggedBy === driverId)
      .slice(0, 3)
      .map((e) => ({
        time:        new Date(e.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        e.category === "fuel" ? "⛽" : "🧾",
        description: e.note ?? e.category,
        sub:         e.status === "pending" ? "Pending" : e.status === "approved" ? "Approved" : "Rejected",
        amount:      `−${formatCurrency(e.amount)}`,
        dotColor:    e.status === "pending" ? "#64748B" : "#F59E0B",
        amountColor: "text-status-amber",
      }));

    return [...rideEntries, ...expenseEntries]
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 6);
  }, [allRides, expenses, driverId]);

  // Revenue trend: last 4 settled months
  const chartData = useMemo(() => {
    return settlements
      .filter((s) => s.driverId === driverId && s.status === "settled")
      .slice(-4)
      .map((s) => ({
        week: new Date(s.periodStart).toLocaleString("en-PK", { month: "short" }),
        profit: s.totalRevenue,
      }));
  }, [settlements, driverId]);

  const totalRides   = driverRides.length;
  const totalRevenue = driverRides.reduce((s, r) => s + r.fareAmount, 0);
  const avgDaily     = totalRevenue > 0 ? Math.round(totalRevenue / Math.max(driverRides.length / 6, 1)) : 0;

  const initials = driver?.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title={driver?.name ?? "Driver"}
        showBack
        rightAction={
          <div className="w-8 h-8 rounded-full bg-brand-elevated flex items-center justify-center">
            <User size={16} className="text-slate-400" />
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

        {pendingExpenses.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-status-amberDim border border-status-amber/20 rounded-xl px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none shrink-0">⚠️</span>
              <p className="text-sm text-status-amber font-medium">
                {pendingExpenses.length} expense{pendingExpenses.length > 1 ? "s" : ""} pending approval
              </p>
            </div>
            <Link
              href="/expenses"
              className="shrink-0 text-xs font-semibold text-status-amber border border-status-amber/40 rounded-lg px-3 py-1.5 active:opacity-70 transition-opacity"
            >
              Review
            </Link>
          </div>
        )}

        {/* Driver info card */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-elevated flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-slate-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold text-white">{driver?.name}</p>
                <Badge type={driver?.isActive ? "active" : "inactive"} />
              </div>
              {driver && (
                <a
                  href={`tel:+92${driver.phone.replace(/\D/g, "").slice(-10)}`}
                  className="flex items-center gap-1.5 mt-1 text-accent-green active:opacity-70 transition-opacity w-fit"
                >
                  <Phone size={12} />
                  <span className="text-xs font-medium">{driver.phone}</span>
                </a>
              )}
              <div className="mt-2 space-y-0.5">
                {driver?.cnic && (
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">CNIC: </span>{driver.cnic}
                  </p>
                )}
                {vehicle && (
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">Vehicle: </span>{vehicle.makeModel} · {vehicle.plateNumber}
                  </p>
                )}
                {driver && (
                  <p className="text-xs text-slate-400">
                    <span className="text-slate-500">Salary: </span>
                    <span className="text-accent-blue font-medium">
                      Fixed {formatCurrency(driver.salaryAmount)}/month
                    </span>
                  </p>
                )}
                {driver && (
                  <p className="text-xs text-slate-500 mt-1">Since {driver.startDate}</p>
                )}
              </div>
            </div>
          </div>
        </Card>

        <DateRangeSelector selected={dateRange} onChange={setDateRange} />

        <div className="grid grid-cols-2 gap-3">
          <DriverStat icon="🚗" value={String(totalRides)}          label="Rides"       />
          <DriverStat icon="💰" value={formatCurrency(totalRevenue)} label="Revenue"     colorClass="text-accent-green" />
          <DriverStat icon="📅" value="26/30"                        label="Days Active" colorClass="text-accent-blue"  />
          <DriverStat icon="📈" value={formatCurrency(avgDaily)}     label="Avg Daily"   colorClass="text-accent-green" />
        </div>

        {chartData.length > 0 && (
          <Card>
            <p className="text-sm font-medium text-slate-300 mb-3">Monthly Revenue Trend</p>
            <ProfitLineChart data={chartData} height={160} />
          </Card>
        )}

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-base font-bold text-white">Recent Activity</p>
            <p className="text-[10px] text-slate-600" dir="rtl">حالیہ سرگرمی</p>
          </div>
          <Card>
            {recentActivity.map((entry, i) => (
              <ActivityRow key={i} entry={entry} isLast={i === recentActivity.length - 1} />
            ))}
          </Card>
        </div>

      </div>
    </div>
  );
}
