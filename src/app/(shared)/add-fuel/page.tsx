"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import toast from "react-hot-toast";
import { ScreenHeader, NumericKeypad, Input, Button, Badge } from "@/components/ui";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useAuthStore } from "@/lib/store/authStore";
import { saveFuelOffline } from "@/hooks/useOfflineQueue";
import api from "@/lib/services/api";
import { createIdempotencyKey } from "@/lib/utils/idempotency";
import { compressImage } from "@/lib/utils/image";

function AddFuelContent() {
  const router   = useRouter();
  const searchParams = useSearchParams();
  const paramVehicleId = searchParams.get("vehicleId");
  
  const addFuel  = useFuelStore((s) => s.addFuelLog);
  const driver   = useCurrentDriver();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const fileRef  = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const vehicleId = paramVehicleId || driver?.vehicleId;
  const vehicle   = vehicles.find((v) => v.id === vehicleId);
  const pricePerLitre = vehicle?.petrolPricePkrL ?? null;

  const [amount,         setAmount]         = useState("");
  const [litres,         setLitres]         = useState("");
  const [litresEdited,   setLitresEdited]   = useState(false);
  const [odometer,       setOdometer]       = useState("");
  const [pumpName,       setPumpName]       = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);

  // Auto-calculate litres from amount when price is set
  useEffect(() => {
    if (!litresEdited && pricePerLitre && Number(amount) > 0) {
      setLitres((Number(amount) / pricePerLitre).toFixed(2));
    }
    if (!amount && !litresEdited) setLitres("");
  }, [amount, pricePerLitre, litresEdited]);

  function handleLitresChange(val: string) {
    setLitres(val);
    setLitresEdited(true);
  }

  function handleLitresBlur() {
    if (!litres) setLitresEdited(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64);
      setReceiptPreview(compressed);
    };
    reader.readAsDataURL(file);
  }

  function removeReceipt() {
    setReceiptPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const canSubmit = !!vehicleId && Number(amount) > 0 && Number(litres) > 0;

  async function handleSave() {
    if (!canSubmit || !vehicleId) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    
    const fuelData = {
      vehicleId:  vehicleId,
      driverId:   user?.id ?? "", // Can be owner or driver
      amountPkr:  Number(amount),
      litres:     Number(litres),
      odometer:   odometer ? Number(odometer) : undefined,
      pumpName:   pumpName || undefined,
      receiptUrl: receiptPreview ?? undefined,
      date:       new Date().toISOString(),
    };
    const idempotencyKey = createIdempotencyKey("fuel");

    if (!navigator.onLine) {
      saveFuelOffline(fuelData, idempotencyKey);
      toast("Fuel saved offline. Will sync when connected.", {
        icon: "📶",
        style: { background: "#1E293B", color: "#fff", borderRadius: "12px", borderLeft: "4px solid #F59E0B" },
      });
    } else {
      let savedToDb = false;
      try {
        await api.post("/fuel", {
          idempotencyKey,
          vehicleId: fuelData.vehicleId,
          amountPkr: fuelData.amountPkr,
          litres:    fuelData.litres,
          odometer:  fuelData.odometer,
          pumpName:  fuelData.pumpName,
          receiptUrl: fuelData.receiptUrl,
          date:      fuelData.date,
        });
        savedToDb = true;
      } catch {
        saveFuelOffline(fuelData, idempotencyKey);
      }

      addFuel(fuelData);
      if (savedToDb) {
        toast.success("Fuel entry saved ✓");
      } else {
        toast("Saved locally. Will sync when connection is stable.", {
          icon: "⚠️",
          style: { background: "#1E293B", color: "#fff", borderRadius: "12px" },
        });
      }
    }
    router.back();
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader 
        title={user?.role === 'owner' ? "Add Fuel Log" : "Add Fuel ⛽"} 
        titleUrdu="تیل درج کریں" 
        showBack 
      />

      <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
        {user?.role === 'owner' && vehicle && (
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="text-sm font-bold text-slate-900">{vehicle.makeModel}</p>
              <p className="text-xs text-slate-500">{vehicle.plateNumber}</p>
            </div>
          </div>
        )}

        {/* Fuel Cost */}
        <div>
          <div className="mb-2">
            <p className="text-sm font-medium text-slate-900">Fuel Cost (PKR)</p>
            <p className="text-xs text-slate-500 mt-0.5" dir="rtl">کتنے کا تیل ڈلوایا؟</p>
          </div>
          <NumericKeypad value={amount} onChange={setAmount} compact maxLength={6} />
        </div>

        {/* Litres */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-900">Litres</p>
              <p className="text-xs text-slate-500 font-[system-ui]" dir="rtl">کتنے لیٹر؟</p>
            </div>
            {pricePerLitre && Number(amount) > 0 && !litresEdited && (
              <span className="text-[11px] text-accent-blue font-medium">
                Auto · Rs {pricePerLitre}/L
              </span>
            )}
          </div>

          <div className={[
            "flex items-center bg-white border rounded-xl px-4 py-3 transition-all",
            !litresEdited && pricePerLitre && Number(litres) > 0 ? "border-accent-blue bg-blue-50" : "border-slate-200",
          ].join(" ")}>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={litres}
              onChange={(e) => handleLitresChange(e.target.value)}
              onBlur={handleLitresBlur}
              placeholder="e.g. 5.5"
              className="flex-1 bg-transparent text-slate-900 text-sm placeholder:text-slate-400 outline-none"
            />
            <span className="text-slate-500 text-sm font-medium ml-2">L</span>
          </div>
        </div>

        {/* Odometer */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900">Odometer (km)</p>
            <span className="text-[10px] text-slate-500 font-[system-ui]" dir="rtl">میٹر ریڈنگ</span>
            <Badge type="inactive" label="Optional" />
          </div>
          <Input type="number" value={odometer} onChange={setOdometer} placeholder="e.g. 45,500" />
        </div>

        {/* Pump Name */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900">Pump Name</p>
            <span className="text-[10px] text-slate-500 font-[system-ui]" dir="rtl">پمپ کا نام</span>
            <Badge type="inactive" label="Optional" />
          </div>
          <Input type="text" value={pumpName} onChange={setPumpName} placeholder="e.g. PSO Gulberg" />
        </div>

        {/* Receipt Photo */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-900">Receipt Photo</p>
            <span className="text-[10px] text-slate-500 font-[system-ui]" dir="rtl">رسید کی تصویر</span>
            <Badge type="inactive" label="Optional" />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {receiptPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <div className="relative w-full h-52">
                <Image
                  src={receiptPreview}
                  alt="Receipt"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <button
                onClick={removeReceipt}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-700 z-10 active:scale-95 transition-transform"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center gap-2 text-slate-500 active:bg-slate-50 active:scale-[0.98] transition-all bg-white"
            >
              <Camera size={28} strokeWidth={1.5} />
              <span className="text-sm font-medium">Take photo or upload</span>
              <span className="text-xs text-slate-400" dir="rtl">تصویر لیں یا اپلوڈ کریں</span>
            </button>
          )}
        </div>

        <div className="pt-2">
          <Button 
            variant={user?.role === 'owner' ? "primary" : "driver"} 
            fullWidth 
            disabled={!canSubmit} 
            loading={saving} 
            onClick={handleSave}
          >
            Save Fuel Entry ✓
          </Button>
          <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">تیل محفوظ کریں</p>
        </div>

      </div>
    </div>
  );
}

export default function AddFuelPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading fuel form...</div>}>
      <AddFuelContent />
    </Suspense>
  );
}
