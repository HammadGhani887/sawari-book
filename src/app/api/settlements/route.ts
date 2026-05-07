import { NextRequest, NextResponse } from "next/server";
import { settlements, rides, expenses } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";
import type { Settlement } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const driverId  = searchParams.get("driverId");

  // TODO: Connect to Prisma + MySQL here.
  let filtered = [...settlements];
  if (vehicleId) filtered = filtered.filter((s) => s.vehicleId === vehicleId);
  if (driverId)  filtered = filtered.filter((s) => s.driverId  === driverId);

  return NextResponse.json(filtered.sort((a, b) => b.periodStart.localeCompare(a.periodStart)));
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.driverId || !body?.periodStart || !body?.periodEnd) {
    return badRequest("vehicleId, driverId, periodStart, and periodEnd are required");
  }

  // TODO: Connect to Prisma + MySQL here. Query rides + expenses for period, compute totals.
  const periodRides    = rides.filter((r) => r.vehicleId === body.vehicleId && r.rideTime >= body.periodStart && r.rideTime <= body.periodEnd + "T23:59:59.999Z");
  const periodExpenses = expenses.filter((e) => e.vehicleId === body.vehicleId && e.status === "approved" && e.date >= body.periodStart && e.date <= body.periodEnd + "T23:59:59.999Z");

  const totalRevenue   = periodRides.reduce((s, r) => s + r.fareAmount, 0);
  const totalExpenses  = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const driverSalary   = Number(body.driverSalary ?? 25000);
  const ownerProfit    = totalRevenue - totalExpenses - driverSalary;

  const existing = settlements.find((s) => s.vehicleId === body.vehicleId && s.periodStart === body.periodStart);
  if (existing) {
    Object.assign(existing, { totalRevenue, totalExpenses, driverSalary, ownerProfit });
    return NextResponse.json(existing);
  }

  const settlement: Settlement = {
    id:            `s${Date.now()}`,
    ownerId:       "1",
    driverId:      body.driverId,
    vehicleId:     body.vehicleId,
    periodStart:   body.periodStart,
    periodEnd:     body.periodEnd,
    totalRevenue,
    totalExpenses,
    driverSalary,
    ownerProfit,
    status:        "pending",
  };
  settlements.push(settlement);

  return NextResponse.json(settlement, { status: 201 });
}
