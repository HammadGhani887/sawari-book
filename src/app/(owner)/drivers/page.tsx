"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { ScreenHeader } from "@/components/ui";
import { DriverCard } from "@/components/cards";
import { useDriverStore } from "@/lib/store/driverStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";

export default function DriversPage() {
  const router   = useRouter();
  const drivers  = useDriverStore((s) => s.drivers);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const rides    = useRideStore((s) => s.rides);

  const todayRides = useMemo(
    () => rides.filter((r) => r.rideTime.startsWith(TODAY)),
    [rides]
  );

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title="My Drivers"
        titleUrdu="میرے ڈرائیور"
        rightAction={
          <Link
            href="/drivers/add"
            className="px-3 py-1.5 rounded-full bg-accent-green text-white text-xs font-semibold active:opacity-70 transition-opacity"
          >
            + Add
          </Link>
        }
      />

      <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
        {drivers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <User size={48} className="text-slate-700" />
            <p className="text-slate-500 text-sm text-center">
              No drivers yet. Tap + Add to get started.
            </p>
            <Link
              href="/drivers/add"
              className="px-5 py-2.5 rounded-xl bg-accent-green text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              Add First Driver
            </Link>
          </div>
        ) : (
          drivers.map((d) => {
            const vehicle   = vehicles.find((v) => v.id === d.vehicleId);
            const vehicleName = vehicle
              ? `${vehicle.makeModel} · ${vehicle.plateNumber}`
              : undefined;
            const dRides    = todayRides.filter((r) => r.driverId === d.id);
            return (
              <DriverCard
                key={d.id}
                name={d.name}
                phone={d.phone}
                vehicleName={vehicleName}
                todayRides={dRides.length}
                todayRevenue={dRides.reduce((s, r) => s + r.fareAmount, 0)}
                isActive={d.isActive}
                onClick={() => router.push(`/drivers/${d.id}`)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
