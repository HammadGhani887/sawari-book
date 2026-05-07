"use client";

import { useOfflineSync } from "@/hooks/useOfflineQueue";

export default function OfflineSyncProvider() {
  useOfflineSync();
  return null;
}
