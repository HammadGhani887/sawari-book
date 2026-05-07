import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SalaryType } from "@/lib/types";

export interface DriverProfile {
  id: string;         // "d1" — matches rides.driverId
  userId: string;     // links to authStore.user.id
  name: string;
  phone: string;
  cnic?: string;
  isActive: boolean;
  vehicleId: string | null;
  salaryType: SalaryType;
  salaryAmount: number;
  startDate: string;
}

const SEED: DriverProfile[] = [
  {
    id: "d1",
    userId: "2",
    name: "Ahmed Khan",
    phone: "0301-1234567",
    cnic: "35201-1234567-1",
    isActive: true,
    vehicleId: "v1",
    salaryType: "fixed",
    salaryAmount: 25000,
    startDate: "2026-01-15",
  },
  {
    id: "d2",
    userId: "",
    name: "Farhan Ali",
    phone: "0300-9876543",
    cnic: "35202-7654321-3",
    isActive: true,
    vehicleId: "v2",
    salaryType: "fixed",
    salaryAmount: 22000,
    startDate: "2026-02-01",
  },
  {
    id: "d3",
    userId: "",
    name: "Bilal Ahmed",
    phone: "0312-5554444",
    isActive: false,
    vehicleId: null,
    salaryType: "fixed",
    salaryAmount: 0,
    startDate: "2026-03-01",
  },
];

interface DriverState {
  drivers: DriverProfile[];
  addDriver: (data: Omit<DriverProfile, "id">) => void;
  updateDriver: (id: string, updates: Partial<DriverProfile>) => void;
  removeDriver: (id: string) => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      drivers: SEED,

      addDriver: (data) =>
        set((s) => ({
          drivers: [{ ...data, id: `d${Date.now()}` }, ...s.drivers],
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
  // In production, look up by authStore user.id. Hardcoded to d1 (Ahmed) for mock.
  return drivers.find((d) => d.id === "d1") ?? null;
}
