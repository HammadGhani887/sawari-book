import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const DEV_FALLBACK_JWT_SECRET = "dev-only-insecure-jwt-secret";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }

  console.warn("JWT_SECRET is not set. Using an insecure development fallback secret.");
  return DEV_FALLBACK_JWT_SECRET;
}

export async function POST(req: NextRequest) {
  try {
    const { credential, password } = await req.json();

    if (!credential || !password) {
      return NextResponse.json({ error: "Credential and password required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: credential.trim() },
          { email: credential.trim() },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Incorrect phone/email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect phone/email or password" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role.toLowerCase() },
      getJwtSecret(),
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id:              user.id,
        name:            user.name,
        phone:           user.phone,
        email:           user.email,
        role:            user.role.toLowerCase(),
        cnic:            user.cnic,
        photoUrl:        user.photoUrl,
        licenseImageUrl: user.licenseImageUrl,
        language:        user.language.toLowerCase(),
        createdAt:       user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
