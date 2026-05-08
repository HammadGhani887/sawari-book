"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

// Legacy route — role is now chosen at registration.
// Redirect based on current user's role.
export default function RoleSelectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role === "owner") router.replace("/dashboard");
    else if (user?.role === "driver") router.replace("/home");
    else router.replace("/login");
  }, [user, router]);

  return null;
}
