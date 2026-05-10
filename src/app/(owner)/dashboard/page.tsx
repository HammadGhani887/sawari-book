"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui";
import { KPICard, VehicleCard } from "@/components/cards";
import { WeeklyBarChart } from "@/components/charts";
import { useAuthStore } from "@/lib/store/authStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { formatCurrency, getGreeting, formatDate } from "@/lib/utils/format";
import { Calculator } from "lucide-react";
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
  const unreadCount = useNotificationStore((s) => s.unreadCount)();

  // Refresh rides on mount to get latest data with fuel costs
  useEffect(() => {
    async function refreshRides() {
      try {
        const res = await api.get("/rides");
        if (res.data) {
          useRideStore.setState({ rides: res.data });
        }
      } catch {
        // Ignore errors, use cached data
      }
    }
    refreshRides();
  }, []);

  // Weekly bar chart — Mon-Sun centred on today (2026-05-07 = Wednesday)
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(TODAY + "T00:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const revenue = rides
        .filter((r) => r.rideTime.startsWith(dateStr))
        .reduce((s, r) => s + r.fareAmount, 0);
      return { day: WEEK_DAYS[d.getUTCDay()], revenue };
    });
  }, [rides]);

  // Today's stats per vehicle
  const todayRides = useMemo(
    () => rides.filter((r) => r.rideTime.startsWith(TODAY)),
    [rides]
  );

  const vehicleStats = useMemo(() => {
    return Object.fromEntries(
      vehicles.map((v) => {
        const vRides = todayRides.filter((r) => r.vehicleId === v.id);
        const driver = drivers.find((d) => d.vehicleId === v.id);
        return [
          v.id,
          {
            rides:   vRides.length,
            revenue: vRides.reduce((s, r) => s + r.fareAmount, 0),
            driver:  driver?.name ?? "—",
          },
        ];
      })
    );
  }, [vehicles, todayRides, drivers]);

  // KPI totals
  const totalRides    = todayRides.length;
  const totalRevenue  = todayRides.reduce((s, r) => s + r.fareAmount, 0);
  
  // Fuel cost: actual fuel logs today, fallback to estimated from rides
  const todayFuelLogs = fuelLogs.filter((f) => f.date.startsWith(TODAY));
  const actualFuelCost = todayFuelLogs.reduce((s, f) => s + f.amountPkr, 0);
  const estimatedFuelCost = todayRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
  const fuelCost = actualFuelCost > 0 ? actualFuelCost : estimatedFuelCost;
  const fuelSource = actualFuelCost > 0 ? "actual" : estimatedFuelCost > 0 ? "est." : null;
  
  const totalExpenses = expenses
    .filter((e) => e.status === "approved" && e.date.startsWith(TODAY))
    .reduce((s, e) => s + e.amount, 0);

  const netProfit = totalRevenue - fuelCost - totalExpenses;

  // Revenue anomaly detection — compare today vs last 7 days average per vehicle
  const anomalies = useMemo(() => {
    const alerts: { vehicleId: string; plateNumber: string; driverName: string; todayRev: number; avgRev: number; pctDrop: number }[] = [];
    const hour = new Date().getHours();
    if (hour < 12) return alerts; // only alert after noon

    vehicles.forEach((v) => {
      const vTodayRev = todayRides.filter((r) => r.vehicleId === v.id).reduce((s, r) => s + r.fareAmount, 0);
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(TODAY + "T00:00:00.000Z");
        d.setUTCDate(d.getUTCDate() - (i + 1));
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
  }, [vehicles, todayRides, rides, drivers]);

  return (
    <div className="px-4 pt-5 pb-4 flex flex-col gap-5">

      {/* ── Greeting + bell ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{formatDate(new Date().toISOString())}</p>
        </div>

        <Link href="/notifications" className="relative mt-0.5 shrink-0">
          <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center text-slate-700 active:text-slate-900 transition-colors">
            <Bell size={20} />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-status-red rounded-full text-xs font-bold flex items-center justify-center text-white leading-none pointer-events-none">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard label="Rides" value={String(totalRides)} icon="🚗" colorClass="text-slate-900" />
        <KPICard label="Revenue" value={formatCurrency(totalRevenue)} icon="💰" colorClass="text-accent-blue" />
        <KPICard 
          label="Fuel Cost" 
          value={formatCurrency(fuelCost)} 
          icon="⛽" 
          colorClass="text-status-amber"
          sub={fuelSource === "est." ? "estimated" : fuelSource === "actual" ? "actual" : undefined}
        />
        <KPICard 
          label="Net Profit" 
          value={formatCurrency(netProfit)} 
          icon="📈" 
          colorClass={netProfit >= 0 ? "text-accent-green" : "text-status-red"}
          sub={fuelSource === "est." ? "fuel est." : undefined}
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

      {/* ── Weekly revenue chart ── */}
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">This Week&apos;s Revenue</p>
        <WeeklyBarChart data={weeklyData} height={180} />
      </Card>

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
              const stats = vehicleStats[vehicle.id] ?? { rides: 0, revenue: 0, driver: "—" };
              return (
                <div key={vehicle.id} className="flex flex-col gap-1.5">
                  <VehicleCard
                    vehicle={vehicle}
                    todayRides={stats.rides}
                    todayRevenue={stats.revenue}
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
