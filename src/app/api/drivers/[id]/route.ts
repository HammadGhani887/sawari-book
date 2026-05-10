import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, notFound, badRequest } from "@/app/api/_lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  // Find the assignment
  const assignment = await prisma.driverAssignment.findUnique({
    where: { id: params.id },
  });

  if (!assignment) return notFound("Driver Assignment");

  // Only the owner of the vehicle/assignment can update it
  if (assignment.ownerId !== auth.userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("Request body is required");

  const updated = await prisma.driverAssignment.update({
    where: { id: params.id },
    data: {
      salaryType:     body.salaryType     ? body.salaryType.toUpperCase() : undefined,
      salaryAmount:   body.salaryAmount   !== undefined ? Number(body.salaryAmount)   : undefined,
      hybridBase:     body.hybridBase     !== undefined ? Number(body.hybridBase)     : undefined,
      hybridPercent:  body.hybridPercent  !== undefined ? Number(body.hybridPercent)  : undefined,
      dailyTargetPkr: body.dailyTargetPkr !== undefined ? (body.dailyTargetPkr ? Number(body.dailyTargetPkr) : null) : undefined,
      isActive:       body.isActive       ?? undefined,
    },
    include: { driver: true },
  });

  return NextResponse.json({
    id:             updated.id,
    userId:         updated.driverId,
    name:           updated.driver.name,
    phone:          updated.driver.phone,
    isActive:       updated.isActive,
    vehicleId:      updated.vehicleId,
    salaryType:     updated.salaryType.toLowerCase(),
    salaryAmount:   Number(updated.salaryAmount),
    dailyTargetPkr: updated.dailyTargetPkr ? Number(updated.dailyTargetPkr) : undefined,
    startDate:      updated.startDate.toISOString().slice(0, 10),
  });
}
