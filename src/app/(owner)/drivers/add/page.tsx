"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScreenHeader, Input, Button } from "@/components/ui";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useDriverStore } from "@/lib/store/driverStore";
import type { SalaryType } from "@/lib/types";

const SALARY_OPTIONS: { id: SalaryType; label: string }[] = [
  { id: "fixed",      label: "Fixed Monthly" },
  { id: "percentage", label: "Percentage"    },
  { id: "hybrid",     label: "Hybrid"        },
];

export default function AddDriverPage() {
  const router     = useRouter();
  const photoRef   = useRef<HTMLInputElement>(null);
  const vehicles   = useVehicleStore((s) => s.vehicles);
  const addDriver  = useDriverStore((s) => s.addDriver);

  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null);
  const [name,          setName]          = useState("");
  const [phone,         setPhone]         = useState("");
  const [cnic,          setCnic]          = useState("");
  const [vehicleId,     setVehicleId]     = useState("");
  const [salaryType,    setSalaryType]    = useState<SalaryType | null>(null);
  const [fixedAmount,   setFixedAmount]   = useState("");
  const [percentage,    setPercentage]    = useState("");
  const [hybridBase,    setHybridBase]    = useState("");
  const [hybridBonus,   setHybridBonus]   = useState("");
  const [saving,        setSaving]        = useState(false);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && salaryType !== null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!canSubmit || !salaryType) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    addDriver({
      userId:       "",
      name:         name.trim(),
      phone:        phone.trim(),
      cnic:         cnic.trim() || undefined,
      isActive:     true,
      vehicleId:    vehicleId || null,
      salaryType,
      salaryAmount: salaryType === "fixed" ? Number(fixedAmount) || 0
                  : salaryType === "percentage" ? Number(percentage) || 0
                  : Number(hybridBase) || 0,
      startDate:    new Date().toISOString().slice(0, 10),
    });
    toast.success("Driver saved ✓");
    router.push("/drivers");
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Add Driver" titleUrdu="ڈرائیور شامل کریں" showBack />

      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">

        {/* 1 — Photo */}
        <div className="flex flex-col items-center gap-1.5">
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Driver"
              onClick={() => photoRef.current?.click()}
              className="w-24 h-24 rounded-full object-cover border-2 border-accent-green cursor-pointer"
            />
          ) : (
            <button
              onClick={() => photoRef.current?.click()}
              className="w-24 h-24 rounded-full bg-brand-surface border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <span className="text-2xl leading-none">📷</span>
              <span className="text-[10px] text-slate-500 font-medium">Add Photo</span>
            </button>
          )}
        </div>

        <Input label="Full Name"  labelUrdu="پورا نام"         value={name}  onChange={setName}  placeholder="Ahmed Khan"      />
        <Input label="Phone"      labelUrdu="موبائل نمبر"       type="tel"    value={phone} onChange={setPhone} prefix="+92" placeholder="3011234567" />
        <Input label="CNIC"       labelUrdu="شناختی کارڈ"       value={cnic}  onChange={setCnic}  placeholder="XXXXX-XXXXXXX-X" maxLength={15} />

        {/* 5 — Assign Vehicle */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-white">Assign Vehicle</label>
          <span className="text-xs text-slate-500 font-[system-ui]" dir="rtl">گاڑی تفویض کریں</span>
          <div className="relative mt-0.5">
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full appearance-none bg-brand-surface text-sm text-white border border-slate-700 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-accent-green focus:border-accent-green"
            >
              <option value="">Assign Later</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.makeModel} · {v.plateNumber}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* 6 — Salary Structure */}
        <div>
          <p className="text-sm font-medium text-white mb-0.5">Salary Structure</p>
          <p className="text-xs text-slate-500 mb-3 font-[system-ui]" dir="rtl">تنخواہ کا طریقہ</p>

          <div className="flex flex-col gap-3">
            {SALARY_OPTIONS.map(({ id, label }) => {
              const isSelected = salaryType === id;
              return (
                <div
                  key={id}
                  className={[
                    "border-2 rounded-2xl overflow-hidden transition-colors",
                    isSelected ? "border-accent-green" : "border-slate-700",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => setSalaryType(isSelected ? null : id)}
                    className="w-full flex items-center justify-between px-4 h-14 bg-brand-surface"
                  >
                    <span className={`text-sm font-semibold ${isSelected ? "text-accent-green" : "text-white"}`}>
                      {label}
                    </span>
                    {isSelected
                      ? <ChevronUp   size={16} className="text-accent-green" />
                      : <ChevronDown size={16} className="text-slate-500"    />
                    }
                  </button>

                  {isSelected && (
                    <div className="px-4 pb-4 pt-2 bg-brand-surface border-t border-slate-700/50 flex flex-col gap-3">
                      {id === "fixed" && (
                        <Input label="Monthly Amount (₨)" type="number" value={fixedAmount}  onChange={setFixedAmount}  placeholder="e.g. 25000" />
                      )}
                      {id === "percentage" && (
                        <Input label="Revenue %"          type="number" value={percentage}   onChange={setPercentage}   placeholder="e.g. 20" />
                      )}
                      {id === "hybrid" && (
                        <>
                          <Input label="Base Amount (₨)"            type="number" value={hybridBase}  onChange={setHybridBase}  placeholder="e.g. 15000" />
                          <Input label="Bonus % above daily target"  type="number" value={hybridBonus} onChange={setHybridBonus} placeholder="e.g. 10" />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => toast.success("WhatsApp invite sent ✓")}
          className="w-full py-3 rounded-xl border-2 border-accent-green text-accent-green text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
        >
          Send WhatsApp Invite 📱
        </button>

        <div>
          <Button variant="primary" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSave}>
            Save Driver
          </Button>
          <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">ڈرائیور محفوظ کریں</p>
        </div>

      </div>
    </div>
  );
}
