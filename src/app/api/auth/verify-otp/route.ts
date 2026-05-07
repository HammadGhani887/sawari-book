import { NextRequest, NextResponse } from "next/server";
import { users } from "@/app/api/_data/mockData";
import { badRequest } from "@/app/api/_lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.phone || !body?.otp) return badRequest("phone and otp are required");

  const otp = String(body.otp).replace(/\D/g, "");
  if (otp.length !== 6) return badRequest("OTP must be 6 digits");

  // TODO: Connect to Prisma + MySQL here. Look up OTP from DB, verify expiry, delete after use.
  // Mock: any 6-digit OTP is valid.

  const phone = String(body.phone).replace(/\D/g, "");
  const user = users.find((u) => u.phone === phone);

  if (!user) {
    // Auto-create user in mock (real implementation would require registration flow).
    const newUser = {
      id:        String(Date.now()),
      phone,
      name:      "New User",
      role:      "owner" as const,
      language:  "en" as const,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    const token = `owner-mock-jwt-${newUser.id}`;
    return NextResponse.json({ token, user: newUser });
  }

  const prefix = user.role === "driver" ? "driver" : "owner";
  const token  = `${prefix}-mock-jwt-${user.id}`;

  return NextResponse.json({ token, user });
}
