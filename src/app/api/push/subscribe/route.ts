import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return badRequest("Invalid subscription object");
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      userId: auth.userId,
      p256dh: body.keys.p256dh,
      auth:   body.keys.auth,
    },
    create: {
      userId:   auth.userId,
      endpoint: body.endpoint,
      p256dh:   body.keys.p256dh,
      auth:     body.keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}
