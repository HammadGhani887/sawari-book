"use client";

import { useMemo } from "react";
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
import { formatCurrency, getGreeting, formatDate } from "@/lib/utils/format";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function OwnerDashboardPage() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(" ")[0] ?? "Ilyas";

  const vehicles    = useVehicleStore((s) => s.vehicles);
  const rides       = useRideStore((s) => s.rides);
  const expenses    = useExpenseStore((s) => s.expenses);
  const drivers     = useDriverStore((s) => s.drivers);
  const unreadCount = useNotificationStore((s) => s.unreadCount)();

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
  const totalRides   = todayRides.length;
  const totalRevenue = todayRides.reduce((s, r) => s + r.fareAmount, 0);
  const totalExpenses = expenses
    .filter((e) => e.status === "approved" && e.date.startsWith(TODAY))
    .reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="px-4 pt-5 pb-4 flex flex-col gap-5">

      {/* ── Greeting + bell ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{formatDate(new Date().toISOString())}</p>
        </div>

        <Link href="/notifications" className="relative mt-0.5 shrink-0">
          <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center text-slate-300 active:text-white transition-colors">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Today's Rides" value={String(totalRides)}             icon="🚗" colorClass="text-white" />
        <KPICard label="Revenue"       value={formatCurrency(totalRevenue)}   icon="💰" colorClass="text-accent-green" trend={{ value: "+12%", positive: true }} />
        <KPICard label="Expenses"      value={formatCurrency(totalExpenses)}  icon="🧾" colorClass="text-status-amber" />
        <KPICard label="Net Profit"    value={formatCurrency(netProfit)}      icon="📈" colorClass="text-accent-green" trend={{ value: "+18%", positive: true }} />
      </div>

      {/* ── Weekly revenue chart ── */}
      <Card>
        <p className="text-sm font-medium text-slate-300 mb-3">This Week&apos;s Revenue</p>
        <WeeklyBarChart data={weeklyData} height={180} />
      </Card>

      {/* ── My Vehicles ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-base font-bold text-white leading-tight">My Vehicles</p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-[system-ui]" dir="rtl">میری گاڑیاں</p>
          </div>
          <Link href="/vehicles" className="text-xs font-semibold text-accent-green active:opacity-60 transition-opacity">
            See All →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {vehicles.map((vehicle) => {
            const stats = vehicleStats[vehicle.id] ?? { rides: 0, revenue: 0, driver: "—" };
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                todayRides={stats.rides}
                todayRevenue={stats.revenue}
                driverName={stats.driver}
                onClick={() => router.push(`/vehicles/${vehicle.id}`)}
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}
