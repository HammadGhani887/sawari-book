"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useRideStore } from "@/lib/store/rideStore";
import type { Ride } from "@/lib/types";

const QUEUE_KEY = "sawari-offline-ride-queue";

type PendingRide = Omit<Ride, "id" | "loggedAt">;

export function saveRideOffline(ride: PendingRide) {
  const existing: PendingRide[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  existing.push(ride);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
}

export function useOfflineSync() {
  const addRide  = useRideStore((s) => s.addRide);
  const syncing  = useRef(false);

  useEffect(() => {
    function sync() {
      if (syncing.current || !navigator.onLine) return;
      const queue: PendingRide[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
      if (queue.length === 0) return;

      syncing.current = true;
      queue.forEach((ride) => addRide(ride));
      localStorage.removeItem(QUEUE_KEY);
      syncing.current = false;
      toast.success(`Synced ${queue.length} offline ride${queue.length > 1 ? "s" : ""} ✓`);
    }

    window.addEventListener("online", sync);
    sync(); // attempt sync on mount if already online
    return () => window.removeEventListener("online", sync);
  }, [addRide]);
}
