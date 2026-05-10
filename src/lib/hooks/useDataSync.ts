"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useDriverStore } from "@/lib/store/driverStore";
import api from "@/lib/services/api";

/**
 * Syncs all data from DB into local Zustand stores on login.
 * Resets when token changes (logout → new login).
 */
export function useDataSync() {
  const token = useAuthStore((s) => s.token);
  const role  = useAuthStore((s) => s.user?.role);
  const syncedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // Always sync if token changed, or if driver store is empty (e.g. after fresh registration)
    const drivers = useDriverStore.getState().drivers;
    const shouldSync = syncedToken.current !== token || (role === "driver" && drivers.length === 0);
    if (!shouldSync) return;
    syncedToken.current = token;

    async function sync() {
      try {
        if (role === "owner") {
          // Owner: fetch vehicles, drivers, rides, expenses, fuel
          const [vehiclesRes, driversRes, ridesRes, expensesRes, fuelRes] = await Promise.all([
            api.get("/vehicles"),
            api.get("/drivers"),
            api.get("/rides"),
            api.get("/expenses"),
            api.get("/fuel"),
          ]);
          useVehicleStore.setState({ vehicles: vehiclesRes.data });
          // Sync drivers from DB (replaces any stale local-only entries)
          if (Array.isArray(driversRes.data)) {
            useDriverStore.setState({ drivers: driversRes.data });
          }
          useRideStore.setState({ rides: ridesRes.data });
          useExpenseStore.setState({ expenses: expensesRes.data });
          useFuelStore.setState({ fuelLogs: fuelRes.data });
        } else {
          // Driver: fetch their assignment + vehicle info + rides/expenses/fuel
          const [driversRes, ridesRes, expensesRes, fuelRes] = await Promise.all([
            api.get("/drivers"),
            api.get("/rides"),
            api.get("/expenses"),
            api.get("/fuel"),
          ]);
          // Sync driver's own profile/assignment into driverStore
          if (Array.isArray(driversRes.data) && driversRes.data.length > 0) {
            useDriverStore.setState({ drivers: driversRes.data });
            // Also sync the assigned vehicle into vehicleStore so home page can show it
            const vehicleId = driversRes.data[0]?.vehicleId;
            if (vehicleId) {
              try {
                const vehicleRes = await api.get(`/vehicles/${vehicleId}`);
                if (vehicleRes.data) {
                  useVehicleStore.setState((s) => {
                    const exists = s.vehicles.find((v) => v.id === vehicleId);
                    return {
                      vehicles: exists
                        ? s.vehicles.map((v) => v.id === vehicleId ? { ...v, ...vehicleRes.data } : v)
                        : [...s.vehicles, vehicleRes.data],
                    };
                  });
                }
              } catch {
                // Vehicle fetch failed, continue without it
              }
            }
          }
          useRideStore.setState({ rides: ridesRes.data });
          useExpenseStore.setState({ expenses: expensesRes.data });
          useFuelStore.setState({ fuelLogs: fuelRes.data });
        }
      } catch {
        // Silently fall back to local store
      }
    }

    sync();
  }, [token, role]);
}
