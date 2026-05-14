import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExpenseCategory, Prisma } from "@prisma/client";
import { verifyAuth, unauthorized, badRequest } from "@/app/api/_lib/auth";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";

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
    // Driver: see all expenses for their assigned vehicle
    const assignment = await prisma.driverAssignment.findFirst({
      where: { driverId: auth.userId, isActive: true },
      select: { vehicleId: true }
    });
    if (assignment?.vehicleId) {
      where.vehicleId = assignment.vehicleId;
    } else {
      where.loggedBy = auth.userId; // Fallback
    }
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

  const categoryId = String(body.category).toLowerCase();
  const allowedCategoryIds = new Set(EXPENSE_CATEGORIES.map((c) => c.id));
  if (!allowedCategoryIds.has(categoryId)) {
    return badRequest(`Invalid category: ${categoryId}`);
  }

  // Security Check: Does user have access to this vehicle?
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: body.vehicleId },
    select: { ownerId: true, id: true }
  });

  if (!vehicle) return badRequest("Vehicle not found");

  if (auth.role === "owner") {
    if (vehicle.ownerId !== auth.userId) return unauthorized();
  } else {
    // Driver: check if this is their assigned vehicle
    const assignment = await prisma.driverAssignment.findFirst({
      where: { driverId: auth.userId, isActive: true },
      select: { vehicleId: true }
    });
    if (assignment?.vehicleId !== body.vehicleId) return unauthorized();
  }

  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

  // Owner-created expenses are auto-approved; driver-submitted are pending
  const status = auth.role === "owner" ? "APPROVED" : "PENDING";
  let expense;
  let replayed = false;
  const category = categoryId.toUpperCase() as ExpenseCategory;

  if (idempotencyKey) {
    const scope = "expense_create";
    const txResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          category,
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
    }, { timeout: 20000 });
    expense = txResult.expense;
    replayed = txResult.replayed;
  } else {
    expense = await prisma.expense.create({
      data: {
        vehicleId:  body.vehicleId,
        loggedBy:   auth.userId,
        category,
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
          data: { url: `/vehicles/${expense.vehicleId}?tab=expenses` }
        }
      });

      // Send Push Notification
      await sendPushNotification(expense.vehicle.ownerId, { title, body, url: `/vehicles/${expense.vehicleId}?tab=expenses` });
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
