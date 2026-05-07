import { NextResponse } from "next/server";

// Redirect to specific auth endpoints.
export async function POST() {
  return NextResponse.json(
    { error: "Use /api/auth/send-otp or /api/auth/verify-otp" },
    { status: 404 }
  );
}
