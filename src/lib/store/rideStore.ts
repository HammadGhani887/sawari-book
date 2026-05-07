import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Ride } from "@/lib/types";

export const TODAY = "2026-05-07";

const SEED: Ride[] = [
  // ── May 7 (8 rides) ──────────────────────────────────────────────────────────
  { id: "r1",  vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 850,  paymentType: "cash",   pickupArea: "Johar Town",         dropoffArea: "Gulberg",          isDisputed: false, rideTime: "2026-05-07T06:15:00.000Z", loggedAt: "2026-05-07T06:15:00.000Z" },
  { id: "r2",  vehicleId: "v1", driverId: "d1", platform: "yango",   fareAmount: 680,  paymentType: "wallet", pickupArea: "Cavalry",            dropoffArea: "DHA",              isDisputed: false, rideTime: "2026-05-07T07:20:00.000Z", loggedAt: "2026-05-07T07:20:00.000Z" },
  { id: "r3",  vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 720,  paymentType: "cash",   pickupArea: "Model Town",         dropoffArea: "Bahria Town",      isDisputed: false, rideTime: "2026-05-07T08:00:00.000Z", loggedAt: "2026-05-07T08:00:00.000Z" },
  { id: "r4",  vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 620,  paymentType: "cash",   pickupArea: "Liberty",            dropoffArea: "Johar Town",       isDisputed: false, rideTime: "2026-05-07T08:30:00.000Z", loggedAt: "2026-05-07T08:30:00.000Z" },
  { id: "r5",  vehicleId: "v2", driverId: "d2", platform: "yango",   fareAmount: 580,  paymentType: "wallet", pickupArea: "Gulberg",            dropoffArea: "Cavalry",          isDisputed: true,  rideTime: "2026-05-07T09:15:00.000Z", loggedAt: "2026-05-07T09:15:00.000Z" },
  { id: "r6",  vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 780,  paymentType: "cash",   pickupArea: "DHA",                dropoffArea: "Model Town",       isDisputed: false, rideTime: "2026-05-07T10:00:00.000Z", loggedAt: "2026-05-07T10:00:00.000Z" },
  { id: "r7",  vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 640,  paymentType: "wallet", pickupArea: "Johar Town",         dropoffArea: "Allama Iqbal Town",isDisputed: false, rideTime: "2026-05-07T10:45:00.000Z", loggedAt: "2026-05-07T10:45:00.000Z" },
  { id: "r8",  vehicleId: "v1", driverId: "d1", platform: "other",   fareAmount: 450,  paymentType: "cash",   pickupArea: "Bahria Town",        dropoffArea: "Liberty",          isDisputed: false, rideTime: "2026-05-07T11:30:00.000Z", loggedAt: "2026-05-07T11:30:00.000Z" },
  // ── May 6 (6 rides) ──────────────────────────────────────────────────────────
  { id: "r9",  vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 800,  paymentType: "cash",   pickupArea: "Gulberg",            dropoffArea: "DHA",              isDisputed: false, rideTime: "2026-05-06T08:00:00.000Z", loggedAt: "2026-05-06T08:00:00.000Z" },
  { id: "r10", vehicleId: "v1", driverId: "d1", platform: "yango",   fareAmount: 720,  paymentType: "wallet", pickupArea: "DHA",                dropoffArea: "Cavalry",          isDisputed: false, rideTime: "2026-05-06T09:00:00.000Z", loggedAt: "2026-05-06T09:00:00.000Z" },
  { id: "r11", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 650,  paymentType: "cash",   pickupArea: "Cavalry",            dropoffArea: "Model Town",       isDisputed: false, rideTime: "2026-05-06T10:00:00.000Z", loggedAt: "2026-05-06T10:00:00.000Z" },
  { id: "r12", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 880,  paymentType: "cash",   pickupArea: "Liberty",            dropoffArea: "Johar Town",       isDisputed: false, rideTime: "2026-05-06T11:00:00.000Z", loggedAt: "2026-05-06T11:00:00.000Z" },
  { id: "r13", vehicleId: "v2", driverId: "d2", platform: "yango",   fareAmount: 590,  paymentType: "wallet", pickupArea: "Bahria Town",        dropoffArea: "Gulberg",          isDisputed: false, rideTime: "2026-05-06T13:00:00.000Z", loggedAt: "2026-05-06T13:00:00.000Z" },
  { id: "r14", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 700,  paymentType: "cash",   pickupArea: "Johar Town",         dropoffArea: "Liberty",          isDisputed: false, rideTime: "2026-05-06T14:30:00.000Z", loggedAt: "2026-05-06T14:30:00.000Z" },
  // ── May 5 (5 rides) ──────────────────────────────────────────────────────────
  { id: "r15", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 760,  paymentType: "cash",   pickupArea: "Model Town",         dropoffArea: "Gulberg",          isDisputed: false, rideTime: "2026-05-05T08:30:00.000Z", loggedAt: "2026-05-05T08:30:00.000Z" },
  { id: "r16", vehicleId: "v1", driverId: "d1", platform: "yango",   fareAmount: 610,  paymentType: "wallet", pickupArea: "Gulberg",            dropoffArea: "DHA",              isDisputed: false, rideTime: "2026-05-05T09:30:00.000Z", loggedAt: "2026-05-05T09:30:00.000Z" },
  { id: "r17", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 830,  paymentType: "cash",   pickupArea: "DHA",                dropoffArea: "Johar Town",       isDisputed: false, rideTime: "2026-05-05T11:00:00.000Z", loggedAt: "2026-05-05T11:00:00.000Z" },
  { id: "r18", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 680,  paymentType: "cash",   pickupArea: "Cavalry",            dropoffArea: "Model Town",       isDisputed: false, rideTime: "2026-05-05T13:00:00.000Z", loggedAt: "2026-05-05T13:00:00.000Z" },
  { id: "r19", vehicleId: "v1", driverId: "d1", platform: "other",   fareAmount: 450,  paymentType: "cash",   pickupArea: "Liberty",            dropoffArea: "Bahria Town",      isDisputed: false, rideTime: "2026-05-05T15:00:00.000Z", loggedAt: "2026-05-05T15:00:00.000Z" },
  // ── May 4 (4 rides) ──────────────────────────────────────────────────────────
  { id: "r20", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 920,  paymentType: "cash",   pickupArea: "Gulberg",            dropoffArea: "DHA",              isDisputed: false, rideTime: "2026-05-04T09:00:00.000Z", loggedAt: "2026-05-04T09:00:00.000Z" },
  { id: "r21", vehicleId: "v2", driverId: "d2", platform: "yango",   fareAmount: 700,  paymentType: "wallet", pickupArea: "DHA",                dropoffArea: "Cavalry",          isDisputed: false, rideTime: "2026-05-04T10:30:00.000Z", loggedAt: "2026-05-04T10:30:00.000Z" },
  { id: "r22", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 550,  paymentType: "cash",   pickupArea: "Model Town",         dropoffArea: "Liberty",          isDisputed: false, rideTime: "2026-05-04T12:00:00.000Z", loggedAt: "2026-05-04T12:00:00.000Z" },
  { id: "r23", vehicleId: "v2", driverId: "d2", platform: "indrive", fareAmount: 480,  paymentType: "cash",   pickupArea: "Johar Town",         dropoffArea: "Allama Iqbal Town",isDisputed: false, rideTime: "2026-05-04T14:00:00.000Z", loggedAt: "2026-05-04T14:00:00.000Z" },
  // ── May 3 (2 rides) ──────────────────────────────────────────────────────────
  { id: "r24", vehicleId: "v1", driverId: "d1", platform: "indrive", fareAmount: 1100, paymentType: "cash",   pickupArea: "Cantt",              dropoffArea: "DHA",              isDisputed: false, rideTime: "2026-05-03T09:30:00.000Z", loggedAt: "2026-05-03T09:30:00.000Z" },
  { id: "r25", vehicleId: "v2", driverId: "d2", platform: "other",   fareAmount: 600,  paymentType: "cash",   pickupArea: "Gulberg",            dropoffArea: "Model Town",       isDisputed: false, rideTime: "2026-05-03T11:00:00.000Z", loggedAt: "2026-05-03T11:00:00.000Z" },
];

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
      rides: SEED,

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
