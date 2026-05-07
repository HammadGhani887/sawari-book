"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ScreenHeader, NumericKeypad, Input, Button, Badge } from "@/components/ui";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useCurrentDriver } from "@/lib/store/driverStore";

export default function AddFuelPage() {
  const router    = useRouter();
  const addFuel   = useFuelStore((s) => s.addFuelLog);
  const driver    = useCurrentDriver();

  const [amount,   setAmount]   = useState("");
  const [litres,   setLitres]   = useState("");
  const [odometer, setOdometer] = useState("");
  const [pumpName, setPumpName] = useState("");
  const [saving,   setSaving]   = useState(false);

  const canSubmit = Number(amount) > 0 && Number(litres) > 0;

  async function handleSave() {
    if (!canSubmit) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    addFuel({
      vehicleId: driver?.vehicleId ?? "v1",
      driverId:  driver?.id ?? "d1",
      amountPkr: Number(amount),
      litres:    Number(litres),
      odometer:  odometer ? Number(odometer) : undefined,
      pumpName:  pumpName || undefined,
      date:      new Date().toISOString(),
    });
    toast.success("Fuel entry saved ✓");
    router.back();
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Add Fuel ⛽" titleUrdu="تیل درج کریں" showBack />

      <div className="flex flex-col gap-5 px-4 pt-4 pb-6">

        <div>
          <div className="mb-2">
            <p className="text-sm font-medium text-white">Fuel Cost (PKR)</p>
            <p className="text-xs text-slate-500 mt-0.5" dir="rtl">کتنے کا تیل ڈلوایا؟</p>
          </div>
          <NumericKeypad value={amount} onChange={setAmount} compact maxLength={6} />
        </div>

        <Input label="Litres" labelUrdu="کتنے لیٹر؟" type="number" value={litres} onChange={setLitres} placeholder="e.g. 5.5" driverMode />

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">Odometer (km)</p>
            <span className="text-[10px] text-slate-500 font-[system-ui]" dir="rtl">میٹر ریڈنگ</span>
            <Badge type="inactive" label="Optional" />
          </div>
          <Input type="number" value={odometer} onChange={setOdometer} placeholder="e.g. 45,500" driverMode />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">Pump Name</p>
            <span className="text-[10px] text-slate-500 font-[system-ui]" dir="rtl">پمپ کا نام</span>
            <Badge type="inactive" label="Optional" />
          </div>
          <Input type="text" value={pumpName} onChange={setPumpName} placeholder="e.g. PSO Gulberg" driverMode />
        </div>

        <div className="pt-2">
          <Button variant="driver" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSave}>
            Save Fuel Entry ✓
          </Button>
          <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">تیل محفوظ کریں</p>
        </div>
      </div>
    </div>
  );
}
