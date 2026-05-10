"use client";

import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

export default function PushNotificationProvider() {
  usePushNotifications();
  return null;
}
