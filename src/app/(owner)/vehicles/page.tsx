"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Calculator, GitCompare } from "lucide-react";
import { ScreenHeader } from "@/components/ui";
import { VehicleCard } from "@/components/cards";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { useMemo } from "react";
import { getRangeInterval, isDateInRange } from "@/lib/utils/date";

export default function VehiclesPage() {
  const router   = useRouter();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const rides    = useRideStore((s) => s.rides);
  const drivers  = useDriverStore((s) => s.drivers);

  const todayRange = useMemo(() => getRangeInterval("today"), []);

  const todayRides = useMemo(
    () => rides.filter((r) => isDateInRange(r.rideTime, todayRange)),
    [rides, todayRange]
  );

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title="My Vehicles"
        titleUrdu="میری گاڑیاں"
        showRefresh={true}
        rightAction={
          <Link
            href="/vehicles/add"
            className="px-3 py-1.5 rounded-full bg-accent-green text-white text-xs font-semibold active:opacity-70 transition-opacity"
          >
            + Add
          </Link>
        }
      />

      <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
        {/* Tools row */}
        {vehicles.length > 0 && (
          <div className="flex gap-2">
            <Link href="/vehicles/compare"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-accent-blue/40 text-accent-blue text-xs font-semibold active:opacity-70 bg-accent-blueDim">
              <GitCompare size={13} /> Compare
            </Link>
            <Link href="/vehicles/breakeven"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold active:opacity-70 bg-white">
              <Calculator size={13} /> Break-Even
            </Link>
          </div>
        )}
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Car size={48} className="text-slate-700" />
            <p className="text-slate-500 text-sm text-center">
              No vehicles yet. Tap + Add to get started.
            </p>
            <Link
              href="/vehicles/add"
              className="px-5 py-2.5 rounded-xl bg-accent-green text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Add First Vehicle
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {vehicles.map((vehicle) => {
              const vRides  = todayRides.filter((r) => r.vehicleId === vehicle.id);
              const driver  = drivers.find((d) => d.vehicleId === vehicle.id);
              return (
                <div key={vehicle.id} className="flex flex-col gap-1.5">
                  <VehicleCard
                    vehicle={vehicle}
                    todayRides={vRides.length}
                    todayRevenue={vRides.reduce((s, r) => s + r.fareAmount, 0)}
                    driverName={driver?.name}
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                  />
                  {/* Settlement shortcut */}
                  <Link
                    href={`/settlement/${vehicle.id}`}
                    className="flex items-center justify-center gap-2 py-2 rounded-xl border border-accent-green/40 text-accent-green text-xs font-semibold active:opacity-70 transition-opacity bg-accent-greenDim"
                  >
                    <Calculator size={13} />
                    Monthly Settlement · حساب کتاب
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
