import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, notFound, badRequest } from "@/app/api/_lib/auth";

function formatVehicle(v: {
  id: string; ownerId: string; plateNumber: string; makeModel: string;
  fuelType: string; platforms: unknown; insuranceExpiry: Date | null;
  photoUrl: string | null; isActive: boolean;
}) {
  return {
    id:              v.id,
    ownerId:         v.ownerId,
    plateNumber:     v.plateNumber,
    makeModel:       v.makeModel,
    fuelType:        v.fuelType.toLowerCase(),
    platforms:       v.platforms,
    insuranceExpiry: v.insuranceExpiry?.toISOString().slice(0, 10) ?? undefined,
    photoUrl:        v.photoUrl ?? undefined,
    isActive:        v.isActive,
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
  });
  if (!vehicle) return notFound("Vehicle");

  // Drivers can only fetch vehicles they are assigned to
  if (auth.role === "driver") {
    const assignment = await prisma.driverAssignment.findFirst({
      where: { driverId: auth.userId, vehicleId: params.id, isActive: true },
    });
    if (!assignment) return notFound("Vehicle");
  } else if (auth.role === "owner" && vehicle.ownerId !== auth.userId) {
    return notFound("Vehicle");
  }

  return NextResponse.json(formatVehicle(vehicle));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const vehicle = await prisma.vehicle.findUnique({ where: { id: params.id } });
  if (!vehicle) return notFound("Vehicle");
  if (vehicle.ownerId !== auth.userId) return notFound("Vehicle");

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Request body is required");

  const updated = await prisma.vehicle.update({
    where: { id: params.id },
    data: {
      makeModel:       body.makeModel       ?? undefined,
      plateNumber:     body.plateNumber     ? body.plateNumber.toUpperCase() : undefined,
      fuelType:        body.fuelType        ? body.fuelType.toUpperCase()    : undefined,
      platforms:       body.platforms       ?? undefined,
      insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : undefined,
      photoUrl:        body.photoUrl        ?? undefined,
      isActive:        body.isActive        ?? undefined,
    },
  });

  return NextResponse.json(formatVehicle(updated));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const vehicle = await prisma.vehicle.findUnique({ where: { id: params.id } });
  if (!vehicle) return notFound("Vehicle");
  if (vehicle.ownerId !== auth.userId) return notFound("Vehicle");

  await prisma.vehicle.update({
    where: { id: params.id },
    data:  { isActive: false },
  });

  return new NextResponse(null, { status: 204 });
}
