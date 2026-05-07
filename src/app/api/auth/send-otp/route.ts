import { NextRequest, NextResponse } from "next/server";
import { badRequest } from "@/app/api/_lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.phone) return badRequest("phone is required");

  const phone = String(body.phone).replace(/\D/g, "");
  if (phone.length < 10) return badRequest("Invalid phone number");

  // TODO: Connect to SMS gateway (Twilio / Jazz SMS API) + store OTP in Redis/DB with 5-min TTL.
  return NextResponse.json({ success: true, message: "OTP sent" });
}
