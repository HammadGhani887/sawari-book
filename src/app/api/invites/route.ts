import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest } from "@/app/api/_lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "sawari-book-secret";

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// POST /api/invites — owner creates an invite for a vehicle
export async function POST(req: NextRequest) {
  // Verify JWT from Authorization header
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return unauthorized();
  const rawToken = header.slice(7).trim();

  let userId: string;
  try {
    const decoded = jwt.verify(rawToken, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== "owner") {
      return NextResponse.json({ error: "Only owners can create invites" }, { status: 403 });
    }
    userId = decoded.userId;
  } catch {
    return unauthorized();
  }

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId) return badRequest("vehicleId is required");

  // Verify vehicle belongs to this owner
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: body.vehicleId, ownerId: userId },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found or not yours" }, { status: 404 });
  }

  const owner = await prisma.user.findUnique({ where: { id: userId } });
  if (!owner) return unauthorized();

  // Expire in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = generateToken();

  const invite = await prisma.invite.create({
    data: {
      token,
      ownerId:       userId,
      ownerName:     owner.name,
      vehicleId:     body.vehicleId,
      vehicleName:   `${vehicle.makeModel} · ${vehicle.plateNumber}`,
      salaryType:    body.salaryType ? body.salaryType.toUpperCase() : null,
      salaryAmount:  body.salaryAmount ? Number(body.salaryAmount)  : null,
      hybridBase:    body.hybridBase   ? Number(body.hybridBase)    : null,
      hybridPercent: body.hybridPercent ? Number(body.hybridPercent) : null,
      expiresAt,
    },
  });

  return NextResponse.json({ ok: true, token: invite.token });
}
