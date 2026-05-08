"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function InstallBanner() {
  const { showBanner, install, dismiss } = useInstallPrompt();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-fadeIn">
      <div className="bg-brand-surface border border-slate-200/50 rounded-2xl px-4 py-3 shadow-xl shadow-black/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-greenDim flex items-center justify-center shrink-0 text-xl">
          🚗
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">Install Sawari Book</p>
          <p className="text-xs text-slate-600 mt-0.5">For faster access, offline use</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-brand-elevated active:scale-95 transition-transform"
          >
            Later
          </button>
          <button
            onClick={install}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-accent-green active:scale-95 transition-transform"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
