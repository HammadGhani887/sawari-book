import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expense } from "@/lib/types";

interface ExpenseState {
  expenses: Expense[];
  addExpense: (data: Omit<Expense, "id">) => void;
  approveExpense: (id: string) => void;
  rejectExpense: (id: string) => void;
  getByVehicle: (vehicleId: string) => Expense[];
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (data) =>
        set((s) => ({
          expenses: [{ ...data, id: `e${Date.now()}` }, ...s.expenses],
        })),

      approveExpense: (id) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, status: "approved" as const } : e
          ),
        })),

      rejectExpense: (id) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, status: "rejected" as const } : e
          ),
        })),

      getByVehicle: (vehicleId) =>
        get().expenses.filter((e) => e.vehicleId === vehicleId),
    }),
    { name: "sawari-expenses" }
  )
);
