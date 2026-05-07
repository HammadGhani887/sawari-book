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

function MiniKPI({ icon, value, label, colorClass = "text-white" }: {
  icon: string; value: string; label: string; colorClass?: string;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl flex flex-col items-center gap-1.5 py-3 px-1">
      <span className="text-xl leading-none">{icon}</span>
      <span className={`text-lg font-bold leading-none tabular-nums ${colorClass}`}>{value}</span>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
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
          <p className="text-sm text-slate-200 leading-snug">{entry.icon} {entry.description}</p>
          <p className="text-sm font-semibold text-white tabular-nums shrink-0 leading-snug">{entry.amount}</p>
        </div>
        {entry.sub && <p className="text-xs text-slate-500 mt-0.5">{entry.sub}</p>}
      </div>
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

  const firstName = user?.name?.split(" ")[0] ?? "Driver";
  const vehicle   = vehicles.find((v) => v.id === driver?.vehicleId);
  const vehicleLabel = vehicle ? `${vehicle.makeModel} · ${vehicle.plateNumber}` : "No vehicle assigned";

  const todayRides = useMemo(
    () => rides.filter((r) => r.driverId === (driver?.id ?? "d1") && r.rideTime.startsWith(TODAY)),
    [rides, driver]
  );
  const todayFuel = useMemo(
    () => fuelLogs.filter((f) => f.vehicleId === (driver?.vehicleId ?? "v1") && f.date.startsWith(TODAY)),
    [fuelLogs, driver]
  );

  const todayRevenue  = todayRides.reduce((s, r) => s + r.fareAmount, 0);
  const todayFuelCost = todayFuel.reduce((s, f) => s + f.amountPkr, 0);

  // Build timeline: rides + fuel + expenses for today, newest first
  const logEntries = useMemo((): LogEntry[] => {
    const rideEntries: LogEntry[] = todayRides.map((r) => ({
      key:         r.id,
      time:        new Date(r.rideTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
      icon:        "🚗",
      description: PLATFORM_LABELS[r.platform] ?? r.platform,
      sub:         r.paymentType === "cash" ? "Cash" : "Wallet",
      amount:      formatCurrency(r.fareAmount),
      dotColor:    "#10B981",
    }));

    const fuelEntries: LogEntry[] = todayFuel.map((f) => ({
      key:         f.id,
      time:        new Date(f.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
      icon:        "⛽",
      description: `Fuel · ${f.pumpName ?? ""}`,
      sub:         "",
      amount:      formatCurrency(f.amountPkr),
      dotColor:    "#F59E0B",
    }));

    const expenseEntries: LogEntry[] = expenses
      .filter((e) => e.loggedBy === (driver?.id ?? "d1") && e.date.startsWith(TODAY))
      .map((e) => ({
        key:         e.id,
        time:        new Date(e.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🧾",
        description: EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category,
        sub:         e.status === "pending" ? "Pending" : "Approved",
        amount:      formatCurrency(e.amount),
        dotColor:    e.status === "pending" ? "#64748B" : "#F59E0B",
      }));

    return [...rideEntries, ...fuelEntries, ...expenseEntries]
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [todayRides, todayFuel, expenses, driver]);

  return (
    <div className="px-4 pt-5 pb-4 flex flex-col gap-5">

      <div>
        <h1 className="text-xl font-bold text-white leading-tight">{getGreeting()}, {firstName}</h1>
        <p className="text-sm text-slate-400 mt-0.5">{vehicleLabel}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatDate(new Date().toISOString())}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Link
          href="/add-ride"
          className="w-20 h-20 rounded-full bg-accent-blue flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
        >
          <Plus size={36} className="text-white" strokeWidth={2.5} />
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">Add Ride</p>
          <p className="text-xs text-slate-500" dir="rtl">سواری درج کریں</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniKPI icon="🚗" value={String(todayRides.length)} label="Rides"   />
        <MiniKPI icon="💰" value={formatCurrency(todayRevenue)}  label="Revenue" colorClass="text-accent-blue"  />
        <MiniKPI icon="⛽" value={formatCurrency(todayFuelCost)} label="Fuel"    colorClass="text-status-amber" />
      </div>

      <div className="flex gap-3">
        <Link href="/add-fuel"    className="flex-1 py-3 rounded-xl text-center text-sm font-medium border border-status-amber text-status-amber active:opacity-70 transition-opacity">Add Fuel ⛽</Link>
        <Link href="/add-expense" className="flex-1 py-3 rounded-xl text-center text-sm font-medium border border-slate-600    text-slate-300 active:opacity-70 transition-opacity">Expense 🧾</Link>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-base font-bold text-white">Today&apos;s Log</p>
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
            <p className="text-slate-400 text-sm text-center">No rides today. Start driving!</p>
            <Link href="/add-ride" className="px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold active:scale-95 transition-transform">
              Add First Ride
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
