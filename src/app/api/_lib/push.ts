import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// VAPID keys should be in .env in production
const vapidKeys = {
  publicKey:  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BMY945ngvLEE-ks729gQiPDxIFCo1YYK1ciPnw8cpRUQBYnGq6CJHofh4T_ffHDhkwWzEHkHMvoD0CXi4R9A5cE",
  privateKey: process.env.VAPID_PRIVATE_KEY || "zPWtr-MddgXbkt7t18BjaspXOPM90zDApl5fRa6JoJ4",
};

webpush.setVapidDetails(
  "mailto:hammadghani887@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function sendPushNotification(userId: string, payload: { title: string; body: string; url?: string }) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const sendPromises = subscriptions.map(async (sub: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth:   sub.auth,
          },
        },
        JSON.stringify(payload)
      );
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription has expired or is no longer valid
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error("Error sending push notification:", error);
      }
    }
  });

  await Promise.all(sendPromises);
}
