"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import type { UserRole } from "@/lib/types";

export function useAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read after first render so Zustand has rehydrated from localStorage
    const { user, token } = useAuthStore.getState();

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "owner" ? "/dashboard" : "/home");
      return;
    }

    setReady(true);
  }, [router, requiredRole]);

  return { ready };
}
