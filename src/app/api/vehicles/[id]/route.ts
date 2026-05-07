import { NextRequest, NextResponse } from "next/server";
import { vehicles } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, notFound, badRequest } from "@/app/api/_lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  // TODO: Connect to Prisma + MySQL here. prisma.vehicle.findUnique({ where: { id: params.id } })
  const vehicle = vehicles.find((v) => v.id === params.id);
  if (!vehicle) return notFound("Vehicle");

  return NextResponse.json(vehicle);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const idx = vehicles.findIndex((v) => v.id === params.id);
  if (idx === -1) return notFound("Vehicle");

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Request body is required");

  // TODO: Connect to Prisma + MySQL here. prisma.vehicle.update({ where: { id: params.id }, data: body })
  vehicles[idx] = { ...vehicles[idx], ...body, id: params.id };

  return NextResponse.json(vehicles[idx]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const idx = vehicles.findIndex((v) => v.id === params.id);
  if (idx === -1) return notFound("Vehicle");

  // TODO: Connect to Prisma + MySQL here. prisma.vehicle.delete({ where: { id: params.id } })
  vehicles.splice(idx, 1);

  return new NextResponse(null, { status: 204 });
}
