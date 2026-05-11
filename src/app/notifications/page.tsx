"use client";

import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useAuthStore } from "@/lib/store/authStore";
import type { Notification } from "@/lib/types";

function formatTimeAgo(createdAt: string): string {
  const now      = new Date();
  const created  = new Date(createdAt);
  const diffMs   = now.getTime() - created.getTime();
  const diffMin  = Math.floor(diffMs / 60000);
  const diffHr   = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHr / 24);

  if (diffMin < 1)   return "Just now";
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7)   return `${diffDay} days ago`;
  return created.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

function getGroup(createdAt: string): "today" | "yesterday" | "earlier" {
  const now      = new Date();
  const created  = new Date(createdAt);
  const diffDay  = Math.floor((now.getTime() - created.getTime()) / 86400000);
  if (diffDay < 1)  return "today";
  if (diffDay < 2)  return "yesterday";
  return "earlier";
}

const TYPE_ICON: Record<string, string> = {
  ride_logged:      "🚗",
  anomaly:          "⚠️",
  expense_pending:  "🧾",
  expense_approved: "✅",
  expense_rejected: "❌",
  settlement_ready: "💰",
};

function NotifRow({ notif, role, onPress }: { notif: Notification; role?: string; onPress: () => void }) {
  const router = useRouter();
  const isAmber = notif.type === "anomaly" || notif.type === "expense_pending" || notif.type === "expense_rejected";
  const icon    = TYPE_ICON[notif.type] ?? "🔔";
  const accentClass = role === "owner" ? (isAmber ? "bg-status-amber" : "bg-accent-green") : (isAmber ? "bg-status-amber" : "bg-accent-blue");
  const dimClass = role === "owner" ? (isAmber ? "bg-status-amberDim" : "bg-accent-greenDim") : (isAmber ? "bg-status-amberDim" : "bg-accent-blueDim");

  const handlePress = () => {
    onPress();
    const targetUrl = notif.data?.url;
    if (typeof targetUrl === "string") {
      router.push(targetUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      className={[
        "w-full flex items-start gap-3 py-3 px-4 rounded-xl mb-2 text-left active:opacity-70 transition-opacity",
        notif.isRead ? "opacity-60 bg-white" : dimClass,
      ].join(" ")}
    >
      <span className="text-xl leading-none shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{notif.title}</p>
        {notif.body && <p className="text-xs text-slate-600 mt-0.5">{notif.body}</p>}
        <p className="text-[10px] text-slate-400 mt-1">{formatTimeAgo(notif.createdAt)}</p>
      </div>
      
      <div className="flex flex-col items-end gap-2 shrink-0 self-center">
        {!notif.isRead && (
          <div className={`w-2 h-2 rounded-full ${accentClass}`} />
        )}
        {!!notif.data?.url && (
          <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${
            role === 'owner' 
              ? 'border-accent-green/30 text-accent-green bg-accent-green/5' 
              : 'border-accent-blue/30 text-accent-blue bg-accent-blue/5'
          }`}>
            VIEW
          </span>
        )}
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotificationStore();
  const role = useAuthStore((s) => s.user?.role);

  const groups: { label: string; key: string; items: Notification[] }[] = [
    { label: "Today",     key: "today",     items: notifications.filter((n) => getGroup(n.createdAt) === "today")     },
    { label: "Yesterday", key: "yesterday", items: notifications.filter((n) => getGroup(n.createdAt) === "yesterday") },
    { label: "Earlier",   key: "earlier",   items: notifications.filter((n) => getGroup(n.createdAt) === "earlier")   },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title="Notifications"
        titleUrdu="اطلاعات"
        showBack
        rightAction={
          unreadCount() > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className={`text-xs font-semibold active:opacity-70 transition-opacity ${role === 'owner' ? 'text-accent-green' : 'text-accent-blue'}`}
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="px-4 pt-3 pb-6">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-5xl opacity-20">🔔</span>
            <p className="text-center text-slate-500 text-sm">No notifications yet.</p>
            <p className="text-[11px] text-slate-400" dir="rtl">کوئی اطلاع نہیں</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key}>
              <p className="text-xs uppercase tracking-wider text-slate-500 mt-4 mb-2">{group.label}</p>
              {group.items.map((n) => (
                <NotifRow key={n.id} notif={n} role={role} onPress={() => markRead(n.id)} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
