import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ride } from "@/lib/types";

// Always use real today's date
export const TODAY = new Date().toISOString().slice(0, 10);

interface RideState {
  rides: Ride[];
  addRide: (ride: Omit<Ride, "id" | "loggedAt">) => void;
  flagRide: (id: string) => void;
  getRidesByVehicle: (vehicleId: string) => Ride[];
  getRidesByDate: (date: string) => Ride[];
  getTodayRides: () => Ride[];
}

export const useRideStore = create<RideState>()(
  persist(
    (set, get) => ({
      rides: [],

      addRide: (data) =>
        set((s) => ({
          rides: [
            {
              ...data,
              id: `r${Date.now()}`,
              loggedAt: new Date().toISOString(),
            },
            ...s.rides,
          ],
        })),

      flagRide: (id) =>
        set((s) => ({
          rides: s.rides.map((r) =>
            r.id === id ? { ...r, isDisputed: !r.isDisputed } : r
          ),
        })),

      getRidesByVehicle: (vehicleId) =>
        get().rides.filter((r) => r.vehicleId === vehicleId),

      getRidesByDate: (date) =>
        get().rides.filter((r) => r.rideTime.startsWith(date)),

      getTodayRides: () =>
        get().rides.filter((r) => r.rideTime.startsWith(TODAY)),
    }),
    { name: "sawari-rides" }
  )
);
