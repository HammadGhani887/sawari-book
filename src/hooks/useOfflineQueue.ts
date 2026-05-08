"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useRideStore } from "@/lib/store/rideStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import type { Ride, FuelLog, Expense } from "@/lib/types";

// ── Queue keys ────────────────────────────────────────────────────────────────
const RIDE_QUEUE_KEY    = "sawari-offline-ride-queue";
const FUEL_QUEUE_KEY    = "sawari-offline-fuel-queue";
const EXPENSE_QUEUE_KEY = "sawari-offline-expense-queue";

// ── Types ─────────────────────────────────────────────────────────────────────
type PendingRide    = Omit<Ride,    "id" | "loggedAt">;
type PendingFuel    = Omit<FuelLog, "id">;
type PendingExpense = Omit<Expense, "id">;

// ── Save helpers ──────────────────────────────────────────────────────────────
export function saveRideOffline(ride: PendingRide) {
  const q: PendingRide[] = JSON.parse(localStorage.getItem(RIDE_QUEUE_KEY) ?? "[]");
  q.push(ride);
  localStorage.setItem(RIDE_QUEUE_KEY, JSON.stringify(q));
}

export function saveFuelOffline(fuel: PendingFuel) {
  const q: PendingFuel[] = JSON.parse(localStorage.getItem(FUEL_QUEUE_KEY) ?? "[]");
  q.push(fuel);
  localStorage.setItem(FUEL_QUEUE_KEY, JSON.stringify(q));
}

export function saveExpenseOffline(expense: PendingExpense) {
  const q: PendingExpense[] = JSON.parse(localStorage.getItem(EXPENSE_QUEUE_KEY) ?? "[]");
  q.push(expense);
  localStorage.setItem(EXPENSE_QUEUE_KEY, JSON.stringify(q));
}

// ── Sync hook ─────────────────────────────────────────────────────────────────
export function useOfflineSync() {
  const addRide    = useRideStore((s) => s.addRide);
  const addFuel    = useFuelStore((s) => s.addFuelLog);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const syncing    = useRef(false);

  useEffect(() => {
    function sync() {
      if (syncing.current || !navigator.onLine) return;
      syncing.current = true;

      let total = 0;

      // Sync rides
      const rides: PendingRide[] = JSON.parse(localStorage.getItem(RIDE_QUEUE_KEY) ?? "[]");
      if (rides.length > 0) {
        rides.forEach((r) => addRide(r));
        localStorage.removeItem(RIDE_QUEUE_KEY);
        total += rides.length;
      }

      // Sync fuel logs
      const fuels: PendingFuel[] = JSON.parse(localStorage.getItem(FUEL_QUEUE_KEY) ?? "[]");
      if (fuels.length > 0) {
        fuels.forEach((f) => addFuel(f));
        localStorage.removeItem(FUEL_QUEUE_KEY);
        total += fuels.length;
      }

      // Sync expenses
      const expenses: PendingExpense[] = JSON.parse(localStorage.getItem(EXPENSE_QUEUE_KEY) ?? "[]");
      if (expenses.length > 0) {
        expenses.forEach((e) => addExpense(e));
        localStorage.removeItem(EXPENSE_QUEUE_KEY);
        total += expenses.length;
      }

      syncing.current = false;

      if (total > 0) {
        toast.success(`Synced ${total} offline entr${total > 1 ? "ies" : "y"} ✓`, {
          icon: "📶",
          style: { background: "#1E293B", color: "#fff", borderRadius: "12px", borderLeft: "4px solid #10B981" },
        });
      }
    }

    window.addEventListener("online", sync);
    sync(); // attempt on mount
    return () => window.removeEventListener("online", sync);
  }, [addRide, addFuel, addExpense]);
}

// ── Pending count helper ──────────────────────────────────────────────────────
export function getOfflinePendingCount(): number {
  if (typeof window === "undefined") return 0;
  const rides    = JSON.parse(localStorage.getItem(RIDE_QUEUE_KEY)    ?? "[]").length;
  const fuels    = JSON.parse(localStorage.getItem(FUEL_QUEUE_KEY)    ?? "[]").length;
  const expenses = JSON.parse(localStorage.getItem(EXPENSE_QUEUE_KEY) ?? "[]").length;
  return rides + fuels + expenses;
}
