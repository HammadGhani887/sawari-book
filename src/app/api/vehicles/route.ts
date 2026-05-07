import { NextRequest, NextResponse } from "next/server";
import { vehicles } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";
import type { Vehicle } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  // TODO: Connect to Prisma + MySQL here.
  // return prisma.vehicle.findMany({ where: { ownerId: auth.userId } })
  return NextResponse.json(vehicles.filter((v) => v.ownerId === "1"));
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.plateNumber || !body?.makeModel) {
    return badRequest("plateNumber and makeModel are required");
  }

  // TODO: Connect to Prisma + MySQL here.
  // return prisma.vehicle.create({ data: { ...body, ownerId: auth.userId } })
  const vehicle: Vehicle = {
    id:              `v${Date.now()}`,
    ownerId:         "1",
    plateNumber:     body.plateNumber,
    makeModel:       body.makeModel,
    fuelType:        body.fuelType ?? "petrol",
    platforms:       body.platforms ?? [],
    insuranceExpiry: body.insuranceExpiry,
    photoUrl:        body.photoUrl,
    isActive:        true,
  };
  vehicles.push(vehicle);

  return NextResponse.json(vehicle, { status: 201 });
}
