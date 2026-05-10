import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/invites/[token] — fetch invite details (public, no auth needed)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const invite = await prisma.invite.findUnique({
    where: { token: params.token },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  if (invite.usedBy) {
    return NextResponse.json({ error: "Invite already used", usedBy: invite.usedBy }, { status: 409 });
  }

  return NextResponse.json({
    ok:          true,
    token:       invite.token,
    ownerName:   invite.ownerName,
    vehicleName: invite.vehicleName,
    vehicleId:   invite.vehicleId,
    ownerId:     invite.ownerId,
    expiresAt:   invite.expiresAt.toISOString(),
  });
}

// PATCH /api/invites/[token] — mark invite as used (called after driver registers)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body?.usedBy) {
    return NextResponse.json({ error: "usedBy (driverId) is required" }, { status: 400 });
  }

  const invite = await prisma.invite.findUnique({ where: { token: params.token } });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.usedBy) {
    return NextResponse.json({ error: "Invite already used" }, { status: 409 });
  }

  await prisma.invite.update({
    where: { token: params.token },
    data:  { usedBy: body.usedBy },
  });

  return NextResponse.json({ ok: true });
}
