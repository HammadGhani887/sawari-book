import { NextRequest, NextResponse } from "next/server";
import { expenses } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";
import type { Expense } from "@/lib/types";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const status    = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");

  // TODO: Connect to Prisma + MySQL here.
  let filtered = [...expenses];
  if (vehicleId) filtered = filtered.filter((e) => e.vehicleId === vehicleId);
  if (status)    filtered = filtered.filter((e) => e.status    === status);
  if (startDate) filtered = filtered.filter((e) => e.date >= startDate);
  if (endDate)   filtered = filtered.filter((e) => e.date <= endDate + "T23:59:59.999Z");

  return NextResponse.json(filtered.sort((a, b) => b.date.localeCompare(a.date)));
}

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.category || !body?.amount) {
    return badRequest("vehicleId, category, and amount are required");
  }

  // TODO: Connect to Prisma + MySQL here. prisma.expense.create({ data: body })
  const expense: Expense = {
    id:         `e${Date.now()}`,
    vehicleId:  body.vehicleId,
    loggedBy:   body.loggedBy ?? auth.userId,
    category:   body.category,
    amount:     Number(body.amount),
    note:       body.note,
    receiptUrl: body.receiptUrl,
    status:     auth.role === "owner" ? "approved" : "pending",
    date:       body.date ?? new Date().toISOString(),
  };
  expenses.unshift(expense);

  return NextResponse.json(expense, { status: 201 });
}
