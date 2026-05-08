import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailySnapshot } from "@/lib/types";

interface DailySnapshotState {
  snapshots: DailySnapshot[];

  // Save or overwrite snapshot for a vehicle+date
  upsertSnapshot: (snap: Omit<DailySnapshot, "id">) => void;

  // Get all snapshots for a vehicle, sorted newest first
  getByVehicle: (vehicleId: string) => DailySnapshot[];

  // Get snapshot for a specific vehicle + date
  getByDate: (vehicleId: string, date: string) => DailySnapshot | null;
}

export const useDailySnapshotStore = create<DailySnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      upsertSnapshot: (data) => {
        set((s) => {
          const existing = s.snapshots.find(
            (x) => x.vehicleId === data.vehicleId && x.date === data.date
          );
          if (existing) {
            return {
              snapshots: s.snapshots.map((x) =>
                x.vehicleId === data.vehicleId && x.date === data.date
                  ? { ...data, id: x.id }
                  : x
              ),
            };
          }
          return {
            snapshots: [
              { ...data, id: `snap-${data.vehicleId}-${data.date}` },
              ...s.snapshots,
            ],
          };
        });
      },

      getByVehicle: (vehicleId) =>
        get()
          .snapshots.filter((x) => x.vehicleId === vehicleId)
          .sort((a, b) => b.date.localeCompare(a.date)),

      getByDate: (vehicleId, date) =>
        get().snapshots.find((x) => x.vehicleId === vehicleId && x.date === date) ?? null,
    }),
    { name: "sawari-daily-snapshots" }
  )
);
