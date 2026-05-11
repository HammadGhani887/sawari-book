"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import api from "@/lib/services/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    async function subscribe() {
      try {
        if (!VAPID_PUBLIC_KEY) {
          if (process.env.NODE_ENV === "production") {
            console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY. Push notifications are disabled.");
          } else {
            console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set. Skipping push setup in development.");
          }
          return;
        }

        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.warn("Push notifications not supported");
          return;
        }

        // Register the push-specific service worker
        const registration = await navigator.serviceWorker.register("/push-sw.js");
        await navigator.serviceWorker.ready;
        
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Send to backend
        await api.post("/push/subscribe", subscription.toJSON());
      } catch (err) {
        console.error("Failed to subscribe to push notifications:", err);
      }
    }

    subscribe();
  }, [token]);
}
