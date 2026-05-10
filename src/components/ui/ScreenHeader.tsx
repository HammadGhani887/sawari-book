"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useAuthStore } from "@/lib/store/authStore";

interface ScreenHeaderProps {
  title: string;
  titleUrdu?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  rightAction?: ReactNode;
}

export default function ScreenHeader({
  title,
  titleUrdu,
  showBack = false,
  showNotifications = false,
  rightAction,
}: ScreenHeaderProps) {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const role = useAuthStore((s) => s.user?.role);
  const notifUrl = role === "owner" ? "/notifications" : "/notifications";

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-brand-bg/80 backdrop-blur-md border-b border-slate-200/30">
      {/* Left: back button */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-elevated text-slate-700 hover:text-slate-900 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        )}
      </div>

      {/* Center: title */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <h1 className="text-base font-bold text-slate-900 leading-tight truncate px-2 text-center">
          {title}
        </h1>
        {titleUrdu && (
          <span
            className="text-[10px] text-slate-500 leading-tight font-[system-ui]"
            dir="rtl"
          >
            {titleUrdu}
          </span>
        )}
      </div>

      {/* Right: action slot or notifications */}
      <div className="w-10 flex justify-end">
        {rightAction ? (
          rightAction
        ) : showNotifications ? (
          <Link
            href={notifUrl}
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-brand-elevated text-slate-700 hover:text-slate-900 active:scale-95 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-red text-[10px] font-bold text-white ring-2 ring-brand-bg">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
