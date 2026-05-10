import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SalaryType } from "@/lib/types";
import { useAuthStore } from "@/lib/store/authStore";

export interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  cnic?: string;
  isActive: boolean;
  vehicleId: string | null;
  salaryType: SalaryType;
  salaryAmount: number;
  startDate: string;
  dailyTargetPkr?: number;   // owner sets daily revenue target for this driver
}

interface DriverState {
  drivers: DriverProfile[];
  setDrivers: (drivers: DriverProfile[]) => void;
  addDriver: (data: DriverProfile | Omit<DriverProfile, "id">) => void;
  updateDriver: (id: string, updates: Partial<DriverProfile>) => void;
  removeDriver: (id: string) => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      drivers: [],

      setDrivers: (drivers) => set({ drivers }),

      addDriver: (data) =>
        set((s) => ({
          drivers: [
            { ...data, id: "id" in data ? data.id : `temp-${Date.now()}` } as DriverProfile,
            ...s.drivers,
          ],
        })),

      updateDriver: (id, updates) =>
        set((s) => ({
          drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),

      removeDriver: (id) =>
        set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),
    }),
    { name: "sawari-drivers" }
  )
);

export function useCurrentDriver() {
  const drivers = useDriverStore((s) => s.drivers);
  const userId = useAuthStore((s) => s.user?.id);
  return drivers.find((d) => d.userId === userId) ?? null;
}
