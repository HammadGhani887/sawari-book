"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { KPICard, VehicleCard } from "@/components/cards";
import { WeeklyBarChart } from "@/components/charts";
import { useAuthStore } from "@/lib/store/authStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { formatCurrency, getGreeting } from "@/lib/utils/format";
import { Calculator } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import { ScreenHeader, DateRangeFilter } from "@/components/ui";
import { getRangeInterval, isDateInRange, DateRangeType } from "@/lib/utils/date";
import { exportToPDF, exportToExcel, ExportData } from "@/lib/utils/export";
import api from "@/lib/services/api";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OwnerDashboardPage() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(" ")[0] ?? "Ilyas";

  const vehicles    = useVehicleStore((s) => s.vehicles);
  const rides       = useRideStore((s) => s.rides);
  const expenses    = useExpenseStore((s) => s.expenses);
  const drivers     = useDriverStore((s) => s.drivers);
  const fuelLogs    = useFuelStore((s) => s.fuelLogs);

  const [rangeType, setRangeType] = useState<DateRangeType>("today");
  const [customRange, setCustomRange] = useState({ 
    start: new Date().toISOString().slice(0, 10), 
    end: new Date().toISOString().slice(0, 10) 
  });

  const activeInterval = useMemo(() => getRangeInterval(rangeType, customRange), [rangeType, customRange]);

  const filteredRides = useMemo(() => 
    rides.filter(r => isDateInRange(r.rideTime, activeInterval)),
  [rides, activeInterval]);

  const filteredExpenses = useMemo(() => 
    expenses.filter(e => isDateInRange(e.date, activeInterval)),
  [expenses, activeInterval]);

  const filteredFuelLogs = useMemo(() => 
    fuelLogs.filter(f => isDateInRange(f.date, activeInterval)),
  [fuelLogs, activeInterval]);

  // Refresh rides on mount
  useEffect(() => {
    async function refreshRides() {
      try {
        const res = await api.get("/rides");
        if (res.data) {
          useRideStore.setState({ rides: res.data });
        }
      } catch {
        // Ignore errors
      }
    }
    refreshRides();
  }, []);

  // Performance data — last 7 days revenue for chart (remains fixed for history view)
  const weeklyData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });

    return last7.map((date) => {
      const dayRides = rides.filter((r) => r.rideTime.startsWith(date));
      const revenue  = dayRides.reduce((s, r) => s + r.fareAmount, 0);
      return { day: WEEK_DAYS[new Date(date).getDay()], revenue };
    });
  }, [rides]);

  // Stats per vehicle for selected range
  const vehicleStats = useMemo(() => {
    return Object.fromEntries(
      vehicles.map((v) => {
        const vRides = filteredRides.filter((r) => r.vehicleId === v.id);
        const vFuelLogs = filteredFuelLogs.filter((f) => f.vehicleId === v.id);
        const vExpenses = filteredExpenses.filter((e) => e.vehicleId === v.id && e.status === "approved");
        
        const rev    = vRides.reduce((s, r) => s + r.fareAmount, 0);
        const actual = vFuelLogs.reduce((s, f) => s + f.amountPkr, 0);
        const est    = vRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
        const boost  = vRides.reduce((s, r) => s + (r.boostCost ?? 0), 0);
        const exp    = vExpenses.reduce((s, e) => s + e.amount, 0);
        
        const fuel = actual > 0 ? actual : est;
        const profit = rev - fuel - exp - boost;

        const driver = drivers.find((d) => d.vehicleId === v.id);
        return [
          v.id,
          {
            rides:   vRides.length,
            revenue: rev,
            profit:  profit,
            driver:  driver?.name ?? "—",
          },
        ];
      })
    );
  }, [vehicles, filteredRides, filteredFuelLogs, filteredExpenses, drivers]);

  // KPI totals
  const totalRides    = filteredRides.length;
  const totalRevenue  = filteredRides.reduce((s, r) => s + r.fareAmount, 0);
  
  // Fuel & Profit breakdown
  const { fleetFuelCost, fleetBoostCost, fleetFuelSource } = useMemo(() => {
    let totalFuel = 0;
    let totalBoost = 0;
    let hasActual = false;
    let hasEst    = false;

    vehicles.forEach((v) => {
      const vRides = filteredRides.filter((r) => r.vehicleId === v.id);
      const vFuelLogs = filteredFuelLogs.filter((f) => f.vehicleId === v.id);
      const vActual = vFuelLogs.reduce((s, f) => s + f.amountPkr, 0);
      const vEst    = vRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
      const vBoost  = vRides.reduce((s, r) => s + (r.boostCost ?? 0), 0);

      totalFuel += vActual > 0 ? vActual : vEst;
      totalBoost += vBoost;
      if (vActual > 0) hasActual = true;
      else if (vEst > 0) hasEst = true;
    });

    const source = hasActual && hasEst ? "mixed" : hasActual ? "actual" : hasEst ? "est." : null;
    return { fleetFuelCost: totalFuel, fleetBoostCost: totalBoost, fleetFuelSource: source };
  }, [vehicles, filteredRides, filteredFuelLogs]);

  const totalExpenses = filteredExpenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + e.amount, 0);

  const netProfit = totalRevenue - fleetFuelCost - totalExpenses - fleetBoostCost;

  const handleExport = (format: "pdf" | "excel") => {
    const rangeLabel = rangeType === "custom" 
      ? `${customRange.start} to ${customRange.end}` 
      : rangeType.charAt(0).toUpperCase() + rangeType.slice(1);

    const exportData: ExportData = {
      title: "Fleet Performance Report",
      subtitle: `Period: ${rangeLabel}`,
      filename: `Swaari_Fleet_Report_${rangeType}`,
      headers: ["Vehicle", "Driver", "Rides", "Revenue (PKR)", "Estimated Profit (PKR)"],
      rows: vehicles.map(v => {
        const stats = vehicleStats[v.id];
        return [
          `${v.makeModel} (${v.plateNumber})`,
          stats.driver,
          stats.rides,
          stats.revenue.toLocaleString(),
          stats.profit.toLocaleString()
        ];
      })
    };

    if (format === "pdf") exportToPDF(exportData);
    else exportToExcel(exportData);
  };

  // Revenue anomaly detection — compare current revenue vs historical average
  const anomalies = useMemo(() => {
    const alerts: { vehicleId: string; plateNumber: string; driverName: string; todayRev: number; avgRev: number; pctDrop: number }[] = [];
    if (rangeType !== "today") return alerts; // Only show anomalies for today
    
    const hour = new Date().getHours();
    if (hour < 12) return alerts; // only alert after noon

    vehicles.forEach((v) => {
      const vTodayRev = filteredRides.filter((r) => r.vehicleId === v.id).reduce((s, r) => s + r.fareAmount, 0);
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (i + 1));
        return d.toISOString().slice(0, 10);
      });
      const past7 = last7.map((date) =>
        rides.filter((r) => r.vehicleId === v.id && r.rideTime.startsWith(date)).reduce((s, r) => s + r.fareAmount, 0)
      ).filter((r) => r > 0);

      if (past7.length < 3) return;
      const avg = past7.reduce((s, r) => s + r, 0) / past7.length;
      if (avg > 0 && vTodayRev < avg * 0.6) {
        const driver = drivers.find((d) => d.vehicleId === v.id);
        alerts.push({
          vehicleId:   v.id,
          plateNumber: v.plateNumber,
          driverName:  driver?.name ?? "—",
          todayRev:    vTodayRev,
          avgRev:      Math.round(avg),
          pctDrop:     Math.round(((avg - vTodayRev) / avg) * 100),
        });
      }
    });
    return alerts;
  }, [vehicles, filteredRides, rides, drivers, rangeType]);

  return (
    <div className="px-4 pt-4 pb-4 flex flex-col gap-5">
      <ScreenHeader
        title={`${getGreeting()}, ${firstName}`}
        titleUrdu="خوش آمدید"
        showNotifications
        showRefresh={true}
      />

      <DateRangeFilter
        selected={rangeType}
        onChange={setRangeType}
        customRange={customRange}
        onCustomChange={setCustomRange}
        accentColor="green"
      />

      {/* ── Export Section ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reports</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Export data for this period</p>
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

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="Rides" value={String(totalRides)} icon="🚗" colorClass="text-slate-900" />
        <KPICard label="Revenue" value={formatCurrency(totalRevenue)} icon="💰" colorClass="text-accent-blue" />
        <KPICard 
          label="Fuel Cost" 
          value={formatCurrency(fleetFuelCost)} 
          icon="⛽" 
          colorClass="text-status-amber"
          sub={fleetFuelSource === "est." ? "estimated" : fleetFuelSource === "actual" ? "actual" : fleetFuelSource === "mixed" ? "actual + est." : undefined}
        />
        <KPICard 
          label="Net Profit" 
          value={formatCurrency(netProfit)} 
          icon="📈" 
          colorClass={netProfit >= 0 ? "text-accent-green" : "text-status-red"}
          sub={fleetBoostCost > 0 ? `incl. Rs${fleetBoostCost} boost` : undefined}
        />
      </div>

      {/* ── Expenses row (if any) ── */}
      {totalExpenses > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🧾</span>
              <p className="text-sm font-semibold text-slate-900">Other Expenses</p>
            </div>
            <p className="text-sm font-bold text-status-amber">{formatCurrency(totalExpenses)}</p>
          </div>
          <p className="text-xs text-slate-500 mt-1">Approved expenses for today</p>
        </div>
      )}

      {/* ── Anomaly alerts ── */}
      {anomalies.length > 0 && (
        <div className="flex flex-col gap-2">
          {anomalies.map((a) => (
            <div key={a.vehicleId} className="flex items-start gap-3 bg-status-amberDim border border-status-amber/30 rounded-2xl px-4 py-3">
              <span className="text-lg leading-none shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-status-amber leading-tight">
                  {a.plateNumber} — Revenue {a.pctDrop}% below average
                </p>
                <p className="text-xs text-status-amber/80 mt-0.5">
                  {a.driverName} · Today: {formatCurrency(a.todayRev)} · Avg: {formatCurrency(a.avgRev)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Today's Fleet Summary ── */}
      {totalRides > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today&apos;s Fleet Summary</p>
            <p className="text-[10px] text-slate-400" dir="rtl">آج کا خلاصہ</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Total Revenue</span>
            <span className="font-semibold text-slate-900">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-slate-600">Fuel {fleetFuelSource === "est." ? "(est.)" : fleetFuelSource === "mixed" ? "(mixed)" : ""}</span>
            <span className="font-semibold text-status-amber">− {formatCurrency(fleetFuelCost)}</span>
          </div>
          {totalExpenses > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-600">Approved Expenses</span>
              <span className="font-semibold text-status-amber">− {formatCurrency(totalExpenses)}</span>
            </div>
          )}
          {fleetBoostCost > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-600">Boost / Pop-up 🚀</span>
              <span className="font-semibold text-status-red">− {formatCurrency(fleetBoostCost)}</span>
            </div>
          )}
          <div className="h-px bg-slate-100 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Net Profit</span>
            <span className={`text-base font-bold ${netProfit >= 0 ? "text-accent-green" : "text-status-red"}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      )}

      {/* ── Weekly revenue chart ── */}
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">This Week&apos;s Revenue</p>
        <WeeklyBarChart data={weeklyData} height={180} />
      </Card>

      {/* ── Recent Expenses ── */}
      {expenses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-bold text-slate-900 leading-tight">Recent Expenses</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-[system-ui]" dir="rtl">حالیہ اخراجات</p>
            </div>
            <Link href="/expenses" className="text-xs font-semibold text-status-amber active:opacity-60 transition-opacity">
              See All →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {expenses
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((exp) => (
                <div key={exp.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.emoji || "🧾"}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.name || exp.category}</p>
                      <p className="text-[10px] text-slate-500">{new Date(exp.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} · {exp.status}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-status-amber tabular-nums">− {formatCurrency(exp.amount)}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/rides"
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm active:opacity-70 transition-opacity">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">All Rides</p>
            <p className="text-[10px] text-slate-500" dir="rtl">تمام سواریاں</p>
          </div>
        </Link>
        <Link href="/expenses"
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm active:opacity-70 transition-opacity">
          <span className="text-2xl">🧾</span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Expenses</p>
            <p className="text-[10px] text-slate-500" dir="rtl">اخراجات</p>
          </div>
        </Link>
      </div>

      {/* ── My Vehicles ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-base font-bold text-slate-900 leading-tight">My Vehicles</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-[system-ui]" dir="rtl">میری گاڑیاں</p>
          </div>
          <Link href="/vehicles" className="text-xs font-semibold text-accent-green active:opacity-60 transition-opacity">
            See All →
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 bg-white border border-slate-200 rounded-2xl">
              <span className="text-5xl">🚗</span>
              <div className="text-center">
                <p className="text-base font-semibold text-slate-900">No vehicles yet</p>
                <p className="text-sm text-slate-500 mt-0.5">Add your first vehicle to get started</p>
              </div>
              <Link
                href="/vehicles/add"
                className="px-5 py-2.5 rounded-xl bg-accent-green text-white text-sm font-semibold active:scale-95 transition-transform"
              >
                + Add Vehicle
              </Link>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const stats = vehicleStats[vehicle.id] ?? { rides: 0, revenue: 0, profit: 0, driver: "—" };
              return (
                <div key={vehicle.id} className="flex flex-col gap-1.5">
                  <VehicleCard
                    vehicle={vehicle}
                    todayRides={stats.rides}
                    todayRevenue={stats.revenue}
                    todayProfit={stats.profit}
                    driverName={stats.driver}
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                  />
                  <Link
                    href={`/settlement/${vehicle.id}`}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl border border-accent-green/40 text-accent-green text-xs font-semibold active:opacity-70 transition-opacity bg-accent-greenDim"
                  >
                    <Calculator size={13} />
                    Monthly Settlement · حساب کتاب
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
