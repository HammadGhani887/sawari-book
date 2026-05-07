import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FuelLog } from "@/lib/types";

interface VehicleSettingsState {
  fuelAverageKmL:  number;   // manual km/L (used when autoAverage off or no data)
  petrolPricePkrL: number;   // PKR per litre
  autoAverage:     boolean;  // calculate km/L from actual fill-up logs

  setFuelAverage:  (v: number)  => void;
  setPetrolPrice:  (v: number)  => void;
  setAutoAverage:  (v: boolean) => void;

  // Returns actual km/L from odometer-bearing fill-up logs, or falls back to manual
  getEffectiveAverage: (logs: FuelLog[]) => number;

  // Estimate PKR fuel cost for a given distance
  estimateFuelCost: (distanceKm: number, logs: FuelLog[]) => number;
}

export const useVehicleSettingsStore = create<VehicleSettingsState>()(
  persist(
    (set, get) => ({
      fuelAverageKmL:  12.0,
      petrolPricePkrL: 280,
      autoAverage:     true,

      setFuelAverage:  (v) => set({ fuelAverageKmL:  v }),
      setPetrolPrice:  (v) => set({ petrolPricePkrL: v }),
      setAutoAverage:  (v) => set({ autoAverage:     v }),

      getEffectiveAverage: (logs) => {
        const { autoAverage, fuelAverageKmL } = get();
        if (!autoAverage) return fuelAverageKmL;

        // Need consecutive fill-ups with odometer readings for the same vehicle
        const sorted = [...logs]
          .filter((l) => l.odometer != null)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (sorted.length < 2) return fuelAverageKmL;

        // Collect km/L segments between consecutive fill-ups
        const segments: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const distKm  = sorted[i].odometer! - sorted[i - 1].odometer!;
          const litres  = sorted[i].litres;
          if (distKm > 0 && litres > 0) segments.push(distKm / litres);
        }

        if (segments.length === 0) return fuelAverageKmL;
        const avg = segments.reduce((a, b) => a + b, 0) / segments.length;
        return Math.round(avg * 10) / 10; // 1 decimal place
      },

      estimateFuelCost: (distanceKm, logs) => {
        const { petrolPricePkrL, getEffectiveAverage } = get();
        const kmL = getEffectiveAverage(logs);
        return Math.round((distanceKm / kmL) * petrolPricePkrL);
      },
    }),
    { name: "sawari-vehicle-settings" }
  )
);
