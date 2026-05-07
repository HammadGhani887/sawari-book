"use client";

import { ChevronRight } from "lucide-react";
import { ScreenHeader } from "@/components/ui";
import { useNotificationStore } from "@/lib/store/notificationStore";
import type { Notification } from "@/lib/types";

const TODAY_DATE = "2026-05-07";
const YESTERDAY  = "2026-05-06";

function getGroup(createdAt: string): "today" | "yesterday" | "earlier" {
  const date = createdAt.slice(0, 10);
  if (date === TODAY_DATE) return "today";
  if (date === YESTERDAY)  return "yesterday";
  return "earlier";
}

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  const group = getGroup(createdAt);
  if (group === "today") {
    const diffMs  = new Date(TODAY_DATE + "T23:59:59Z").getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60)  return `${diffMin} min ago`;
    return `${Math.floor(diffMin / 60)} hour${Math.floor(diffMin / 60) > 1 ? "s" : ""} ago`;
  }
  const time = date.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
  if (group === "yesterday") return `Yesterday ${time}`;
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short" }) + ` ${time}`;
}

function NotifRow({ notif, onPress }: { notif: Notification; onPress: () => void }) {
  const isAmber = notif.type === "anomaly";
  const bgClass = notif.isRead
    ? "opacity-60"
    : isAmber
    ? "bg-status-amberDim"
    : "bg-brand-surface/80";

  return (
    <button
      type="button"
      onClick={onPress}
      className={[
        "w-full flex items-center gap-3 py-3 px-4 rounded-xl mb-2 text-left active:opacity-70 transition-opacity",
        bgClass,
      ].join(" ")}
    >
      <div className="shrink-0 mt-0.5">
        {notif.isRead ? (
          <div className="w-2 h-2 rounded-full bg-transparent" />
        ) : (
          <div className={`w-2 h-2 rounded-full ${isAmber ? "bg-status-amber" : "bg-accent-green"}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white leading-snug">{notif.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatTime(notif.createdAt)}</p>
      </div>
      <ChevronRight size={14} className="shrink-0 text-slate-600" />
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
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount() === 0}
            className="text-xs text-slate-400 disabled:opacity-40 transition-opacity"
          >
            Mark all read
          </button>
        }
      />

      <div className="px-4 pt-3 pb-6">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="text-xs uppercase tracking-wider text-slate-500 mt-4 mb-2">{group.label}</p>
            {group.items.map((n) => (
              <NotifRow key={n.id} notif={n} onPress={() => markRead(n.id)} />
            ))}
          </div>
        ))}

        {notifications.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-12">No notifications.</p>
        )}
      </div>
    </div>
  );
}
