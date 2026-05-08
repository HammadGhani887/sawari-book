import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "@/lib/types";

interface NotificationState {
  notifications: Notification[];
  addNotification: (data: Omit<Notification, "id" | "createdAt" | "isRead">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (data) =>
        set((s) => ({
          notifications: [
            {
              ...data,
              id: `n${Date.now()}`,
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ],
        })),

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
