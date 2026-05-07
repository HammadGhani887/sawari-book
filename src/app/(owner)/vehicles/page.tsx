"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car } from "lucide-react";
import { ScreenHeader } from "@/components/ui";
import { VehicleCard } from "@/components/cards";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { useMemo } from "react";

export default function VehiclesPage() {
  const router   = useRouter();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const rides    = useRideStore((s) => s.rides);
  const drivers  = useDriverStore((s) => s.drivers);

  const todayRides = useMemo(
    () => rides.filter((r) => r.rideTime.startsWith(TODAY)),
    [rides]
  );

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title="My Vehicles"
        titleUrdu="میری گاڑیاں"
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
          vehicles.map((vehicle) => {
            const vRides  = todayRides.filter((r) => r.vehicleId === vehicle.id);
            const driver  = drivers.find((d) => d.vehicleId === vehicle.id);
            return (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                todayRides={vRides.length}
                todayRevenue={vRides.reduce((s, r) => s + r.fareAmount, 0)}
                driverName={driver?.name}
                onClick={() => router.push(`/vehicles/${vehicle.id}`)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
