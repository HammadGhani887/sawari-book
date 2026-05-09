import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "sawari-book-secret";

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
      JWT_SECRET,
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
