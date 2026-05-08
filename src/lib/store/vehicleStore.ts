import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vehicle, FuelLog } from "@/lib/types";
import { useAuthStore } from "@/lib/store/authStore";

const DEFAULT_FUEL_AVERAGE   = 12.0;
const DEFAULT_PETROL_PRICE   = 280;

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;

  addVehicle: (data: Omit<Vehicle, "id" | "ownerId">) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setSelectedVehicle: (id: string | null) => void;

  // Fuel helpers — read from vehicle, fall back to defaults
  getFuelAverage: (vehicleId: string) => number;
  getPetrolPrice: (vehicleId: string) => number;

  // Calculate effective km/L from odometer logs (auto-average)
  getEffectiveAverage: (vehicleId: string, logs: FuelLog[]) => number;

  // Estimate PKR fuel cost for a given distance
  estimateFuelCost: (vehicleId: string, distanceKm: number, logs: FuelLog[]) => number;
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      selectedVehicleId: null,

      addVehicle: (data) => {
        const ownerId = useAuthStore.getState().user?.id ?? "unknown";
        set((s) => ({
          vehicles: [{ ...data, id: `v${Date.now()}`, ownerId }, ...s.vehicles],
        }));
      },

      updateVehicle: (id, updates) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        })),

      deleteVehicle: (id) =>
        set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),

      setSelectedVehicle: (id) => set({ selectedVehicleId: id }),

      getFuelAverage: (vehicleId) => {
        const v = get().vehicles.find((x) => x.id === vehicleId);
        return v?.fuelAverageKmL ?? DEFAULT_FUEL_AVERAGE;
      },

      getPetrolPrice: (vehicleId) => {
        const v = get().vehicles.find((x) => x.id === vehicleId);
        return v?.petrolPricePkrL ?? DEFAULT_PETROL_PRICE;
      },

      getEffectiveAverage: (vehicleId, logs) => {
        const manualAvg = get().getFuelAverage(vehicleId);

        // Calculate from consecutive odometer readings
        const sorted = [...logs]
          .filter((l) => l.vehicleId === vehicleId && l.odometer != null)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (sorted.length < 2) return manualAvg;

        const segments: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const distKm = sorted[i].odometer! - sorted[i - 1].odometer!;
          const litres = sorted[i].litres;
          if (distKm > 0 && litres > 0) segments.push(distKm / litres);
        }

        if (segments.length === 0) return manualAvg;
        const avg = segments.reduce((a, b) => a + b, 0) / segments.length;
        return Math.round(avg * 10) / 10;
      },

      estimateFuelCost: (vehicleId, distanceKm, logs) => {
        const price  = get().getPetrolPrice(vehicleId);
        const kmL    = get().getEffectiveAverage(vehicleId, logs);
        return Math.round((distanceKm / kmL) * price);
      },
    }),
    { name: "sawari-vehicles" }
  )
);
