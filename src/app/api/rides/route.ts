import { NextRequest, NextResponse } from "next/server";
import { rides } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";
import type { Ride } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const vehicleId  = searchParams.get("vehicleId");
  const startDate  = searchParams.get("startDate");
  const endDate    = searchParams.get("endDate");
  const platform   = searchParams.get("platform");

  // TODO: Connect to Prisma + MySQL here. Build a WHERE clause from filters.
  let filtered = [...rides];
  if (vehicleId)  filtered = filtered.filter((r) => r.vehicleId === vehicleId);
  if (platform)   filtered = filtered.filter((r) => r.platform  === platform);
  if (startDate)  filtered = filtered.filter((r) => r.rideTime >= startDate);
  if (endDate)    filtered = filtered.filter((r) => r.rideTime <= endDate + "T23:59:59.999Z");

  return NextResponse.json(filtered.sort((a, b) => b.rideTime.localeCompare(a.rideTime)));
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.platform || !body?.fareAmount) {
    return badRequest("vehicleId, platform, and fareAmount are required");
  }

  // TODO: Connect to Prisma + MySQL here. prisma.ride.create({ data: body })
  const ride: Ride = {
    id:          `r${Date.now()}`,
    vehicleId:   body.vehicleId,
    driverId:    body.driverId ?? auth.userId,
    platform:    body.platform,
    fareAmount:  Number(body.fareAmount),
    paymentType: body.paymentType ?? "cash",
    pickupArea:  body.pickupArea,
    dropoffArea: body.dropoffArea,
    isDisputed:  false,
    rideTime:    body.rideTime ?? new Date().toISOString(),
    loggedAt:    new Date().toISOString(),
  };
  rides.unshift(ride);

  return NextResponse.json(ride, { status: 201 });
}
