"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { formatCurrency, getGreeting } from "@/lib/utils/format";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { ScreenHeader, DateRangeFilter } from "@/components/ui";
import { getRangeInterval, isDateInRange, DateRangeType, getTodayString } from "@/lib/utils/date";
import { exportToPDF, exportToExcel, ExportData } from "@/lib/utils/export";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import api from "@/lib/services/api";

function MiniKPI({ icon, value, label, colorClass = "text-slate-900", sub }: {
  icon: string; value: string; label: string; colorClass?: string; sub?: string;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl flex flex-col items-center gap-1 py-3 px-1">
      <span className="text-xl leading-none">{icon}</span>
      <span className={`text-base font-bold leading-none tabular-nums truncate w-full text-center px-1 ${colorClass}`}>{value}</span>
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
  sortKey: string;
}

function TimelineEntry({ entry, isLast }: { entry: LogEntry; isLast: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <p className="w-[4.5rem] shrink-0 text-xs text-slate-500 pt-0.5 leading-tight">{entry.time}</p>
      <div className="flex flex-col items-center shrink-0 self-stretch">
        <div className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: entry.dotColor }} />
        {!isLast && <div className="w-px flex-1 mt-1.5 mb-0" style={{ backgroundColor: "rgba(71,85,105,0.4)" }} />}
      </div>
      <div className="flex-1 min-w-0 pb-4">
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
  const user = useAuthStore((s) => s.user);
  const driver    = useCurrentDriver();
  const vehicles  = useVehicleStore((s) => s.vehicles);
  const rides     = useRideStore((s) => s.rides);
  const fuelLogs  = useFuelStore((s) => s.fuelLogs);
  const expenses  = useExpenseStore((s) => s.expenses);

  const firstName    = user?.name?.split(" ")[0] ?? "Driver";
  const vehicle      = vehicles.find((v) => v.id === driver?.vehicleId);
  const vehicleLabel = vehicle ? `${vehicle.makeModel} · ${vehicle.plateNumber}` : "No vehicle assigned";
  const userId       = user?.id ?? "";
  const vehicleId    = driver?.vehicleId ?? "";
  const dailyTarget  = driver?.dailyTargetPkr ?? 0;

  const [rangeType, setRangeType] = useState<DateRangeType>("today");
  const [customRange, setCustomRange] = useState(() => {
    const today = getTodayString();
    return { start: today, end: today };
  });

  // Sync data on mount
  useEffect(() => {
    const sync = async () => {
      try {
        const [ridesRes, fuelRes, expRes] = await Promise.all([
          api.get("/rides"),
          api.get("/fuel"),
          api.get("/expenses")
        ]);
        if (ridesRes.data) useRideStore.setState({ rides: ridesRes.data });
        if (fuelRes.data)  useFuelStore.setState({ fuelLogs: fuelRes.data });
        if (expRes.data)   useExpenseStore.setState({ expenses: expRes.data });
      } catch (e) { 
        console.error("Sync failed:", e); 
      }
    };
    sync();
  }, []);

  const activeInterval = useMemo(() => getRangeInterval(rangeType, customRange), [rangeType, customRange]);

  const filteredRides = useMemo(
    () => rides.filter((r) => isDateInRange(r.rideTime, activeInterval)),
    [rides, activeInterval]
  );
  
  const filteredFuel = useMemo(
    () => fuelLogs.filter((f) => f.vehicleId === vehicleId && isDateInRange(f.date, activeInterval)),
    [fuelLogs, vehicleId, activeInterval]
  );
 
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isDateInRange(e.date, activeInterval)),
    [expenses, activeInterval]
  );

  const approvedExpenses = useMemo(
    () => filteredExpenses.filter((e) => e.status === "approved"),
    [filteredExpenses]
  );

  const handleExport = (format: "pdf" | "excel") => {
    const rangeLabel = rangeType === "custom" 
      ? `${customRange.start} to ${customRange.end}` 
      : rangeType.charAt(0).toUpperCase() + rangeType.slice(1);

    const exportData: ExportData = {
      title: "Driver Performance Report",
      subtitle: `Driver: ${user?.name} | Period: ${rangeLabel}`,
      filename: `Swaari_Driver_Report_${rangeType}`,
      headers: ["Date", "Description", "Type", "Amount (PKR)", "Net (PKR)"],
      rows: logEntries.map(entry => [
        entry.time,
        entry.description,
        entry.icon === "🚗" ? "Ride" : entry.icon === "⛽" ? "Fuel" : "Expense",
        entry.amount,
        entry.profit || "—"
      ])
    };

    if (format === "pdf") exportToPDF(exportData);
    else exportToExcel(exportData);
  };

  const todayRevenue  = filteredRides.reduce((s, r) => s + (Number(r.fareAmount) || 0), 0);
  const todayFuelCost = filteredFuel.reduce((s, f) => s + (Number(f.amountPkr) || 0), 0);
  const todayExpCost  = approvedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
 
  const estimatedFuelFromRides = filteredRides.reduce((s, r) => s + (Number(r.estimatedFuelCost) || 0), 0);
  const totalBoostCost         = filteredRides.reduce((s, r) => s + (Number(r.boostCost) || 0), 0);
  const fuelDeduction  = todayFuelCost > 0 ? todayFuelCost : estimatedFuelFromRides;
  const todayNetProfit = todayRevenue - fuelDeduction - todayExpCost - totalBoostCost;
  const fuelSource     = todayFuelCost > 0 ? "actual" : estimatedFuelFromRides > 0 ? "est." : null;

  const logEntries = useMemo((): LogEntry[] => {
    const rideEntries: LogEntry[] = filteredRides.map((r) => {
      const hasProfit = r.estimatedFuelCost !== undefined || r.boostCost !== undefined;
      const profit    = hasProfit ? r.fareAmount - (r.estimatedFuelCost ?? 0) - (r.boostCost ?? 0) : null;
      return {
        key:         r.id,
        sortKey:     r.rideTime,
        time:        new Date(r.rideTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🚗",
        description: `${PLATFORM_LABELS[r.platform] ?? r.platform}${r.distanceKm ? ` · ${r.distanceKm}km` : ""}${r.boostCost ? ` · 🚀Rs${r.boostCost}` : ""}`,
        sub:         r.paymentType === "cash" ? "Cash" : "Wallet",
        amount:      formatCurrency(r.fareAmount),
        profit:      profit !== null ? formatCurrency(profit) : null,
        dotColor:    "#10B981",
      };
    });

    const fuelEntries: LogEntry[] = filteredFuel.map((f) => {
      const isByOwner = f.driverId !== userId;
      return {
        key:         f.id,
        sortKey:     f.date,
        time:        new Date(f.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "⛽",
        description: `Fuel · ${f.pumpName ?? ""}${isByOwner ? " (Owner)" : ""}`,
        sub:         `${f.litres}L${isByOwner ? " · Added by Owner" : ""}`,
        amount:      `− ${formatCurrency(f.amountPkr)}`,
        profit:      null,
        dotColor:    isByOwner ? "#2563EB" : "#F59E0B",
      };
    });

    const expenseEntries: LogEntry[] = filteredExpenses.map((e) => {
      const isByOwner = e.loggedBy !== userId;
      return {
        key:         e.id,
        sortKey:     e.date,
        time:        new Date(e.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🧾",
        description: (EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category) + (isByOwner ? " (Owner)" : ""),
        sub:         `${e.status === "pending" ? "Pending" : "Approved"}${isByOwner ? " · Added by Owner" : ""}`,
        amount:      `− ${formatCurrency(e.amount)}`,
        profit:      null,
        dotColor:    isByOwner ? "#2563EB" : (e.status === "pending" ? "#64748B" : "#F59E0B"),
      };
    });

    return [...rideEntries, ...fuelEntries, ...expenseEntries]
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [filteredRides, filteredFuel, filteredExpenses, userId]);

  return (
    <div className="px-4 pt-4 pb-4 flex flex-col gap-5 w-full overflow-x-hidden">
      <ScreenHeader
        title={`${getGreeting()}, ${firstName}`}
        titleUrdu={vehicleLabel}
        showNotifications
        showRefresh={true}
      />

      <DateRangeFilter
        selected={rangeType}
        onChange={setRangeType}
        customRange={customRange}
        onCustomChange={setCustomRange}
        accentColor="blue"
      />

      {/* ── Export Section ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reports</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">Export logs for this period</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport("pdf")}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            PDF
          </button>
          <button 
            onClick={() => handleExport("excel")}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            Excel
          </button>
        </div>
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
        <MiniKPI icon="🚗" value={String(filteredRides.length)} label="Rides" />
        <MiniKPI icon="💰" value={formatCurrency(todayRevenue)} label="Revenue" colorClass="text-accent-blue" />
        <MiniKPI
          icon="⛽"
          value={formatCurrency(fuelDeduction)}
          label="Fuel Cost"
          colorClass="text-status-amber"
          sub={fuelSource === "est." ? "estimated" : fuelSource === "actual" ? "actual" : undefined}
        />
        <MiniKPI
          icon="🧾"
          value={formatCurrency(todayExpCost)}
          label="Other Exp."
          colorClass="text-status-amber"
          sub="approved"
        />
      </div>

      {/* Net Profit KPI (full width) */}
      <div className="bg-brand-surface rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">📈</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">Net Profit Today</p>
            <p className="text-[10px] text-slate-400" dir="rtl">آج کا منافع</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold tabular-nums ${todayNetProfit >= 0 ? "text-accent-green" : "text-status-red"}`}>
            {formatCurrency(todayNetProfit)}
          </p>
          <p className="text-[10px] text-slate-400">{fuelSource === "est." ? "incl. fuel est." : "actual logs used"}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href="/add-fuel"    className="flex-1 py-3 rounded-xl text-center text-sm font-medium border border-status-amber text-status-amber active:opacity-70 transition-opacity">Add Fuel ⛽</Link>
        <Link href="/add-expense" className="flex-1 py-3 rounded-xl text-center text-sm font-medium border border-slate-300 text-slate-700 active:opacity-70 transition-opacity">Expense 🧾</Link>
      </div>

      {/* Recent Expenses (Driver) */}
      {expenses.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-base font-bold text-slate-900">My Expenses</p>
            <p className="text-xs text-slate-500" dir="rtl">میرے اخراجات</p>
          </div>
          <div className="flex flex-col gap-3">
            {expenses
              .filter(e => e.loggedBy === userId)
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((exp) => (
                <div key={exp.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.emoji || "🧾"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.name || exp.category}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {new Date(exp.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · 
                        <span className={exp.status === "pending" ? "text-slate-500" : exp.status === "approved" ? "text-accent-green" : "text-status-red"}> {exp.status}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-status-amber tabular-nums">− {formatCurrency(exp.amount)}</p>
                </div>
              ))}
          </div>
        </div>
      )}

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
      {filteredRides.length > 0 && (
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
