"use client";

import { RotateCw } from "lucide-react";
import { useDataSync } from "@/lib/hooks/useDataSync";
import { useSyncStore } from "@/lib/store/syncStore";

export default function SyncHeaderAction() {
  const { performSync } = useDataSync();
  const isSyncing = useSyncStore((s) => s.isSyncing);

  return (
    <button
      onClick={() => performSync()}
      disabled={isSyncing}
      className={`flex items-center justify-center w-9 h-9 rounded-full bg-brand-elevated text-slate-700 hover:text-slate-900 active:scale-95 transition-all disabled:opacity-50`}
      title="Sync latest data"
    >
      <RotateCw size={18} className={isSyncing ? "animate-spin" : ""} />
    </button>
  );
}
