import { NextRequest, NextResponse } from "next/server";
import { rides } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, notFound } from "@/app/api/_lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const idx = rides.findIndex((r) => r.id === params.id);
  if (idx === -1) return notFound("Ride");

  // TODO: Connect to Prisma + MySQL here. prisma.ride.update({ where: { id }, data: { isDisputed: !ride.isDisputed } })
  rides[idx] = { ...rides[idx], isDisputed: !rides[idx].isDisputed };

  return NextResponse.json(rides[idx]);
}
