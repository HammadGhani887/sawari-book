import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FuelLog } from "@/lib/types";

const SEED: FuelLog[] = [
  { id: "f1", vehicleId: "v1", driverId: "d1", amountPkr: 2500, litres: 20, odometer: 45000, pumpName: "PSO Gulberg",        date: "2026-05-07T07:30:00.000Z" },
  { id: "f2", vehicleId: "v2", driverId: "d2", amountPkr: 3200, litres: 25, odometer: 62000, pumpName: "Total Parco",         date: "2026-05-06T08:15:00.000Z" },
  { id: "f3", vehicleId: "v1", driverId: "d1", amountPkr: 3500, litres: 28, odometer: 45350, pumpName: "Total Parco",         date: "2026-05-05T07:00:00.000Z" },
  { id: "f4", vehicleId: "v2", driverId: "d2", amountPkr: 2800, litres: 22, odometer: 62350, pumpName: "PSO Model Town",      date: "2026-05-04T08:30:00.000Z" },
  { id: "f5", vehicleId: "v1", driverId: "d1", amountPkr: 4000, litres: 30, odometer: 45700, pumpName: "PSO Liberty",         date: "2026-05-03T07:15:00.000Z" },
  { id: "f6", vehicleId: "v2", driverId: "d2", amountPkr: 3100, litres: 24, odometer: 62700, pumpName: "Total Parco",         date: "2026-05-02T08:00:00.000Z" },
  { id: "f7", vehicleId: "v1", driverId: "d1", amountPkr: 3800, litres: 29, odometer: 46100, pumpName: "Attock Gulberg",      date: "2026-04-30T07:45:00.000Z" },
  { id: "f8", vehicleId: "v2", driverId: "d2", amountPkr: 2600, litres: 21, odometer: 63000, pumpName: "PSO DHA",             date: "2026-04-28T08:00:00.000Z" },
];

interface FuelState {
  fuelLogs: FuelLog[];
  addFuelLog: (data: Omit<FuelLog, "id">) => void;
  getByVehicle: (vehicleId: string) => FuelLog[];
}

export const useFuelStore = create<FuelState>()(
  persist(
    (set, get) => ({
      fuelLogs: SEED,

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
