import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "@/lib/types";

const SEED: Notification[] = [
  // ── Unread — today ────────────────────────────────────────────────────────────
  { id: "n1", userId: "1", type: "ride_logged",      title: "Ahmed logged a ride — ₨850 on inDrive",           body: "Johar Town → Gulberg",              isRead: false, createdAt: "2026-05-07T11:20:00.000Z" },
  { id: "n2", userId: "1", type: "anomaly",           title: "⚠️ LEA-1234: Only 5 rides today vs average 8",    body: "Ahmed may need to start earlier",   isRead: false, createdAt: "2026-05-07T10:00:00.000Z" },
  { id: "n3", userId: "1", type: "expense_pending",   title: "Expense pending: Fuel ₨1,500",                    body: "Ahmed Khan · v1 · needs approval",  isRead: false, createdAt: "2026-05-07T07:05:00.000Z" },
  // ── Read — yesterday ─────────────────────────────────────────────────────────
  { id: "n4", userId: "1", type: "expense_approved",  title: "Fuel: ₨1,200 at Total Parco approved",            body: "Farhan Ali · v2",                   isRead: true,  createdAt: "2026-05-06T18:30:00.000Z" },
  { id: "n5", userId: "1", type: "settlement_ready",  title: "Settlement ready for April",                      body: "Ahmed Khan · ₨89,600 owner profit", isRead: true,  createdAt: "2026-05-06T09:00:00.000Z" },
  // ── Read — earlier ───────────────────────────────────────────────────────────
  { id: "n6", userId: "1", type: "ride_logged",       title: "Farhan logged 6 rides — ₨4,340 total",           body: "Tuesday 6 May",                     isRead: true,  createdAt: "2026-05-05T20:00:00.000Z" },
  { id: "n7", userId: "1", type: "anomaly",           title: "⚠️ LEB-5678: Revenue below daily target",         body: "₨3,330 vs ₨5,000 target",           isRead: true,  createdAt: "2026-05-04T21:00:00.000Z" },
  { id: "n8", userId: "1", type: "expense_approved",  title: "Insurance renewal ₨15,000 approved",              body: "Suzuki Alto · LEA-1234",            isRead: true,  createdAt: "2026-05-03T10:05:00.000Z" },
];

interface NotificationState {
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: SEED,

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
    }),
    { name: "sawari-notifications" }
  )
);
