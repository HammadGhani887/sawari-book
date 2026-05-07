import { NextRequest, NextResponse } from "next/server";
import { users, assignments } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";
import type { User, DriverAssignment } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  // TODO: Connect to Prisma + MySQL here.
  const drivers = users.filter((u) => u.role === "driver");
  const result = drivers.map((d) => ({
    ...d,
    assignment: assignments.find((a) => a.driverId === d.id) ?? null,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.phone || !body?.name) {
    return badRequest("phone and name are required");
  }

  // TODO: Connect to Prisma + MySQL here.
  const driver: User = {
    id:        `u${Date.now()}`,
    phone:     body.phone,
    name:      body.name,
    role:      "driver",
    language:  body.language ?? "ur",
    cnic:      body.cnic,
    createdAt: new Date().toISOString(),
  };
  users.push(driver);

  let assignment: DriverAssignment | null = null;
  if (body.vehicleId) {
    assignment = {
      id:           `a${Date.now()}`,
      driverId:     driver.id,
      vehicleId:    body.vehicleId,
      ownerId:      "1",
      salaryType:   body.salaryType  ?? "fixed",
      salaryAmount: body.salaryAmount ?? 0,
      startDate:    new Date().toISOString().slice(0, 10),
      isActive:     true,
    };
    assignments.push(assignment);
  }

  return NextResponse.json({ ...driver, assignment }, { status: 201 });
}
