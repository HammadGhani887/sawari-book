import { NextRequest, NextResponse } from "next/server";

export interface AuthContext {
  userId: string;
  role: "owner" | "driver";
}

/**
 * Extracts and validates the Bearer token from Authorization header.
 * TODO: Connect to real JWT verification (jsonwebtoken.verify) + Prisma user lookup.
 */
export function verifyAuth(req: NextRequest): AuthContext | null {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  // Mock: any non-empty token is valid. Decode role from prefix.
  // Real tokens will be JWTs signed with process.env.JWT_SECRET.
  if (token.startsWith("driver-")) return { userId: "2", role: "driver" };
  return { userId: "1", role: "owner" };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(entity = "Resource") {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
