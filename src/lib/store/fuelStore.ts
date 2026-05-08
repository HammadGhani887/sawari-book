import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FuelLog } from "@/lib/types";

interface FuelState {
  fuelLogs: FuelLog[];
  addFuelLog: (data: Omit<FuelLog, "id">) => void;
  getByVehicle: (vehicleId: string) => FuelLog[];
}

export const useFuelStore = create<FuelState>()(
  persist(
    (set, get) => ({
      fuelLogs: [],

      addFuelLog: (data) =>
        set((s) => ({
          fuelLogs: [{ ...data, id: `f${Date.now()}` }, ...s.fuelLogs],
        })),

      getByVehicle: (vehicleId) =>
        get().fuelLogs.filter((f) => f.vehicleId === vehicleId),
    }),
    { name: "sawari-fuel" }
  )
);
