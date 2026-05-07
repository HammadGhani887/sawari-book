"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/login"), 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg gap-4">
      <div className="w-20 h-20 rounded-3xl bg-accent-greenDim flex items-center justify-center animate-in zoom-in duration-500">
        <span className="text-5xl">🚗</span>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Sawari Book</h1>
        <p className="text-slate-500 text-sm mt-1" dir="rtl">سواری بُک</p>
      </div>
    </div>
  );
}
