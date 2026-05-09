import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET ?? "sawari-book-secret";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, password, role, cnic, photoUrl, licenseImageUrl } = body;

    if (!name || !password || !role) {
      return NextResponse.json({ error: "Name, password and role are required" }, { status: 400 });
    }
    if (!phone && !email) {
      return NextResponse.json({ error: "Phone or email required" }, { status: 400 });
    }

    // Check existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : {},
          email ? { email } : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Phone or email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone:           phone ?? "",
        email:           email ?? undefined,
        role:            role.toUpperCase() as "OWNER" | "DRIVER",
        cnic:            cnic ?? undefined,
        photoUrl:        photoUrl ?? undefined,
        licenseImageUrl: licenseImageUrl ?? undefined,
        passwordHash,
      },
    });

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
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
