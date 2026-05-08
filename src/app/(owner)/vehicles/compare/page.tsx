"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ScreenHeader, Card } from "@/components/ui";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { formatCurrency } from "@/lib/utils/format";

const NOW        = new Date();
const THIS_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function VehicleComparePage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const rides    = useRideStore((s) => s.rides);
  const expenses = useExpenseStore((s) => s.expenses);
  const fuelLogs = useFuelStore((s) => s.fuelLogs);
  const drivers  = useDriverStore((s) => s.drivers);

  const stats = useMemo(() => {
    return vehicles.map((v) => {
      const monthRides    = rides.filter((r) => r.vehicleId === v.id && r.rideTime.startsWith(THIS_MONTH));
      const monthFuelLogs = fuelLogs.filter((f) => f.vehicleId === v.id && f.date.startsWith(THIS_MONTH));
      const monthExpenses = expenses.filter((e) => e.vehicleId === v.id && e.status === "approved" && e.date.startsWith(THIS_MONTH));

      const revenue    = monthRides.reduce((s, r) => s + r.fareAmount, 0);
      const fuelCost   = monthFuelLogs.reduce((s, f) => s + f.amountPkr, 0) ||
                         monthRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
      const expCost    = monthExpenses.reduce((s, e) => s + e.amount, 0);
      const driver     = drivers.find((d) => d.vehicleId === v.id);
      const salary     = driver?.salaryType === "fixed" ? driver.salaryAmount
                       : driver?.salaryType === "percentage" ? Math.round(revenue * (driver.salaryAmount / 100))
                       : 0;
      const profit     = revenue - fuelCost - expCost - salary;
      const totalKm    = monthRides.reduce((s, r) => s + (r.distanceKm ?? 0), 0);
      const avgFare    = monthRides.length > 0 ? Math.round(revenue / monthRides.length) : 0;

      return { vehicle: v, driver, revenue, fuelCost, expCost, salary, profit, rides: monthRides.length, totalKm, avgFare };
    });
  }, [vehicles, rides, fuelLogs, expenses, drivers]);

  const maxRevenue = Math.max(...stats.map((s) => s.revenue), 1);
  const maxProfit  = Math.max(...stats.map((s) => s.profit), 1);
  const maxRides   = Math.max(...stats.map((s) => s.rides), 1);

  if (vehicles.length < 2) {
    return (
      <div className="flex flex-col min-h-full">
        <ScreenHeader title="Compare Vehicles" titleUrdu="گاڑیوں کا موازنہ" showBack />
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8">
          <span className="text-5xl">🚗</span>
          <p className="text-slate-700 font-semibold text-center">Add at least 2 vehicles to compare</p>
          <Link href="/vehicles/add" className="px-5 py-2.5 rounded-xl bg-accent-green text-white text-sm font-semibold">
            + Add Vehicle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Compare Vehicles" titleUrdu="گاڑیوں کا موازنہ" showBack />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">

        <p className="text-xs text-slate-500 text-center">
          {NOW.toLocaleString("en-PK", { month: "long", year: "numeric" })} — This Month
        </p>

        {/* Revenue comparison */}
        <Card>
          <p className="text-sm font-semibold text-slate-900 mb-4">Revenue 💰</p>
          <div className="flex flex-col gap-4">
            {[...stats].sort((a, b) => b.revenue - a.revenue).map(({ vehicle, revenue, rides: rideCount }) => (
              <div key={vehicle.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{vehicle.makeModel}</p>
                    <p className="text-xs text-slate-500">{vehicle.plateNumber} · {rideCount} rides</p>
                  </div>
                  <p className="text-sm font-bold text-accent-green tabular-nums">{formatCurrency(revenue)}</p>
                </div>
                <Bar value={revenue} max={maxRevenue} color="#10B981" />
              </div>
            ))}
          </div>
        </Card>

        {/* Profit comparison */}
        <Card>
          <p className="text-sm font-semibold text-slate-900 mb-4">Net Profit 📈</p>
          <div className="flex flex-col gap-4">
            {[...stats].sort((a, b) => b.profit - a.profit).map(({ vehicle, profit, fuelCost, salary }) => (
              <div key={vehicle.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{vehicle.makeModel}</p>
                    <p className="text-xs text-slate-500">
                      Fuel: {formatCurrency(fuelCost)} · Salary: {formatCurrency(salary)}
                    </p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${profit >= 0 ? "text-accent-green" : "text-status-red"}`}>
                    {formatCurrency(profit)}
                  </p>
                </div>
                <Bar value={Math.max(profit, 0)} max={maxProfit} color={profit >= 0 ? "#10B981" : "#EF4444"} />
              </div>
            ))}
          </div>
        </Card>

        {/* Rides comparison */}
        <Card>
          <p className="text-sm font-semibold text-slate-900 mb-4">Rides 🚗</p>
          <div className="flex flex-col gap-4">
            {[...stats].sort((a, b) => b.rides - a.rides).map(({ vehicle, rides: rideCount, avgFare, totalKm }) => (
              <div key={vehicle.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{vehicle.makeModel}</p>
                    <p className="text-xs text-slate-500">
                      Avg fare: {formatCurrency(avgFare)}
                      {totalKm > 0 && ` · ${totalKm.toFixed(0)} km`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-accent-blue tabular-nums">{rideCount} rides</p>
                </div>
                <Bar value={rideCount} max={maxRides} color="#3B82F6" />
              </div>
            ))}
          </div>
        </Card>

        {/* Summary table */}
        <Card>
          <p className="text-sm font-semibold text-slate-900 mb-3">Full Breakdown</p>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-1 text-slate-500 font-medium">Vehicle</th>
                  <th className="text-right py-2 px-1 text-slate-500 font-medium">Revenue</th>
                  <th className="text-right py-2 px-1 text-slate-500 font-medium">Fuel</th>
                  <th className="text-right py-2 px-1 text-slate-500 font-medium">Salary</th>
                  <th className="text-right py-2 px-1 text-slate-500 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(({ vehicle, revenue, fuelCost, salary, profit }) => (
                  <tr key={vehicle.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 px-1 text-slate-700 font-medium">{vehicle.plateNumber}</td>
                    <td className="py-2 px-1 text-right text-accent-green font-semibold">{formatCurrency(revenue)}</td>
                    <td className="py-2 px-1 text-right text-status-amber">{formatCurrency(fuelCost)}</td>
                    <td className="py-2 px-1 text-right text-accent-blue">{formatCurrency(salary)}</td>
                    <td className={`py-2 px-1 text-right font-bold ${profit >= 0 ? "text-accent-green" : "text-status-red"}`}>
                      {formatCurrency(profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
