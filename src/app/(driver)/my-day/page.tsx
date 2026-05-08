"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, ScreenHeader } from "@/components/ui";
import { useRideStore } from "@/lib/store/rideStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { formatCurrency } from "@/lib/utils/format";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";

const PLATFORM_LABELS: Record<string, string> = {
  indrive: "inDrive", yango: "Yango", other: "Other", private: "Private",
};

interface DayEntry {
  key: string;
  sortKey: string;
  time: string;
  icon: string;
  description: string;
  sub: string;
  amount: string;
  dotColor: string;
  amountColor: string;
}

function TimelineEntry({ entry, isLast }: { entry: DayEntry; isLast: boolean }) {
  return (
    <div className="flex items-start">
      <div className="w-20 shrink-0 text-right pr-3 pt-0.5">
        <span className="text-xs text-slate-500 leading-tight">{entry.time}</span>
      </div>
      <div className="flex flex-col items-center shrink-0 self-stretch w-3">
        <div className="w-3 h-3 rounded-full shrink-0 mt-0.5 z-10" style={{ backgroundColor: entry.dotColor }} />
        {!isLast && <div className="w-px flex-1 mt-1 bg-slate-700/50" />}
      </div>
      <div className="flex-1 pl-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-800 leading-snug">{entry.icon} {entry.description}</p>
          <p className={`text-sm font-semibold tabular-nums shrink-0 leading-snug ${entry.amountColor}`}>
            {entry.amount}
          </p>
        </div>
        {entry.sub && <p className="text-xs text-slate-500 mt-0.5">{entry.sub}</p>}
      </div>
    </div>
  );
}

