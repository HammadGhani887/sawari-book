import { NextRequest, NextResponse } from "next/server";
import { fuelLogs } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";
import type { FuelLog } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");

  // TODO: Connect to Prisma + MySQL here.
  let filtered = [...fuelLogs];
  if (vehicleId) filtered = filtered.filter((f) => f.vehicleId === vehicleId);
  if (startDate) filtered = filtered.filter((f) => f.date >= startDate);
  if (endDate)   filtered = filtered.filter((f) => f.date <= endDate + "T23:59:59.999Z");

  return NextResponse.json(filtered.sort((a, b) => b.date.localeCompare(a.date)));
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.amountPkr || !body?.litres) {
    return badRequest("vehicleId, amountPkr, and litres are required");
  }

  // TODO: Connect to Prisma + MySQL here. prisma.fuelLog.create({ data: body })
  const log: FuelLog = {
    id:        `f${Date.now()}`,
    vehicleId: body.vehicleId,
    driverId:  body.driverId ?? auth.userId,
    amountPkr: Number(body.amountPkr),
    litres:    Number(body.litres),
    odometer:  body.odometer ? Number(body.odometer) : undefined,
    pumpName:  body.pumpName,
    date:      body.date ?? new Date().toISOString(),
  };
  fuelLogs.unshift(log);

  return NextResponse.json(log, { status: 201 });
}
