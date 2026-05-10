import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, notFound } from "@/app/api/_lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();
  if (auth.role !== "owner") {
    return NextResponse.json({ error: "Only owners can flag rides" }, { status: 403 });
  }

  const ride = await prisma.ride.findUnique({ where: { id: params.id } });
  if (!ride) return notFound("Ride");

  const updated = await prisma.ride.update({
    where: { id: params.id },
    data:  { isDisputed: !ride.isDisputed },
  });

  return NextResponse.json({
    id:          updated.id,
    vehicleId:   updated.vehicleId,
    driverId:    updated.driverId,
    platform:    updated.platform.toLowerCase(),
    fareAmount:  Number(updated.fareAmount),
    paymentType: updated.paymentType.toLowerCase(),
    pickupArea:  updated.pickupArea,
    dropoffArea: updated.dropoffArea,
    isDisputed:  updated.isDisputed,
    rideTime:    updated.rideTime.toISOString(),
    loggedAt:    updated.loggedAt.toISOString(),
  });
}
