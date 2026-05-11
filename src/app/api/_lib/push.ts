import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let isPushConfigured = false;

function ensurePushConfigured() {
  if (isPushConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contactEmail = process.env.VAPID_CONTACT_EMAIL;

  if (!publicKey || !privateKey || !contactEmail) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Missing required push env vars. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_CONTACT_EMAIL."
      );
    }

    console.warn(
      "Push notifications are disabled in development. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_CONTACT_EMAIL to enable."
    );
    return false;
  }

  const subject = contactEmail.startsWith("mailto:") ? contactEmail : `mailto:${contactEmail}`;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  isPushConfigured = true;
  return true;
}

export async function sendPushNotification(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!ensurePushConfigured()) return;

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
