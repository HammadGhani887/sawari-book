"use client";

import { ScreenHeader } from "@/components/ui";
import { useNotificationStore } from "@/lib/store/notificationStore";
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
  settlement_ready: "💰",
};

function NotifRow({ notif, onPress }: { notif: Notification; onPress: () => void }) {
  const isAmber = notif.type === "anomaly" || notif.type === "expense_pending";
  const icon    = TYPE_ICON[notif.type] ?? "🔔";

  return (
    <button
      type="button"
      onClick={onPress}
      className={[
        "w-full flex items-start gap-3 py-3 px-4 rounded-xl mb-2 text-left active:opacity-70 transition-opacity",
        notif.isRead ? "opacity-60 bg-white" : isAmber ? "bg-status-amberDim" : "bg-accent-greenDim",
      ].join(" ")}
    >
      <span className="text-xl leading-none shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{notif.title}</p>
        {notif.body && <p className="text-xs text-slate-600 mt-0.5">{notif.body}</p>}
        <p className="text-[10px] text-slate-400 mt-1">{formatTimeAgo(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isAmber ? "bg-status-amber" : "bg-accent-green"}`} />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotificationStore();

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
        rightAction={
          unreadCount() > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-accent-green font-semibold active:opacity-70 transition-opacity"
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
                <NotifRow key={n.id} notif={n} onPress={() => markRead(n.id)} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
