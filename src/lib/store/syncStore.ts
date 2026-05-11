import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SyncState {
  isSyncing: boolean;
  lastSynced: string | null;
  setSyncing: (val: boolean) => void;
  setLastSynced: (val: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isSyncing: false,
      lastSynced: null,
      setSyncing: (val) => set({ isSyncing: val }),
      setLastSynced: (val) => set({ lastSynced: val }),
    }),
    { name: "sync-store" }
  )
);
