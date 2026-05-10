import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "sawari-book-secret";

export interface AuthContext {
  userId: string;
  role: "owner" | "driver";
}

/**
 * Verifies the Bearer JWT from Authorization header.
 * Returns { userId, role } on success, null on failure.
 */
export function verifyAuth(req: NextRequest): AuthContext | null {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const role = decoded.role === "driver" ? "driver" : "owner";
    return { userId: decoded.userId, role };
  } catch {
    return null;
  }
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
