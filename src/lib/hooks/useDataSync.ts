"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
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
    if (!token || syncedToken.current === token) return;
    syncedToken.current = token;

    async function sync() {
      try {
        if (role === "owner") {
          // Owner: fetch vehicles first, then rides/expenses/fuel
          const [vehiclesRes, ridesRes, expensesRes, fuelRes] = await Promise.all([
            api.get("/vehicles"),
            api.get("/rides"),
            api.get("/expenses"),
            api.get("/fuel"),
          ]);
          useVehicleStore.setState((s) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vehicles: vehiclesRes.data.map((v: any) => ({
              ...v,
              // Preserve local fuel settings if DB doesn't have them yet
              fuelAverageKmL:     v.fuelAverageKmL     ?? s.vehicles.find((x) => x.id === v.id)?.fuelAverageKmL,
              petrolPricePkrL:    v.petrolPricePkrL    ?? s.vehicles.find((x) => x.id === v.id)?.petrolPricePkrL,
              tankCapacityLitres: v.tankCapacityLitres ?? s.vehicles.find((x) => x.id === v.id)?.tankCapacityLitres,
            })),
          }));
          useRideStore.setState({ rides: ridesRes.data });
          useExpenseStore.setState({ expenses: expensesRes.data });
          useFuelStore.setState({ fuelLogs: fuelRes.data });
        } else {
          // Driver: fetch rides, expenses, fuel
          const [ridesRes, expensesRes, fuelRes] = await Promise.all([
            api.get("/rides"),
            api.get("/expenses"),
            api.get("/fuel"),
          ]);
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
