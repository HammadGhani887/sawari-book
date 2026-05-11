"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useRideStore } from "@/lib/store/rideStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import api from "@/lib/services/api";
import type { Ride, FuelLog, Expense } from "@/lib/types";

// ── Queue keys ────────────────────────────────────────────────────────────────
const RIDE_QUEUE_KEY    = "sawari-offline-ride-queue";
const FUEL_QUEUE_KEY    = "sawari-offline-fuel-queue";
const EXPENSE_QUEUE_KEY = "sawari-offline-expense-queue";

// ── Types ─────────────────────────────────────────────────────────────────────
type PendingRide    = Omit<Ride,    "id" | "loggedAt">;
type PendingFuel    = Omit<FuelLog, "id">;
type PendingExpense = Omit<Expense, "id">;
type QueuedItem<T> = { idempotencyKey: string; payload: T };

function normalizeQueueItem<T extends object>(item: T | QueuedItem<T>, scope: string): QueuedItem<T> {
  if (item && typeof item === "object" && "payload" in item && "idempotencyKey" in item) {
    const queued = item as QueuedItem<T>;
    if (queued.idempotencyKey && queued.payload) return queued;
  }
  return {
    idempotencyKey: `${scope}-legacy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    payload: item as T,
  };
}

// ── Save helpers ──────────────────────────────────────────────────────────────
export function saveRideOffline(ride: PendingRide, idempotencyKey: string) {
  const q: QueuedItem<PendingRide>[] = JSON.parse(localStorage.getItem(RIDE_QUEUE_KEY) ?? "[]");
  q.push({ idempotencyKey, payload: ride });
  localStorage.setItem(RIDE_QUEUE_KEY, JSON.stringify(q));
}

export function saveFuelOffline(fuel: PendingFuel, idempotencyKey: string) {
  const q: QueuedItem<PendingFuel>[] = JSON.parse(localStorage.getItem(FUEL_QUEUE_KEY) ?? "[]");
  q.push({ idempotencyKey, payload: fuel });
  localStorage.setItem(FUEL_QUEUE_KEY, JSON.stringify(q));
}

export function saveExpenseOffline(expense: PendingExpense, idempotencyKey: string) {
  const q: QueuedItem<PendingExpense>[] = JSON.parse(localStorage.getItem(EXPENSE_QUEUE_KEY) ?? "[]");
  q.push({ idempotencyKey, payload: expense });
  localStorage.setItem(EXPENSE_QUEUE_KEY, JSON.stringify(q));
}

// ── Sync hook ─────────────────────────────────────────────────────────────────
export function useOfflineSync() {
  const addRide    = useRideStore((s) => s.addRide);
  const addFuel    = useFuelStore((s) => s.addFuelLog);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const syncing    = useRef(false);

  useEffect(() => {
    async function sync() {
      if (syncing.current || !navigator.onLine) return;
      syncing.current = true;

      let total = 0;
      let failed = 0;

      // Sync rides
      const ridesRaw: Array<PendingRide | QueuedItem<PendingRide>> = JSON.parse(localStorage.getItem(RIDE_QUEUE_KEY) ?? "[]");
      if (ridesRaw.length > 0) {
        const unsyncedRides: QueuedItem<PendingRide>[] = [];
        for (const raw of ridesRaw) {
          const ride = normalizeQueueItem(raw, "ride");
          try {
            await api.post("/rides", { ...ride.payload, idempotencyKey: ride.idempotencyKey });
            addRide(ride.payload);
            total += 1;
          } catch {
            unsyncedRides.push(ride);
            failed += 1;
          }
        }
        if (unsyncedRides.length > 0) {
          localStorage.setItem(RIDE_QUEUE_KEY, JSON.stringify(unsyncedRides));
        } else {
          localStorage.removeItem(RIDE_QUEUE_KEY);
        }
      }

      // Sync fuel logs
      const fuelsRaw: Array<PendingFuel | QueuedItem<PendingFuel>> = JSON.parse(localStorage.getItem(FUEL_QUEUE_KEY) ?? "[]");
      if (fuelsRaw.length > 0) {
        const unsyncedFuels: QueuedItem<PendingFuel>[] = [];
        for (const raw of fuelsRaw) {
          const fuel = normalizeQueueItem(raw, "fuel");
          try {
            await api.post("/fuel", { ...fuel.payload, idempotencyKey: fuel.idempotencyKey });
            addFuel(fuel.payload);
            total += 1;
          } catch {
            unsyncedFuels.push(fuel);
            failed += 1;
          }
        }
        if (unsyncedFuels.length > 0) {
          localStorage.setItem(FUEL_QUEUE_KEY, JSON.stringify(unsyncedFuels));
        } else {
          localStorage.removeItem(FUEL_QUEUE_KEY);
        }
      }

      // Sync expenses
      const expensesRaw: Array<PendingExpense | QueuedItem<PendingExpense>> = JSON.parse(localStorage.getItem(EXPENSE_QUEUE_KEY) ?? "[]");
      if (expensesRaw.length > 0) {
        const unsyncedExpenses: QueuedItem<PendingExpense>[] = [];
        for (const raw of expensesRaw) {
          const expense = normalizeQueueItem(raw, "expense");
          try {
            await api.post("/expenses", { ...expense.payload, idempotencyKey: expense.idempotencyKey });
            addExpense(expense.payload);
            total += 1;
          } catch {
            unsyncedExpenses.push(expense);
            failed += 1;
          }
        }
        if (unsyncedExpenses.length > 0) {
          localStorage.setItem(EXPENSE_QUEUE_KEY, JSON.stringify(unsyncedExpenses));
        } else {
          localStorage.removeItem(EXPENSE_QUEUE_KEY);
        }
      }

      syncing.current = false;

      if (total > 0) {
        toast.success(`Synced ${total} offline entr${total > 1 ? "ies" : "y"} ✓`, {
          icon: "📶",
          style: { background: "#1E293B", color: "#fff", borderRadius: "12px", borderLeft: "4px solid #10B981" },
        });
      }
      if (failed > 0) {
        toast.error(`${failed} offline entr${failed > 1 ? "ies" : "y"} still pending sync`, {
          style: { background: "#1E293B", color: "#fff", borderRadius: "12px" },
        });
      }
    }

    const runSync = () => {
      void sync();
    };
    window.addEventListener("online", runSync);
    runSync(); // attempt on mount
    return () => window.removeEventListener("online", runSync);
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
