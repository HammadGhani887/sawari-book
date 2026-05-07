"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ScreenHeader, Input, Button, Badge } from "@/components/ui";
import { PLATFORMS } from "@/lib/constants/platforms";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import type { FuelType, PlatformId } from "@/lib/types";

const FUEL_TYPES: { id: FuelType; label: string }[] = [
  { id: "petrol", label: "Petrol" },
  { id: "diesel", label: "Diesel" },
  { id: "cng",    label: "CNG"    },
  { id: "hybrid", label: "Hybrid" },
];

export default function AddVehiclePage() {
  const router      = useRouter();
  const photoRef    = useRef<HTMLInputElement>(null);
  const addVehicle  = useVehicleStore((s) => s.addVehicle);

  const [photoPreview,       setPhotoPreview]       = useState<string | null>(null);
  const [plate,              setPlate]              = useState("");
  const [makeModel,          setMakeModel]          = useState("");
  const [fuelType,           setFuelType]           = useState<FuelType | null>(null);
  const [selectedPlatforms,  setSelectedPlatforms]  = useState<PlatformId[]>([]);
  const [insuranceExpiry,    setInsuranceExpiry]    = useState("");
  const [saving,             setSaving]             = useState(false);

  const canSubmit = plate.trim().length > 0 && makeModel.trim().length > 0 && fuelType !== null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function togglePlatform(p: PlatformId) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit() {
    if (!canSubmit || !fuelType) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    addVehicle({
      plateNumber:     plate.trim().toUpperCase(),
      makeModel:       makeModel.trim(),
      fuelType,
      platforms:       selectedPlatforms,
      insuranceExpiry: insuranceExpiry || undefined,
      isActive:        true,
    });
    toast.success("Vehicle saved ✓");
    router.push("/vehicles");
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Add Vehicle" titleUrdu="گاڑی شامل کریں" showBack />

      <div className="flex flex-col gap-5 px-4 pt-4 pb-8">

        {/* 1 — Vehicle photo */}
        <div className="flex flex-col items-center gap-1.5">
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Vehicle"
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

        {/* 2 — Number plate */}
        <Input label="Number Plate" labelUrdu="نمبر پلیٹ" value={plate} onChange={setPlate} placeholder="LEA-1234" />

        {/* 3 — Make & Model */}
        <Input label="Make & Model" labelUrdu="گاڑی" value={makeModel} onChange={setMakeModel} placeholder="Suzuki Alto 2022" />

        {/* 4 — Fuel type chips */}
        <div>
          <p className="text-sm font-medium text-white mb-2">Fuel Type</p>
          <div className="flex gap-2 flex-wrap">
            {FUEL_TYPES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFuelType(id)}
                className={[
                  "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
                  fuelType === id
                    ? "bg-accent-green text-white"
                    : "bg-brand-surface border border-slate-700 text-slate-300",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 5 — Platforms multi-select */}
        <div>
          <p className="text-sm font-medium text-white mb-2">Platforms</p>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map((p) => {
              const isSelected = selectedPlatforms.includes(p.id as PlatformId);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id as PlatformId)}
                  className={[
                    "px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95",
                    isSelected
                      ? "bg-brand-surface border-accent-green ring-2 ring-accent-green text-white"
                      : "bg-brand-surface border-slate-700 text-slate-300",
                  ].join(" ")}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6 — Insurance expiry (optional) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">Insurance Expiry</p>
            <Badge type="inactive" label="Optional" />
          </div>
          <Input type="date" value={insuranceExpiry} onChange={setInsuranceExpiry} />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button variant="primary" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSubmit}>
            Save Vehicle
          </Button>
          <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">گاڑی محفوظ کریں</p>
        </div>

      </div>
    </div>
  );
}
