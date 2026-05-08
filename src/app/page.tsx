"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/authStore";

export default function SplashPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => {
      if (isAuthenticated && user) {
        router.replace(user.role === "owner" ? "/dashboard" : "/home");
      } else {
        router.replace("/login");
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg gap-4">
      <div className="w-24 h-24 rounded-3xl overflow-hidden animate-scaleIn shadow-xl">
        <Image
          src="/sawari-app.png"
          alt="Sawari Book"
          width={96}
          height={96}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Sawari Book</h1>
        <p className="text-slate-500 text-sm mt-1" dir="rtl">سواری بُک</p>
      </div>
    </div>
  );
}
