import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (auth.role === "driver") {
    // Driver: see all logs for their assigned vehicle
    const assignment = await prisma.driverAssignment.findFirst({
      where: { driverId: auth.userId, isActive: true },
      select: { vehicleId: true }
    });
    if (assignment?.vehicleId) {
      where.vehicleId = assignment.vehicleId;
    } else {
      where.driverId = auth.userId; // Fallback
    }
  } else {
    // Owner filter: only logs for vehicles owned by this user
    where.vehicle = { ownerId: auth.userId };
    if (vehicleId) where.vehicleId = vehicleId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate)   where.date.lte = new Date(endDate + "T23:59:59.999Z");
  }

  const logs = await prisma.fuelLog.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = logs.map((f: any) => ({
    id:        f.id,
    vehicleId: f.vehicleId,
    driverId:  f.driverId,
    amountPkr: Number(f.amountPkr),
    litres:    Number(f.litres),
    odometer:  f.odometer,
    pumpName:  f.pumpName,
    receiptUrl: f.receiptUrl,
    date:      f.date.toISOString(),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.amountPkr || !body?.litres) {
    return badRequest("vehicleId, amountPkr, and litres are required");
  }

  // Security Check: Does user have access to this vehicle?
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: body.vehicleId },
    select: { ownerId: true, id: true }
  });

  if (!vehicle) return badRequest("Vehicle not found");

  if (auth.role === "owner") {
    if (vehicle.ownerId !== auth.userId) return unauthorized();
  } else {
    // Driver: check if this is their assigned vehicle
    const assignment = await prisma.driverAssignment.findFirst({
      where: { driverId: auth.userId, isActive: true },
      select: { vehicleId: true }
    });
    if (assignment?.vehicleId !== body.vehicleId) return unauthorized();
  }

  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

  let log;
  let replayed = false;

  if (idempotencyKey) {
    const scope = "fuel_create";
    const txResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        const existingLog = await tx.fuelLog.findUnique({ where: { id: existing.resourceId } });
        if (existingLog) {
          return { log: existingLog, replayed: true };
        }
      }

      const createdLog = await tx.fuelLog.create({
        data: {
          vehicleId: body.vehicleId,
          driverId: auth.userId,
          amountPkr: Number(body.amountPkr),
          litres: Number(body.litres),
          odometer: body.odometer ? Number(body.odometer) : null,
          pumpName: body.pumpName ?? null,
          receiptUrl: body.receiptUrl ?? null,
          date: body.date ? new Date(body.date) : new Date(),
        },
      });

      await tx.idempotencyKey.create({
        data: {
          userId: auth.userId,
          scope,
          key: idempotencyKey,
          resourceId: createdLog.id,
        },
      });

      return { log: createdLog, replayed: false };
    }, { timeout: 20000 });
    log = txResult.log;
    replayed = txResult.replayed;
  } else {
    log = await prisma.fuelLog.create({
      data: {
        vehicleId: body.vehicleId,
        driverId: auth.userId,
        amountPkr: Number(body.amountPkr),
        litres: Number(body.litres),
        odometer: body.odometer ? Number(body.odometer) : null,
        pumpName: body.pumpName ?? null,
        receiptUrl: body.receiptUrl ?? null,
        date: body.date ? new Date(body.date) : new Date(),
      },
    });
  }

  return NextResponse.json({
    id:        log.id,
    vehicleId: log.vehicleId,
    driverId:  log.driverId,
    amountPkr: Number(log.amountPkr),
    litres:    Number(log.litres),
    odometer:  log.odometer,
    pumpName:  log.pumpName,
    receiptUrl: log.receiptUrl,
    date:      log.date.toISOString(),
    idempotentReplay: replayed,
  }, { status: replayed ? 200 : 201 });
}
