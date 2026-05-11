import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const driverId  = searchParams.get("driverId");
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");
  const platform  = searchParams.get("platform");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Owner sees rides for their vehicles; driver sees only their own rides
  if (auth.role === "driver") {
    where.driverId = auth.userId;
  } else {
    // Owner filter: only rides for vehicles owned by this user
    where.vehicle = { ownerId: auth.userId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId)  where.driverId  = driverId;
  }

  if (platform)  where.platform = platform.toUpperCase();
  if (startDate || endDate) {
    where.rideTime = {};
    if (startDate) where.rideTime.gte = new Date(startDate);
    if (endDate)   where.rideTime.lte = new Date(endDate + "T23:59:59.999Z");
  }

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { rideTime: "desc" },
  });

  // Normalize to frontend shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = rides.map((r: any) => ({
    id:                r.id,
    vehicleId:         r.vehicleId,
    driverId:          r.driverId,
    platform:          r.platform.toLowerCase(),
    fareAmount:        Number(r.fareAmount),
    paymentType:       r.paymentType.toLowerCase(),
    pickupArea:        r.pickupArea,
    dropoffArea:       r.dropoffArea,
    distanceKm:        r.distanceKm ? Number(r.distanceKm) : undefined,
    estimatedFuelCost: r.estimatedFuelCost ? Number(r.estimatedFuelCost) : undefined,
    boostCost:         r.boostCost ? Number(r.boostCost) : undefined,
    isDisputed:        r.isDisputed,
    rideTime:          r.rideTime.toISOString(),
    loggedAt:          r.loggedAt.toISOString(),
  }));

  return NextResponse.json(result);
}

import { sendPushNotification } from "@/app/api/_lib/push";

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.platform || !body?.fareAmount) {
    return badRequest("vehicleId, platform, and fareAmount are required");
  }
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ride: any;
  let replayed = false;

  if (idempotencyKey) {
    const scope = "ride_create";
    const txResult = await prisma.$transaction(async (tx: any) => {
      const existing = await tx.idempotencyKey.findUnique({
        where: {
          userId_scope_key: {
            userId: auth.userId,
            scope,
            key: idempotencyKey,
          },
        },
      });

      if (existing?.resourceId) {
        const existingRide = await tx.ride.findUnique({
          where: { id: existing.resourceId },
          include: { vehicle: true, driver: true },
        });
        if (existingRide) {
          return { ride: existingRide, replayed: true };
        }
      }

      const createdRide = await tx.ride.create({
        data: {
          vehicleId: body.vehicleId,
          driverId: auth.userId,
          platform: body.platform.toUpperCase(),
          fareAmount: Number(body.fareAmount),
          paymentType: (body.paymentType ?? "cash").toUpperCase(),
          pickupArea: body.pickupArea ?? null,
          dropoffArea: body.dropoffArea ?? null,
          distanceKm: body.distanceKm ? Number(body.distanceKm) : null,
          estimatedFuelCost: body.estimatedFuelCost ? Number(body.estimatedFuelCost) : null,
          boostCost: body.boostCost ? Number(body.boostCost) : null,
          isDisputed: false,
          rideTime: body.rideTime ? new Date(body.rideTime) : new Date(),
        },
        include: { vehicle: true, driver: true },
      });

      await tx.idempotencyKey.create({
        data: {
          userId: auth.userId,
          scope,
          key: idempotencyKey,
          resourceId: createdRide.id,
        },
      });

      return { ride: createdRide, replayed: false };
    });
    ride = txResult.ride;
    replayed = txResult.replayed;
  } else {
    ride = await prisma.ride.create({
      data: {
        vehicleId:          body.vehicleId,
        driverId:           auth.userId,
        platform:           body.platform.toUpperCase(),
        fareAmount:         Number(body.fareAmount),
        paymentType:        (body.paymentType ?? "cash").toUpperCase(),
        pickupArea:         body.pickupArea  ?? null,
        dropoffArea:        body.dropoffArea ?? null,
        distanceKm:         body.distanceKm ? Number(body.distanceKm) : null,
        estimatedFuelCost:  body.estimatedFuelCost ? Number(body.estimatedFuelCost) : null,
        boostCost:          body.boostCost ? Number(body.boostCost) : null,
        isDisputed:         false,
        rideTime:           body.rideTime ? new Date(body.rideTime) : new Date(),
      },
      include: {
        vehicle: true,
        driver: true,
      }
    });
  }

  // Notify owner
  if (!replayed) {
    try {
      const title = "New Ride Logged";
      const body = `${ride.driver.name} logged ₨${Number(ride.fareAmount).toLocaleString()} on ${ride.platform.toLowerCase()}`;
      
      await prisma.notification.create({
        data: {
          userId: ride.vehicle.ownerId,
          type:   "ride_logged",
          title,
          body,
        }
      });

      // Send Push Notification
      await sendPushNotification(ride.vehicle.ownerId, { title, body });
    } catch (err) {
      console.error("Failed to notify owner:", err);
    }
  }

  return NextResponse.json({
    id:                ride.id,
    vehicleId:         ride.vehicleId,
    driverId:          ride.driverId,
    platform:          ride.platform.toLowerCase(),
    fareAmount:        Number(ride.fareAmount),
    paymentType:       ride.paymentType.toLowerCase(),
    pickupArea:        ride.pickupArea,
    dropoffArea:       ride.dropoffArea,
    distanceKm:        ride.distanceKm ? Number(ride.distanceKm) : undefined,
    estimatedFuelCost: ride.estimatedFuelCost ? Number(ride.estimatedFuelCost) : undefined,
    boostCost:         ride.boostCost ? Number(ride.boostCost) : undefined,
    isDisputed:        ride.isDisputed,
    rideTime:          ride.rideTime.toISOString(),
    loggedAt:          ride.loggedAt.toISOString(),
    idempotentReplay:  replayed,
  }, { status: replayed ? 200 : 201 });
}
