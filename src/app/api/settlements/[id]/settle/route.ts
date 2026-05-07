import { NextRequest, NextResponse } from "next/server";
import { settlements } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, notFound } from "@/app/api/_lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const idx = settlements.findIndex((s) => s.id === params.id);
  if (idx === -1) return notFound("Settlement");

  // TODO: Connect to Prisma + MySQL here. prisma.settlement.update({ where: { id }, data: { status: "settled", settledAt: new Date() } })
  settlements[idx] = {
    ...settlements[idx],
    status:    "settled",
    settledAt: new Date().toISOString(),
  };

  return NextResponse.json(settlements[idx]);
}
