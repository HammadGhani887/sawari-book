"use client";

import Image from "next/image";
import Badge from "@/components/ui/Badge";
import { Expense, ExpenseStatus } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/constants/expenseCategories";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { openReceiptImage } from "@/lib/utils/image";

interface ExpenseCardProps {
  expense: Expense;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function ExpenseCard({
  expense,
  showActions = false,
  onApprove,
  onReject,
}: ExpenseCardProps) {
  const category = CATEGORY_MAP[expense.category];
  const isPending = expense.status === "pending";

  return (
    <div className="flex items-start gap-3 bg-brand-surface border border-slate-200/30 rounded-2xl p-4">
      {/* Category emoji */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-elevated flex items-center justify-center text-xl">
        {category?.emoji ?? "📦"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">
          {category?.name ?? expense.category}
        </p>

        {expense.note && (
          <p className="text-xs text-slate-500 mt-0.5 break-words">{expense.note}</p>
        )}

        <p className="text-[10px] text-slate-600 mt-1">
          {formatDate(expense.date)}
        </p>

        {expense.receiptUrl && (
          <div className="mt-2.5">
            <button
              onClick={() => openReceiptImage(expense.receiptUrl!)}
              className="relative inline-block group text-left"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 transition-all active:scale-95 group-hover:opacity-90">
                <Image
                  src={expense.receiptUrl}
                  alt="Receipt"
                  width={80}
                  height={80}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm rounded-md px-1 py-0.5 border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="text-[8px] font-bold text-slate-700 uppercase">Click to open</p>
              </div>
            </button>
          </div>
        )}

        {showActions && isPending && (
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={() => onApprove?.(expense.id)}
              className="flex-1 py-1.5 rounded-lg bg-accent-greenDim text-accent-green text-xs font-semibold active:scale-95 transition-transform"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onReject?.(expense.id)}
              className="flex-1 py-1.5 rounded-lg bg-status-redDim text-status-red text-xs font-semibold active:scale-95 transition-transform"
            >
              ✗ Reject
            </button>
          </div>
        )}
      </div>

      {/* Right: amount + badge */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-base font-bold text-slate-900">
          {formatCurrency(expense.amount)}
        </span>
        <Badge type={expense.status as ExpenseStatus} />
      </div>
    </div>
  );
}
