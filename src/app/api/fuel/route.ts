import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    where.driverId = auth.userId;
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

  const log = await prisma.fuelLog.create({
    data: {
      vehicleId: body.vehicleId,
      driverId:  auth.userId,
      amountPkr: Number(body.amountPkr),
      litres:    Number(body.litres),
      odometer:  body.odometer ? Number(body.odometer) : null,
      pumpName:  body.pumpName ?? null,
      date:      body.date ? new Date(body.date) : new Date(),
    },
  });

  return NextResponse.json({
    id:        log.id,
    vehicleId: log.vehicleId,
    driverId:  log.driverId,
    amountPkr: Number(log.amountPkr),
    litres:    Number(log.litres),
    odometer:  log.odometer,
    pumpName:  log.pumpName,
    date:      log.date.toISOString(),
  }, { status: 201 });
}
