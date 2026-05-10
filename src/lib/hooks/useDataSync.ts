"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import api from "@/lib/services/api";

/**
 * Syncs rides, expenses, and fuel logs from the DB into local Zustand stores.
 * Called once per layout mount (owner or driver).
 * Resets when token changes (logout → new login) so fresh data is always fetched.
 */
export function useDataSync() {
  const token = useAuthStore((s) => s.token);
  const role  = useAuthStore((s) => s.user?.role);
  // Track which token we last synced for — resets on logout/new login
  const syncedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || syncedToken.current === token) return;
    syncedToken.current = token;

    async function sync() {
      try {
        const [ridesRes, expensesRes, fuelRes] = await Promise.all([
          api.get("/rides"),
          api.get("/expenses"),
          api.get("/fuel"),
        ]);
        useRideStore.setState({ rides: ridesRes.data });
        useExpenseStore.setState({ expenses: expensesRes.data });
        useFuelStore.setState({ fuelLogs: fuelRes.data });
      } catch {
        // Silently fall back to whatever is in local store
      }
    }

    sync();
  }, [token, role]);
}
