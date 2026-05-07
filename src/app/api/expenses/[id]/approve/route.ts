import { NextRequest, NextResponse } from "next/server";
import { expenses } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized, notFound } from "@/app/api/_lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const idx = expenses.findIndex((e) => e.id === params.id);
  if (idx === -1) return notFound("Expense");

  // TODO: Connect to Prisma + MySQL here. prisma.expense.update({ where: { id }, data: { status: "approved" } })
  expenses[idx] = { ...expenses[idx], status: "approved" };

  return NextResponse.json(expenses[idx]);
}
