import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settlement } from "@/lib/types";

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
      settlements: [],

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
