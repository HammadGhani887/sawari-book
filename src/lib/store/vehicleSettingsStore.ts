import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FuelLog } from "@/lib/types";

export interface VehicleSettings {
  fuelAverageKmL:  number;
  petrolPricePkrL: number;
  autoAverage:     boolean;
  tankCapacityL:   number | null; // optional tank size in litres
}

const DEFAULT_SETTINGS: VehicleSettings = {
  fuelAverageKmL:  12.0,
  petrolPricePkrL: 280,
  autoAverage:     true,
  tankCapacityL:   null,
};

interface VehicleSettingsState {
  // per-vehicle settings keyed by vehicleId
  byVehicle: Record<string, VehicleSettings>;

  // get settings for a vehicle (falls back to defaults)
  getSettings: (vehicleId: string) => VehicleSettings;

  // update one or more fields for a vehicle
  updateSettings: (vehicleId: string, patch: Partial<VehicleSettings>) => void;

  // Returns actual km/L from odometer-bearing fill-up logs, or falls back to manual
  getEffectiveAverage: (vehicleId: string, logs: FuelLog[]) => number;

  // Estimate PKR fuel cost for a given distance
  estimateFuelCost: (vehicleId: string, distanceKm: number, logs: FuelLog[]) => number;

  // ── Legacy single-vehicle accessors (used by driver profile / owner settings) ──
  // These operate on a "current" vehicleId passed in, kept for backward compat
  fuelAverageKmL:  number;
  petrolPricePkrL: number;
  autoAverage:     boolean;
  setFuelAverage:  (v: number, vehicleId?: string)  => void;
  setPetrolPrice:  (v: number, vehicleId?: string)  => void;
  setAutoAverage:  (v: boolean, vehicleId?: string) => void;
}

export const useVehicleSettingsStore = create<VehicleSettingsState>()(
  persist(
    (set, get) => ({
      byVehicle: {},

      // global fallback values (used when no vehicleId is known)
      fuelAverageKmL:  DEFAULT_SETTINGS.fuelAverageKmL,
      petrolPricePkrL: DEFAULT_SETTINGS.petrolPricePkrL,
      autoAverage:     DEFAULT_SETTINGS.autoAverage,

      getSettings: (vehicleId) => {
        const stored = get().byVehicle[vehicleId];
        return stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };
      },

      updateSettings: (vehicleId, patch) => {
        set((s) => ({
          byVehicle: {
            ...s.byVehicle,
            [vehicleId]: { ...DEFAULT_SETTINGS, ...s.byVehicle[vehicleId], ...patch },
          },
          // also keep global fields in sync if no vehicleId context
          ...(patch.fuelAverageKmL  !== undefined ? { fuelAverageKmL:  patch.fuelAverageKmL  } : {}),
          ...(patch.petrolPricePkrL !== undefined ? { petrolPricePkrL: patch.petrolPricePkrL } : {}),
          ...(patch.autoAverage     !== undefined ? { autoAverage:     patch.autoAverage     } : {}),
        }));
      },

      getEffectiveAverage: (vehicleId, logs) => {
        const settings = get().getSettings(vehicleId);
        if (!settings.autoAverage) return settings.fuelAverageKmL;

        const safeLogs = logs ?? [];
        const vehicleLogs = safeLogs.filter((l) => l.vehicleId === vehicleId);
        const sorted = [...vehicleLogs]
          .filter((l) => l.odometer != null)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (sorted.length < 2) return settings.fuelAverageKmL;

        const segments: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
          const distKm = sorted[i].odometer! - sorted[i - 1].odometer!;
          const litres = sorted[i].litres;
          if (distKm > 0 && litres > 0) segments.push(distKm / litres);
        }

        if (segments.length === 0) return settings.fuelAverageKmL;
        const avg = segments.reduce((a, b) => a + b, 0) / segments.length;
        return Math.round(avg * 10) / 10;
      },

      estimateFuelCost: (vehicleId, distanceKm, logs) => {
        const settings = get().getSettings(vehicleId);
        const kmL = get().getEffectiveAverage(vehicleId, logs);
        return Math.round((distanceKm / kmL) * settings.petrolPricePkrL);
      },

      // ── Legacy setters (no vehicleId = update global defaults only) ──
      setFuelAverage: (v, vehicleId) => {
        set({ fuelAverageKmL: v });
        if (vehicleId) get().updateSettings(vehicleId, { fuelAverageKmL: v });
      },
      setPetrolPrice: (v, vehicleId) => {
        set({ petrolPricePkrL: v });
        if (vehicleId) get().updateSettings(vehicleId, { petrolPricePkrL: v });
      },
      setAutoAverage: (v, vehicleId) => {
        set({ autoAverage: v });
        if (vehicleId) get().updateSettings(vehicleId, { autoAverage: v });
      },
    }),
    { name: "sawari-vehicle-settings" }
  )
);
