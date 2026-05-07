"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScreenHeader } from "@/components/ui";
import { ExpenseCard } from "@/components/cards";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import { formatCurrency } from "@/lib/utils/format";
import { useExpenseStore } from "@/lib/store/expenseStore";
import type { Expense } from "@/lib/types";

const DATE_LABELS: Record<string, string> = {
  "2026-05-07": "7 May 2026",
  "2026-05-06": "6 May 2026",
  "2026-05-05": "5 May 2026",
  "2026-05-04": "4 May 2026",
  "2026-05-03": "3 May 2026",
  "2026-05-02": "2 May 2026",
  "2026-05-01": "1 May 2026",
};

export default function ExpensesPage() {
  const { expenses, approveExpense, rejectExpense } = useExpenseStore();

  const [selectedCategory,   setSelectedCategory]  = useState("all");
  const [isPendingExpanded,  setIsPendingExpanded] = useState(true);

  const pendingExpenses = useMemo(
    () => expenses.filter((e) => e.status === "pending"),
    [expenses]
  );

  const listedExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.status !== "pending")
      .filter((e) => selectedCategory === "all" || e.category === selectedCategory);
  }, [expenses, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const exp of listedExpenses) {
      const date = exp.date.slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(exp);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [listedExpenses]);

  const monthlyTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title="Expenses"
        titleUrdu="اخراجات"
        rightAction={
          <Link
            href="/expenses/add"
            className="px-3 py-1.5 rounded-full bg-accent-green text-white text-xs font-semibold active:opacity-70 transition-opacity"
          >
            + Add
          </Link>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-3 pb-6">

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95",
              selectedCategory === "all"
                ? "bg-accent-green text-white"
                : "bg-brand-surface border border-slate-700 text-slate-400",
            ].join(" ")}
          >
            All
          </button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95",
                selectedCategory === cat.id
                  ? "bg-accent-green text-white"
                  : "bg-brand-surface border border-slate-700 text-slate-400",
              ].join(" ")}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Pending section */}
        {pendingExpenses.length > 0 && (
          <div className="bg-status-amberDim border border-status-amber/20 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPendingExpanded((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">⚠️</span>
                <p className="text-sm text-status-amber font-medium">
                  {pendingExpenses.length} expense{pendingExpenses.length > 1 ? "s" : ""} pending approval
                </p>
              </div>
              {isPendingExpanded
                ? <ChevronUp   size={16} className="text-status-amber shrink-0" />
                : <ChevronDown size={16} className="text-status-amber shrink-0" />
              }
            </button>

            {isPendingExpanded && (
              <div className="flex flex-col gap-3 px-4 pb-4">
                {pendingExpenses.map((exp) => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    showActions
                    onApprove={approveExpense}
                    onReject={rejectExpense}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expense list grouped by date */}
        {grouped.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">No expenses in this category.</p>
        ) : (
          grouped.map(([date, exps]) => (
            <div key={date}>
              <p className="text-xs uppercase tracking-wider text-slate-500 py-2">
                {DATE_LABELS[date] ?? date}
              </p>
              <div className="flex flex-col gap-3">
                {exps.map((exp) => (
                  <ExpenseCard key={exp.id} expense={exp} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Monthly total */}
        <div className="mt-2 pt-4 border-t border-slate-700/50">
          <p className="text-sm text-slate-400 text-center">
            This Month:{" "}
            <span className="font-semibold text-white">{formatCurrency(monthlyTotal)}</span> total
          </p>
        </div>

      </div>
    </div>
  );
}
