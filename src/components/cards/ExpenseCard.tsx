"use client";

import Badge from "@/components/ui/Badge";
import { Expense, ExpenseStatus } from "@/lib/types";
import { CATEGORY_MAP } from "@/lib/constants/expenseCategories";
import { formatCurrency, formatDate } from "@/lib/utils/format";

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
          <p className="text-xs text-slate-500 mt-0.5 truncate">{expense.note}</p>
        )}

        <p className="text-[10px] text-slate-600 mt-1">
          {formatDate(expense.date)}
        </p>

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
