"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import toast from "react-hot-toast";
import { ScreenHeader, NumericKeypad, Input, Button } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useCurrentDriver } from "@/lib/store/driverStore";

export default function DriverAddExpensePage() {
  const router      = useRouter();
  const addExpense  = useExpenseStore((s) => s.addExpense);
  const driver      = useCurrentDriver();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category,       setCategory]       = useState<string | null>(null);
  const [amount,         setAmount]         = useState("");
  const [note,           setNote]           = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);

  const canSubmit = !!category && Number(amount) > 0;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptPreview(URL.createObjectURL(file));
  }

  function handleRemoveReceipt() {
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!canSubmit || !category) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    addExpense({
      vehicleId: driver?.vehicleId ?? "v1",
      loggedBy:  driver?.id ?? "d1",
      category,
      amount:    Number(amount),
      note:      note || undefined,
      status:    "pending",
      date:      new Date().toISOString(),
    });
    toast.success("Expense submitted ✓ Waiting for approval");
    router.back();
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Report Expense" titleUrdu="خرچہ درج کریں" showBack />

      <div className="flex flex-col gap-5 px-4 pt-4 pb-6">

        <div className="flex items-start gap-3 bg-status-amberDim border border-status-amber/20 rounded-xl p-3">
          <span className="text-lg leading-none shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="text-sm text-status-amber font-medium">Expenses will be sent to owner for approval</p>
            <p className="text-xs text-status-amber/70 mt-0.5" dir="rtl">اخراجات مالک کی منظوری کے لیے بھیجے جائیں گے</p>
          </div>
        </div>

        {/* Category grid */}
        <div>
          <p className="text-sm font-medium text-white mb-2">Category</p>
          <div className="grid grid-cols-4 gap-2">
            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={[
                    "aspect-square rounded-xl flex flex-col items-center justify-center gap-1",
                    "border-2 transition-all active:scale-95",
                    isSelected ? "border-accent-blue bg-accent-blueDim" : "border-transparent bg-brand-surface",
                  ].join(" ")}
                >
                  <span className="text-2xl leading-none">{cat.emoji}</span>
                  <span className={`text-[9px] font-semibold leading-tight text-center px-0.5 ${isSelected ? "text-accent-blue" : "text-slate-400"}`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-white mb-2">Amount (PKR)</p>
          <NumericKeypad value={amount} onChange={setAmount} compact maxLength={6} />
        </div>

        <Input label="What happened?" labelUrdu="کیا ہوا؟" value={note} onChange={setNote} multiline placeholder="e.g. Front tyre puncture near Thokar" driverMode />

        {/* Receipt photo */}
        <div>
          <p className="text-sm font-medium text-white mb-2">Receipt Photo</p>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          {receiptPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-cover" />
              <button onClick={handleRemoveReceipt} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-600 rounded-xl p-6 flex flex-col items-center gap-2 text-slate-500 hover:border-slate-500 hover:text-slate-400 active:scale-[0.98] transition-all"
            >
              <Camera size={28} strokeWidth={1.5} />
              <span className="text-sm font-medium">Add receipt photo</span>
              <span className="text-xs text-slate-600">(recommended)</span>
            </button>
          )}
        </div>

        <div className="pt-2">
          <Button variant="driver" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSubmit}>
            Submit for Approval
          </Button>
          <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">منظوری کے لیے بھیجیں</p>
        </div>
      </div>
    </div>
  );
}
