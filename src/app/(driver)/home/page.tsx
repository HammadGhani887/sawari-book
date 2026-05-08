"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { formatCurrency, getGreeting, formatDate } from "@/lib/utils/format";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";

function MiniKPI({ icon, value, label, colorClass = "text-slate-900", sub }: {
  icon: string; value: string; label: string; colorClass?: string; sub?: string;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl flex flex-col items-center gap-1 py-3 px-1">
      <span className="text-xl leading-none">{icon}</span>
      <span className={`text-base font-bold leading-none tabular-nums ${colorClass}`}>{value}</span>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
      {sub && <span className="text-[9px] text-slate-400 text-center leading-tight">{sub}</span>}
    </div>
  );
}

interface LogEntry {
  key: string;
  time: string;
  icon: string;
  description: string;
  sub: string;
  amount: string;
  profit: string | null;
  dotColor: string;
}

function TimelineEntry({ entry, isLast }: { entry: LogEntry; isLast: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <p className="w-[4.5rem] shrink-0 text-xs text-slate-500 pt-0.5 leading-tight">{entry.time}</p>
      <div className="flex flex-col items-center shrink-0 self-stretch">
        <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: entry.dotColor }} />
        {!isLast && <div className="w-px flex-1 mt-1.5 mb-0" style={{ backgroundColor: "rgba(71,85,105,0.4)" }} />}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-800 leading-snug">{entry.icon} {entry.description}</p>
          <div className="flex flex-col items-end shrink-0">
            <p className="text-sm font-semibold text-slate-900 tabular-nums leading-snug">{entry.amount}</p>
            {entry.profit !== null && (
              <p className={`text-xs font-bold tabular-nums leading-snug ${
                Number(entry.profit.replace(/[^0-9.-]/g, "")) >= 0 ? "text-accent-green" : "text-status-red"
              }`}>
                {entry.profit} net
              </p>
            )}
          </div>
        </div>
        {entry.sub && <p className="text-xs text-slate-500 mt-0.5">{entry.sub}</p>}
      </div>
    </div>
  );
}

