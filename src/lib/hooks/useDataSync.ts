"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import api from "@/lib/services/api";

import { useSyncStore } from "@/lib/store/syncStore";

/**
 * Syncs all data from DB into local Zustand stores.
 */
export function useDataSync() {
  const token = useAuthStore((s) => s.token);
  const role  = useAuthStore((s) => s.user?.role);
  const { setSyncing, setLastSynced } = useSyncStore();
  const syncedToken = useRef<string | null>(null);

  const performSync = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    try {
      if (role === "owner") {
        const [vehiclesRes, driversRes, ridesRes, expensesRes, fuelRes, notifRes] = await Promise.all([
          api.get("/vehicles"),
          api.get("/drivers"),
          api.get("/rides"),
          api.get("/expenses"),
          api.get("/fuel"),
          api.get("/notifications"),
        ]);
        useVehicleStore.setState({ vehicles: vehiclesRes.data });
        if (Array.isArray(driversRes.data)) {
          useDriverStore.setState({ drivers: driversRes.data });
        }
        useRideStore.setState({ rides: ridesRes.data });
        useExpenseStore.setState({ expenses: expensesRes.data });
        useFuelStore.setState({ fuelLogs: fuelRes.data });
        useNotificationStore.setState({ notifications: notifRes.data });
      } else {
        const [driversRes, ridesRes, expensesRes, fuelRes, notifRes] = await Promise.all([
          api.get("/drivers"),
          api.get("/rides"),
          api.get("/expenses"),
          api.get("/fuel"),
          api.get("/notifications"),
        ]);
        if (Array.isArray(driversRes.data) && driversRes.data.length > 0) {
          useDriverStore.setState({ drivers: driversRes.data });
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
            } catch {}
          }
        }
        useRideStore.setState({ rides: ridesRes.data });
        useExpenseStore.setState({ expenses: expensesRes.data });
        useFuelStore.setState({ fuelLogs: fuelRes.data });
        useNotificationStore.setState({ notifications: notifRes.data });
      }
      setLastSynced(new Date().toISOString());
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }, [token, role, setSyncing, setLastSynced]);

  useEffect(() => {
    if (!token) return;
    const rides = useRideStore.getState().rides;
    const shouldSync = syncedToken.current !== token || rides.length === 0;
    if (shouldSync) {
      syncedToken.current = token;
      performSync();
    }
  }, [token, role, performSync]);

  return { performSync };
}
