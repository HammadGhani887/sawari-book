import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vehicle } from "@/lib/types";

const SEED: Vehicle[] = [
  {
    id: "v1",
    ownerId: "1",
    plateNumber: "LEA-1234",
    makeModel: "Suzuki Alto 2022",
    fuelType: "petrol",
    platforms: ["indrive", "yango"],
    isActive: true,
  },
  {
    id: "v2",
    ownerId: "1",
    plateNumber: "LEB-5678",
    makeModel: "Honda City 2021",
    fuelType: "petrol",
    platforms: ["indrive"],
    isActive: true,
  },
];

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  addVehicle: (data: Omit<Vehicle, "id" | "ownerId">) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setSelectedVehicle: (id: string | null) => void;
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      vehicles: SEED,
      selectedVehicleId: null,

      addVehicle: (data) =>
        set((s) => ({
          vehicles: [{ ...data, id: `v${Date.now()}`, ownerId: "1" }, ...s.vehicles],
        })),

      updateVehicle: (id, updates) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        })),

      deleteVehicle: (id) =>
        set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),

      setSelectedVehicle: (id) => set({ selectedVehicleId: id }),
    }),
    { name: "sawari-vehicles" }
  )
);