// Daily target progress bar
function DailyTargetBar({ current, target }: { current: number; target: number }) {
  const pct     = Math.min(Math.round((current / target) * 100), 100);
  const done    = current >= target;
  const remaining = Math.max(target - current, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily Target</p>
          <p className="text-[10px] text-slate-400 mt-0.5" dir="rtl">روزانہ ہدف</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900 tabular-nums">
            {formatCurrency(current)}
            <span className="text-slate-400 font-normal"> / {formatCurrency(target)}</span>
          </p>
          <p className={`text-[11px] font-semibold mt-0.5 ${done ? "text-accent-green" : "text-slate-500"}`}>
            {done ? "🎯 Target achieved!" : `${formatCurrency(remaining)} remaining`}
          </p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? "bg-accent-green" : "bg-accent-blue"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-[10px] mt-1.5 text-right font-semibold ${done ? "text-accent-green" : "text-accent-blue"}`}>
        {pct}%
      </p>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  indrive: "inDrive", yango: "Yango", other: "Other", private: "Private",
};

export default function DriverHomePage() {
  const { user }  = useAuthStore();
  const driver    = useCurrentDriver();
  const vehicles  = useVehicleStore((s) => s.vehicles);
  const rides     = useRideStore((s) => s.rides);
  const fuelLogs  = useFuelStore((s) => s.fuelLogs);
  const expenses  = useExpenseStore((s) => s.expenses);

  const firstName    = user?.name?.split(" ")[0] ?? "Driver";
  const vehicle      = vehicles.find((v) => v.id === driver?.vehicleId);
  const vehicleLabel = vehicle ? `${vehicle.makeModel} · ${vehicle.plateNumber}` : "No vehicle assigned";
  const driverId     = driver?.id ?? "";
  const vehicleId    = driver?.vehicleId ?? "";
  const dailyTarget  = driver?.dailyTargetPkr ?? 0;

  const todayRides = useMemo(
    () => rides.filter((r) => r.driverId === driverId && r.rideTime.startsWith(TODAY)),
    [rides, driverId]
  );
  const todayFuel = useMemo(
    () => fuelLogs.filter((f) => f.vehicleId === vehicleId && f.date.startsWith(TODAY)),
    [fuelLogs, vehicleId]
  );
  const todayApprovedExpenses = useMemo(
    () => expenses.filter((e) => e.loggedBy === driverId && e.date.startsWith(TODAY) && e.status === "approved"),
    [expenses, driverId]
  );

  const todayRevenue  = todayRides.reduce((s, r) => s + r.fareAmount, 0);
  const todayFuelCost = todayFuel.reduce((s, f) => s + f.amountPkr, 0);
  const todayExpCost  = todayApprovedExpenses.reduce((s, e) => s + e.amount, 0);

  const estimatedFuelFromRides = todayRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
  const totalBoostCost         = todayRides.reduce((s, r) => s + (r.boostCost ?? 0), 0);
  const fuelDeduction  = todayFuelCost > 0 ? todayFuelCost : estimatedFuelFromRides;
  const todayNetProfit = todayRevenue - fuelDeduction - todayExpCost - totalBoostCost;
  const fuelSource     = todayFuelCost > 0 ? "actual" : estimatedFuelFromRides > 0 ? "est." : null;

  const logEntries = useMemo((): LogEntry[] => {
    const rideEntries: LogEntry[] = todayRides.map((r) => {
      const hasProfit = r.estimatedFuelCost !== undefined || r.boostCost !== undefined;
      const profit    = hasProfit ? r.fareAmount - (r.estimatedFuelCost ?? 0) - (r.boostCost ?? 0) : null;
      return {
        key:         r.id,
        time:        new Date(r.rideTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🚗",
        description: `${PLATFORM_LABELS[r.platform] ?? r.platform}${r.distanceKm ? ` · ${r.distanceKm}km` : ""}${r.boostCost ? ` · 🚀Rs${r.boostCost}` : ""}`,
        sub:         r.paymentType === "cash" ? "Cash" : "Wallet",
        amount:      formatCurrency(r.fareAmount),
        profit:      profit !== null ? formatCurrency(profit) : null,
        dotColor:    "#10B981",
      };
    });

    const fuelEntries: LogEntry[] = todayFuel.map((f) => ({
      key:         f.id,
      time:        new Date(f.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
      icon:        "⛽",
      description: `Fuel · ${f.pumpName ?? ""}`,
      sub:         `${f.litres}L`,
      amount:      `− ${formatCurrency(f.amountPkr)}`,
      profit:      null,
      dotColor:    "#F59E0B",
    }));

    const expenseEntries: LogEntry[] = expenses
      .filter((e) => e.loggedBy === driverId && e.date.startsWith(TODAY))
      .map((e) => ({
        key:         e.id,
        time:        new Date(e.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🧾",
        description: EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category,
        sub:         e.status === "pending" ? "Pending approval" : "Approved",
        amount:      `− ${formatCurrency(e.amount)}`,
        profit:      null,
        dotColor:    e.status === "pending" ? "#64748B" : "#F59E0B",
      }));

    return [...rideEntries, ...fuelEntries, ...expenseEntries]
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [todayRides, todayFuel, expenses, driverId]);

  return (
    <div className="px-4 pt-5 pb-4 flex flex-col gap-5">

      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{getGreeting()}, {firstName}</h1>
        <p className="text-sm text-slate-600 mt-0.5">{vehicleLabel}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatDate(new Date().toISOString())}</p>
      </div>

      {/* Daily target progress — only if target is set */}
      {dailyTarget > 0 && (
        <DailyTargetBar current={todayRevenue} target={dailyTarget} />
      )}

      {/* Add Ride CTA */}
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/add-ride"
          className="w-20 h-20 rounded-full bg-accent-blue flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
        >
          <Plus size={36} className="text-white" strokeWidth={2.5} />
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">Add Ride</p>
          <p className="text-xs text-slate-500" dir="rtl">سواری درج کریں</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <MiniKPI icon="🚗" value={String(todayRides.length)} label="Rides" />
        <MiniKPI icon="💰" value={formatCurrency(todayRevenue)} label="Revenue" colorClass="text-accent-blue" />
        <MiniKPI
          icon="⛽"
          value={formatCurrency(fuelDeduction)}
          label="Fuel Cost"
          colorClass="text-status-amber"
          sub={fuelSource === "est." ? "estimated" : fuelSource === "actual" ? "actual" : undefined}
        />
        <MiniKPI
          icon="📈"
          value={formatCurrency(todayNetProfit)}
          label="Net Profit"
          colorClass={todayNetProfit >= 0 ? "text-accent-green" : "text-status-red"}
          sub={fuelSource === "est." ? "fuel est." : undefined}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/add-fuel"    className="flex-1 py-3 rounded-xl text-center text-sm font-medium border border-status-amber text-status-amber active:opacity-70 transition-opacity">Add Fuel ⛽</Link>
        <Link href="/add-expense" className="flex-1 py-3 rounded-xl text-center text-sm font-medium border border-slate-300 text-slate-700 active:opacity-70 transition-opacity">Expense 🧾</Link>
      </div>

      {/* Today's Log */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-base font-bold text-slate-900">Today&apos;s Log</p>
          <p className="text-xs text-slate-500" dir="rtl">آج کا ریکارڈ</p>
        </div>

        {logEntries.length > 0 ? (
          <div className="bg-brand-surface rounded-2xl px-4 py-3">
            {logEntries.map((entry, i) => (
              <TimelineEntry key={entry.key} entry={entry} isLast={i === logEntries.length - 1} />
            ))}
          </div>
        ) : (
          <div className="bg-brand-surface rounded-2xl flex flex-col items-center gap-3 py-10 px-4">
            <span className="text-4xl">🚗</span>
            <p className="text-slate-600 text-sm text-center">No rides today. Start driving!</p>
            <Link href="/add-ride" className="px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold active:scale-95 transition-transform">
              Add First Ride
            </Link>
          </div>
        )}
      </div>

      {/* Daily summary */}
      {todayRides.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Today&apos;s Summary</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Revenue</span>
            <span className="font-semibold text-slate-900">{formatCurrency(todayRevenue)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-600">Fuel {fuelSource === "est." ? "(est.)" : ""}</span>
            <span className="font-semibold text-status-amber">− {formatCurrency(fuelDeduction)}</span>
          </div>
          {todayExpCost > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-600">Expenses</span>
              <span className="font-semibold text-status-amber">− {formatCurrency(todayExpCost)}</span>
            </div>
          )}
          {totalBoostCost > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-600">Boost / Pop-up 🚀</span>
              <span className="font-semibold text-status-red">− {formatCurrency(totalBoostCost)}</span>
            </div>
          )}
          <div className="h-px bg-slate-100 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Net Profit</span>
            <span className={`text-base font-bold ${todayNetProfit >= 0 ? "text-accent-green" : "text-status-red"}`}>
              {formatCurrency(todayNetProfit)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
