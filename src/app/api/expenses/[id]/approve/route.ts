import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, notFound } from "@/app/api/_lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();
  if (auth.role !== "owner") {
    return NextResponse.json({ error: "Only owners can approve expenses" }, { status: 403 });
  }

  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!expense) return notFound("Expense");

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data:  { status: "APPROVED" },
  });

  return NextResponse.json({
    id:         updated.id,
    vehicleId:  updated.vehicleId,
    loggedBy:   updated.loggedBy,
    category:   updated.category.toLowerCase(),
    amount:     Number(updated.amount),
    note:       updated.note,
    receiptUrl: updated.receiptUrl,
    status:     updated.status.toLowerCase(),
    date:       updated.date.toISOString(),
  });
}
