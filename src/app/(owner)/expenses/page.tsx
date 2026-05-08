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

const THIS_MONTH = new Date().toISOString().slice(0, 7);

function formatDateLabel(dateStr: string): string {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  if (dateStr === today)     return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function ExpensesPage() {
  const { expenses, approveExpense, rejectExpense } = useExpenseStore();

  const [selectedCategory,  setSelectedCategory]  = useState("all");
  const [isPendingExpanded, setIsPendingExpanded] = useState(true);

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

  // Monthly total — approved only
  const monthlyApproved = expenses
    .filter((e) => e.status === "approved" && e.date.startsWith(THIS_MONTH))
    .reduce((s, e) => s + e.amount, 0);

  const monthlyPending = expenses
    .filter((e) => e.status === "pending" && e.date.startsWith(THIS_MONTH))
    .reduce((s, e) => s + e.amount, 0);

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

        {/* Monthly summary */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">This Month — Approved</p>
              <p className="text-base font-bold text-status-amber tabular-nums">{formatCurrency(monthlyApproved)}</p>
            </div>
            {monthlyPending > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-base font-bold text-slate-600 tabular-nums">{formatCurrency(monthlyPending)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all active:scale-95",
              selectedCategory === "all"
                ? "bg-accent-green text-white"
                : "bg-brand-surface border border-slate-200 text-slate-600",
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
                  : "bg-brand-surface border border-slate-200 text-slate-600",
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
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="text-4xl opacity-20">🧾</span>
            <p className="text-center text-slate-500 text-sm">No expenses in this category.</p>
          </div>
        ) : (
          grouped.map(([date, exps]) => (
            <div key={date}>
              <div className="flex items-center justify-between py-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">{formatDateLabel(date)}</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {formatCurrency(exps.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0))}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {exps.map((exp) => (
                  <ExpenseCard key={exp.id} expense={exp} />
                ))}
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}
