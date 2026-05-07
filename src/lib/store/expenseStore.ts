import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expense } from "@/lib/types";

const SEED: Expense[] = [
  // ── Pending (3) ──────────────────────────────────────────────────────────────
  { id: "e1",  vehicleId: "v1", loggedBy: "d1",     category: "fuel",        amount: 1500,  note: "PSO Gulberg — receipt uploaded",  status: "pending",  date: "2026-05-07T07:00:00.000Z" },
  { id: "e2",  vehicleId: "v2", loggedBy: "d2",     category: "maintenance", amount: 3200,  note: "Engine check — Al-Hamd Workshop", status: "pending",  date: "2026-05-06T11:00:00.000Z" },
  { id: "e3",  vehicleId: "v1", loggedBy: "d1",     category: "fine",        amount: 500,   note: "No-parking challan — Liberty",    status: "pending",  date: "2026-05-01T09:00:00.000Z" },
  // ── Approved (10) ────────────────────────────────────────────────────────────
  { id: "e4",  vehicleId: "v1", loggedBy: "d1",     category: "fuel",        amount: 1000,  note: "PSO Gulberg",                     status: "approved", date: "2026-05-07T05:00:00.000Z" },
  { id: "e5",  vehicleId: "v1", loggedBy: "d1",     category: "wash",        amount: 200,   note: "Quick wash",                      status: "approved", date: "2026-05-07T04:30:00.000Z" },
  { id: "e6",  vehicleId: "v2", loggedBy: "d2",     category: "tyre",        amount: 800,   note: "Front tyre puncture",             status: "approved", date: "2026-05-06T06:00:00.000Z" },
  { id: "e7",  vehicleId: "v2", loggedBy: "d2",     category: "fuel",        amount: 1200,  note: "Total Parco",                     status: "approved", date: "2026-05-06T05:00:00.000Z" },
  { id: "e8",  vehicleId: "v1", loggedBy: "d1",     category: "oil_change",  amount: 4500,  note: "Engine oil + filter",             status: "approved", date: "2026-05-05T08:00:00.000Z" },
  { id: "e9",  vehicleId: "v1", loggedBy: "d1",     category: "fuel",        amount: 950,   note: "PSO Model Town",                  status: "approved", date: "2026-05-05T06:00:00.000Z" },
  { id: "e10", vehicleId: "v2", loggedBy: "d2",     category: "fine",        amount: 500,   note: "Signal violation challan",        status: "approved", date: "2026-05-04T09:00:00.000Z" },
  { id: "e11", vehicleId: "v1", loggedBy: "owner1", category: "insurance",   amount: 15000, note: "Annual renewal",                  status: "approved", date: "2026-05-03T10:00:00.000Z" },
  { id: "e12", vehicleId: "v2", loggedBy: "owner1", category: "token_tax",   amount: 3000,  note: "2026 token",                      status: "approved", date: "2026-05-02T10:00:00.000Z" },
  { id: "e13", vehicleId: "v1", loggedBy: "d1",     category: "fuel",        amount: 1800,  note: "Total Parco — Gulberg",           status: "approved", date: "2026-04-28T07:00:00.000Z" },
  // ── Rejected (2) ─────────────────────────────────────────────────────────────
  { id: "e14", vehicleId: "v1", loggedBy: "d1",     category: "other",       amount: 550,   note: "Parking fee — event day",         status: "rejected", date: "2026-05-01T08:00:00.000Z" },
  { id: "e15", vehicleId: "v2", loggedBy: "d2",     category: "other",       amount: 300,   note: "Misc supplies",                   status: "rejected", date: "2026-04-25T10:00:00.000Z" },
];

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
      expenses: SEED,

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