function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center bg-brand-elevated rounded-xl px-3 py-2.5 flex-1">
      <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
      <p className="text-base font-bold text-slate-900 mt-0.5 leading-tight tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function MyDayPage() {
  const driver   = useCurrentDriver();
  const rides    = useRideStore((s) => s.rides);
  const fuelLogs = useFuelStore((s) => s.fuelLogs);
  const expenses = useExpenseStore((s) => s.expenses);

  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const todayStr    = new Date().toISOString().slice(0, 10);
  const dateStr     = selectedDate.toISOString().slice(0, 10);
  const isToday     = dateStr === todayStr;
  const driverId    = driver?.id ?? "";
  const vehicleId   = driver?.vehicleId ?? "";

  function prevDay() {
    setSelectedDate((d) => { const p = new Date(d); p.setDate(p.getDate() - 1); return p; });
  }
  function nextDay() {
    if (isToday) return;
    setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }

  const dayRides    = useMemo(() => rides.filter((r)    => r.driverId === driverId   && r.rideTime.startsWith(dateStr)), [rides, driverId, dateStr]);
  const dayFuel     = useMemo(() => fuelLogs.filter((f) => f.vehicleId === vehicleId && f.date.startsWith(dateStr)),     [fuelLogs, vehicleId, dateStr]);
  const dayExpenses = useMemo(() => expenses.filter((e) => e.loggedBy === driverId   && e.date.startsWith(dateStr)),     [expenses, driverId, dateStr]);

  const dayEntries = useMemo((): DayEntry[] => {
    const rideEntries: DayEntry[] = dayRides.map((r) => {
      const platform = PLATFORM_LABELS[r.platform] ?? r.platform;
      const parts = [platform, r.dropoffArea, r.distanceKm ? `${r.distanceKm} km` : ""].filter(Boolean);
      return {
        key:         r.id,
        sortKey:     r.rideTime,
        time:        new Date(r.rideTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🚗",
        description: parts.join(" · "),
        sub:         r.paymentType === "cash" ? "Cash" : "Wallet",
        amount:      `+${formatCurrency(r.fareAmount)}`,
        dotColor:    "#10B981",
        amountColor: "text-accent-green",
      };
    });

    const fuelEntries: DayEntry[] = dayFuel.map((f) => ({
      key:         f.id,
      sortKey:     f.date,
      time:        new Date(f.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
      icon:        "⛽",
      description: `Fuel${f.pumpName ? ` · ${f.pumpName}` : ""} · ${f.litres}L`,
      sub:         f.odometer ? `Odometer: ${f.odometer.toLocaleString()} km` : "",
      amount:      `−${formatCurrency(f.amountPkr)}`,
      dotColor:    "#F59E0B",
      amountColor: "text-status-amber",
    }));

    const expenseEntries: DayEntry[] = dayExpenses.map((e) => ({
      key:         e.id,
      sortKey:     e.date,
      time:        new Date(e.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
      icon:        "🧾",
      description: EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category,
      sub:         e.status === "pending" ? "Pending approval" : e.status === "approved" ? "Approved" : "Rejected",
      amount:      `−${formatCurrency(e.amount)}`,
      dotColor:    e.status === "pending" ? "#64748B" : "#F59E0B",
      amountColor: e.status === "pending" ? "text-slate-600" : "text-status-amber",
    }));

    return [...rideEntries, ...fuelEntries, ...expenseEntries]
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [dayRides, dayFuel, dayExpenses]);

  // Totals
  const totalRevenue  = dayRides.reduce((s, r) => s + r.fareAmount, 0);
  // Fuel cost: actual fuel logs first, then fuel-category expenses, then estimated from rides
  const actualFuelLogs  = dayFuel.reduce((s, f) => s + f.amountPkr, 0);
  const fuelExpenses    = dayExpenses.filter((e) => e.category === "fuel").reduce((s, e) => s + e.amount, 0);
  const estFuelRides    = dayRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
  const totalFuelCost   = actualFuelLogs > 0 ? actualFuelLogs : fuelExpenses > 0 ? fuelExpenses : estFuelRides;
  const fuelLabel       = actualFuelLogs > 0 ? "actual" : fuelExpenses > 0 ? "expense" : estFuelRides > 0 ? "est." : null;
  const otherExpenses   = dayExpenses.filter((e) => e.category !== "fuel").reduce((s, e) => s + e.amount, 0);
  const totalExpenses   = dayExpenses.reduce((s, e) => s + e.amount, 0);
  const netEarnings     = totalRevenue - totalFuelCost - otherExpenses;

  // Distance & efficiency (only if rides have distanceKm)
  const totalKm      = dayRides.reduce((s, r) => s + (r.distanceKm ?? 0), 0);
  const totalLitres  = dayFuel.reduce((s, f) => s + f.litres, 0);
  const hasKmData    = totalKm > 0;
  const kmPerLitre   = hasKmData && totalLitres > 0 ? (totalKm / totalLitres).toFixed(1) : null;
  const costPerKm    = hasKmData && totalFuelCost > 0 ? Math.round(totalFuelCost / totalKm) : null;
  const revenuePerKm = hasKmData ? Math.round(totalRevenue / totalKm) : null;

  const formattedDate = selectedDate.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="My Day" titleUrdu="میرا دن" />

      {/* Date navigator */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/30 bg-brand-bg/80 backdrop-blur-sm sticky top-14 z-30">
        <button onClick={prevDay} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-surface text-slate-600 active:text-slate-900 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{formattedDate}</p>
          {isToday && <p className="text-[10px] text-accent-blue font-medium mt-0.5">Today</p>}
        </div>
        <button onClick={nextDay} disabled={isToday} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-surface text-slate-600 active:text-slate-900 disabled:opacity-30 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4 pb-36">

        {/* Summary pill */}
        <Card>
          <p className="text-sm leading-relaxed">
            <span className="text-slate-900 font-medium">{dayRides.length} ride{dayRides.length !== 1 ? "s" : ""}</span>
            <span className="text-slate-500"> · </span>
            <span className="text-accent-green font-medium">{formatCurrency(totalRevenue)} earned</span>
            {totalFuelCost > 0 && (
              <>
                <span className="text-slate-500"> · </span>
                <span className="text-status-amber font-medium">{formatCurrency(totalFuelCost)} fuel{fuelLabel ? ` (${fuelLabel})` : ""}</span>
              </>
            )}
            {otherExpenses > 0 && (
              <>
                <span className="text-slate-500"> · </span>
                <span className="text-status-red font-medium">{formatCurrency(otherExpenses)} expenses</span>
              </>
            )}
            {hasKmData && (
              <>
                <span className="text-slate-500"> · </span>
                <span className="text-slate-700 font-medium">{totalKm.toFixed(1)} km</span>
              </>
            )}
          </p>
        </Card>

        {/* Km / efficiency stats — only shown when distance data exists */}
        {hasKmData && (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Distance & Efficiency</p>
              <p className="text-[10px] text-slate-600 font-[system-ui]" dir="rtl">فاصلہ اور کارکردگی</p>
            </div>
            <div className="flex gap-2">
              <StatPill label="Total Distance" value={`${totalKm.toFixed(1)} km`} />
              {kmPerLitre && (
                <StatPill label="Fuel Average" value={`${kmPerLitre} km/L`} sub={`${totalLitres.toFixed(1)}L used`} />
              )}
              {costPerKm && (
                <StatPill label="Cost / km" value={`Rs ${costPerKm}`} sub="fuel cost" />
              )}
              {revenuePerKm && (
                <StatPill label="Revenue / km" value={`Rs ${revenuePerKm}`} />
              )}
            </div>

            {/* Profit context line */}
            {kmPerLitre && costPerKm && revenuePerKm && (
              <p className="text-[11px] text-slate-500 mt-2 px-1">
                Every km earns{" "}
                <span className="text-accent-green font-semibold">Rs {revenuePerKm}</span>
                {" "}and costs{" "}
                <span className="text-status-amber font-semibold">Rs {costPerKm}</span>
                {" "}in fuel —{" "}
                <span className="text-slate-900 font-semibold">Rs {revenuePerKm - costPerKm} net / km</span>
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Activity</p>
          {dayEntries.length > 0 ? (
            <div>
              {dayEntries.map((entry, i) => (
                <TimelineEntry key={entry.key} entry={entry} isLast={i === dayEntries.length - 1} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-3">
              <span className="text-4xl opacity-30">📭</span>
              <p className="text-slate-500 text-sm">No activity for this day</p>
              <p className="text-[11px] text-slate-600" dir="rtl">اس دن کوئی سرگرمی نہیں</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky net earnings bar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pointer-events-none">
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xl shadow-black/10 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Profit</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {formatCurrency(totalRevenue)} − {formatCurrency(totalFuelCost)} fuel{fuelLabel ? ` (${fuelLabel})` : ""}{otherExpenses > 0 ? ` − ${formatCurrency(otherExpenses)} exp` : ""}
              </p>
            </div>
            <p className={`text-xl font-bold tabular-nums ${netEarnings >= 0 ? "text-accent-green" : "text-status-red"}`}>
              {formatCurrency(netEarnings)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
