import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";

function formatVehicle(v: {
  id: string; ownerId: string; plateNumber: string; makeModel: string;
  fuelType: string; platforms: unknown; insuranceExpiry: Date | null;
  photoUrl: string | null; isActive: boolean;
}, extra?: { fuelAverageKmL?: number; petrolPricePkrL?: number; tankCapacityLitres?: number }) {
  return {
    id:                 v.id,
    ownerId:            v.ownerId,
    plateNumber:        v.plateNumber,
    makeModel:          v.makeModel,
    fuelType:           v.fuelType.toLowerCase(),
    platforms:          v.platforms,
    insuranceExpiry:    v.insuranceExpiry?.toISOString().slice(0, 10) ?? undefined,
    photoUrl:           v.photoUrl ?? undefined,
    isActive:           v.isActive,
    fuelAverageKmL:     extra?.fuelAverageKmL,
    petrolPricePkrL:    extra?.petrolPricePkrL,
    tankCapacityLitres: extra?.tankCapacityLitres,
  };
}

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: auth.userId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json(vehicles.map((v: any) => formatVehicle(v)));
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();
  if (auth.role !== "owner") {
    return NextResponse.json({ error: "Only owners can add vehicles" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.plateNumber || !body?.makeModel) {
    return badRequest("plateNumber and makeModel are required");
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ownerId:         auth.userId,
      plateNumber:     body.plateNumber.toUpperCase(),
      makeModel:       body.makeModel,
      fuelType:        (body.fuelType ?? "petrol").toUpperCase(),
      platforms:       body.platforms ?? [],
      insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
      photoUrl:        body.photoUrl ?? null,
      isActive:        true,
    },
  });

  return NextResponse.json(
    formatVehicle(vehicle, {
      fuelAverageKmL:     body.fuelAverageKmL,
      petrolPricePkrL:    body.petrolPricePkrL,
      tankCapacityLitres: body.tankCapacityLitres,
    }),
    { status: 201 }
  );
}
