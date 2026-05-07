"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import type { UserRole } from "@/lib/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { ready } = useAuth(requiredRole);

  if (!ready) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
