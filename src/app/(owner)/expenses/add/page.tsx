"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown } from "lucide-react";
import { ScreenHeader, Input, Button, NumericKeypad } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useExpenseStore } from "@/lib/store/expenseStore";

export default function AddExpensePage() {
  const router       = useRouter();
  const vehicles     = useVehicleStore((s) => s.vehicles);
  const addExpense   = useExpenseStore((s) => s.addExpense);

  const [vehicleId, setVehicleId] = useState("");
  const [category,  setCategory]  = useState("");
  const [amount,    setAmount]    = useState("");
  const [note,      setNote]      = useState("");
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10));
  const [saving,    setSaving]    = useState(false);

  const canSubmit = vehicleId !== "" && category !== "" && amount !== "" && amount !== "0";

  async function handleSave() {
    if (!canSubmit) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    addExpense({
      vehicleId,
      loggedBy:  "owner1",
      category,
      amount:    Number(amount),
      note:      note || undefined,
      status:    "approved",
      date:      new Date(date).toISOString(),
    });
    toast.success("Expense saved ✓");
    router.push("/expenses");
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Add Expense" titleUrdu="خرچہ شامل کریں" showBack />

      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">

        {/* 1 — Vehicle */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Vehicle</label>
          <span className="text-xs text-slate-500 font-[system-ui]" dir="rtl">گاڑی منتخب کریں</span>
          <div className="relative mt-0.5">
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full appearance-none bg-white shadow-sm text-sm text-slate-900 border border-slate-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-accent-green focus:border-accent-green"
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.makeModel} · {v.plateNumber}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* 2 — Category */}
        <div>
          <p className="text-sm font-medium text-slate-900 mb-2">Category</p>
          <div className="flex gap-2 flex-wrap">
            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={[
                    "px-3 py-2 rounded-full text-xs font-medium transition-all active:scale-95",
                    isSelected
                      ? "bg-accent-green text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 shadow-sm",
                  ].join(" ")}
                >
                  {cat.emoji} {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 — Amount */}
        <div>
          <p className="text-sm font-medium text-slate-900 mb-3">Amount</p>
          <NumericKeypad value={amount} onChange={setAmount} maxLength={6} />
        </div>

        {/* 4 — Note */}
        <Input label="Note" labelUrdu="نوٹ" value={note} onChange={setNote} placeholder="e.g. PSO Gulberg station" />

        {/* 5 — Date */}
        <Input label="Date" type="date" value={date} onChange={setDate} />

        <div className="pt-2">
          <Button variant="primary" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSave}>
            Save Expense
          </Button>
          <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">خرچہ محفوظ کریں</p>
        </div>

      </div>
    </div>
  );
}
