"use client";

import { useDataSync } from "@/lib/hooks/useDataSync";

/**
 * Mounts in owner/driver layouts.
 * Fetches rides, expenses, fuel from DB once on login
 * so all pages see real cross-device data.
 */
export default function DataSyncProvider({ children }: { children: React.ReactNode }) {
  useDataSync();
  return <>{children}</>;
}
