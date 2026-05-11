import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");
  const status    = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (auth.role === "driver") {
    where.loggedBy = auth.userId;
  } else {
    // Owner filter: only expenses for vehicles owned by this user
    where.vehicle = { ownerId: auth.userId };
    if (vehicleId) where.vehicleId = vehicleId;
  }

  if (status)    where.status = status.toUpperCase();
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate)   where.date.lte = new Date(endDate + "T23:59:59.999Z");
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = expenses.map((e: any) => ({
    id:         e.id,
    vehicleId:  e.vehicleId,
    loggedBy:   e.loggedBy,
    category:   e.category.toLowerCase(),
    amount:     Number(e.amount),
    note:       e.note,
    receiptUrl: e.receiptUrl,
    status:     e.status.toLowerCase(),
    date:       e.date.toISOString(),
  }));

  return NextResponse.json(result);
}

import { sendPushNotification } from "@/app/api/_lib/push";

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.vehicleId || !body?.category || !body?.amount) {
    return badRequest("vehicleId, category, and amount are required");
  }
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

  // Owner-created expenses are auto-approved; driver-submitted are pending
  const status = auth.role === "owner" ? "APPROVED" : "PENDING";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let expense: any;
  let replayed = false;

  if (idempotencyKey) {
    const scope = "expense_create";
    const txResult = await prisma.$transaction(async (tx: any) => {
      const existing = await tx.idempotencyKey.findUnique({
        where: {
          userId_scope_key: {
            userId: auth.userId,
            scope,
            key: idempotencyKey,
          },
        },
      });

      if (existing?.resourceId) {
        const existingExpense = await tx.expense.findUnique({
          where: { id: existing.resourceId },
          include: { vehicle: true, logger: true },
        });
        if (existingExpense) {
          return { expense: existingExpense, replayed: true };
        }
      }

      const createdExpense = await tx.expense.create({
        data: {
          vehicleId: body.vehicleId,
          loggedBy: auth.userId,
          category: body.category.toUpperCase(),
          amount: Number(body.amount),
          note: body.note ?? null,
          receiptUrl: body.receiptUrl ?? null,
          status,
          date: body.date ? new Date(body.date) : new Date(),
        },
        include: {
          vehicle: true,
          logger: true,
        },
      });

      await tx.idempotencyKey.create({
        data: {
          userId: auth.userId,
          scope,
          key: idempotencyKey,
          resourceId: createdExpense.id,
        },
      });

      return { expense: createdExpense, replayed: false };
    });
    expense = txResult.expense;
    replayed = txResult.replayed;
  } else {
    expense = await prisma.expense.create({
      data: {
        vehicleId:  body.vehicleId,
        loggedBy:   auth.userId,
        category:   body.category.toUpperCase(),
        amount:     Number(body.amount),
        note:       body.note       ?? null,
        receiptUrl: body.receiptUrl ?? null,
        status,
        date:       body.date ? new Date(body.date) : new Date(),
      },
      include: {
        vehicle: true,
        logger: true,
      }
    });
  }

  // Notify owner if driver submitted
  if (auth.role === "driver" && !replayed) {
    try {
      const title = "Expense for Approval";
      const body = `${expense.logger.name} reported ₨${Number(expense.amount).toLocaleString()} for ${expense.category.toLowerCase()}`;
      
      await prisma.notification.create({
        data: {
          userId: expense.vehicle.ownerId,
          type:   "expense_pending",
          title,
          body,
        }
      });

      // Send Push Notification
      await sendPushNotification(expense.vehicle.ownerId, { title, body });
    } catch (err) {
      console.error("Failed to notify owner:", err);
    }
  }

  return NextResponse.json({
    id:         expense.id,
    vehicleId:  expense.vehicleId,
    loggedBy:   expense.loggedBy,
    category:   expense.category.toLowerCase(),
    amount:     Number(expense.amount),
    note:       expense.note,
    receiptUrl: expense.receiptUrl,
    status:     expense.status.toLowerCase(),
    date:       expense.date.toISOString(),
    idempotentReplay: replayed,
  }, { status: replayed ? 200 : 201 });
}
