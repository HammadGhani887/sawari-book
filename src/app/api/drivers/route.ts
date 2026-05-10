import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized } from "@/app/api/_lib/auth";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  if (auth.role === "owner") {
    // Owner: get all active driver assignments for their vehicles
    const assignments = await prisma.driverAssignment.findMany({
      where:   { ownerId: auth.userId, isActive: true },
      include: { driver: true },
      orderBy: { createdAt: "desc" },
    });

    const result = assignments.map((a) => ({
      id:           a.id,          // assignment id used as driverStore id
      userId:       a.driverId,
      name:         a.driver.name,
      phone:        a.driver.phone,
      cnic:         a.driver.cnic ?? undefined,
      photoUrl:     a.driver.photoUrl ?? undefined,
      isActive:     a.isActive,
      vehicleId:    a.vehicleId,
      salaryType:   a.salaryType.toLowerCase() as "fixed" | "percentage" | "hybrid",
      salaryAmount: Number(a.salaryAmount),
      startDate:    a.startDate.toISOString().slice(0, 10),
    }));

    return NextResponse.json(result);
  }

  if (auth.role === "driver") {
    // Driver: get their own active assignment
    const assignment = await prisma.driverAssignment.findFirst({
      where:   { driverId: auth.userId, isActive: true },
      include: { driver: true },
      orderBy: { createdAt: "desc" },
    });

    if (!assignment) {
      return NextResponse.json([]);
    }

    const result = [{
      id:           assignment.id,
      userId:       assignment.driverId,
      name:         assignment.driver.name,
      phone:        assignment.driver.phone,
      cnic:         assignment.driver.cnic ?? undefined,
      photoUrl:     assignment.driver.photoUrl ?? undefined,
      isActive:     assignment.isActive,
      vehicleId:    assignment.vehicleId,
      salaryType:   assignment.salaryType.toLowerCase() as "fixed" | "percentage" | "hybrid",
      salaryAmount: Number(assignment.salaryAmount),
      startDate:    assignment.startDate.toISOString().slice(0, 10),
    }];

    return NextResponse.json(result);
  }

  return NextResponse.json([]);
}
