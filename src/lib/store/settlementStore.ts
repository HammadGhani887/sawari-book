import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settlement } from "@/lib/types";

const SEED: Settlement[] = [
  // ── v1 / d1 (Ahmed) ──────────────────────────────────────────────────────────
  { id: "s1", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-02-01", periodEnd: "2026-02-28", totalRevenue: 140000, totalExpenses: 41000, driverSalary: 25000, ownerProfit: 74000, status: "settled",  settledAt: "2026-03-01T10:00:00.000Z" },
  { id: "s2", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-03-01", periodEnd: "2026-03-31", totalRevenue: 155000, totalExpenses: 44000, driverSalary: 25000, ownerProfit: 86000, status: "settled",  settledAt: "2026-04-01T10:00:00.000Z" },
  { id: "s3", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-04-01", periodEnd: "2026-04-30", totalRevenue: 168500, totalExpenses: 53900, driverSalary: 25000, ownerProfit: 89600, status: "settled",  settledAt: "2026-05-01T10:00:00.000Z" },
  { id: "s4", ownerId: "1", driverId: "d1", vehicleId: "v1", periodStart: "2026-05-01", periodEnd: "2026-05-31", totalRevenue: 17340,  totalExpenses: 29200, driverSalary: 0,     ownerProfit: 0,     status: "pending" },
  // ── v2 / d2 (Farhan) ─────────────────────────────────────────────────────────
  { id: "s5", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-02-01", periodEnd: "2026-02-28", totalRevenue: 125000, totalExpenses: 38000, driverSalary: 22000, ownerProfit: 65000, status: "settled",  settledAt: "2026-03-01T10:00:00.000Z" },
  { id: "s6", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-03-01", periodEnd: "2026-03-31", totalRevenue: 138000, totalExpenses: 42000, driverSalary: 22000, ownerProfit: 74000, status: "settled",  settledAt: "2026-04-01T10:00:00.000Z" },
  { id: "s7", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-04-01", periodEnd: "2026-04-30", totalRevenue: 149000, totalExpenses: 47000, driverSalary: 22000, ownerProfit: 80000, status: "settled",  settledAt: "2026-05-01T10:00:00.000Z" },
  { id: "s8", ownerId: "1", driverId: "d2", vehicleId: "v2", periodStart: "2026-05-01", periodEnd: "2026-05-31", totalRevenue: 8060,   totalExpenses: 8500,  driverSalary: 0,     ownerProfit: 0,     status: "pending" },
];

interface SettlementState {
  settlements: Settlement[];
  markSettled: (id: string) => void;
  upsertSettlement: (s: Settlement) => void;
  getByVehicle: (vehicleId: string) => Settlement[];
  getByDriver: (driverId: string) => Settlement[];
}

export const useSettlementStore = create<SettlementState>()(
  persist(
    (set, get) => ({
      settlements: SEED,

      markSettled: (id) =>
        set((s) => ({
          settlements: s.settlements.map((x) =>
            x.id === id
              ? { ...x, status: "settled" as const, settledAt: new Date().toISOString() }
              : x
          ),
        })),

      upsertSettlement: (newS) =>
        set((s) => {
          const exists = s.settlements.find((x) => x.id === newS.id);
          return {
            settlements: exists
              ? s.settlements.map((x) => (x.id === newS.id ? newS : x))
              : [newS, ...s.settlements],
          };
        }),

      getByVehicle: (vehicleId) =>
        get().settlements.filter((x) => x.vehicleId === vehicleId),

      getByDriver: (driverId) =>
        get().settlements.filter((x) => x.driverId === driverId),
    }),
    { name: "sawari-settlements" }
  )
);
