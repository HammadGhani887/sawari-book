"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, Search, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { NumericKeypad, Modal, Button } from "@/components/ui";
import { LAHORE_AREAS } from "@/lib/constants/areas";
import { formatCurrency } from "@/lib/utils/format";
import { useRideStore } from "@/lib/store/rideStore";
import { useCurrentDriver } from "@/lib/store/driverStore";
import { useVehicleSettingsStore } from "@/lib/store/vehicleSettingsStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { saveRideOffline } from "@/hooks/useOfflineQueue";
import type { PlatformId, PaymentType } from "@/lib/types";

const PLATFORM_OPTIONS = [
  { id: "indrive" as PlatformId, name: "inDrive", color: "#2DB543", tint: "rgba(45,181,67,0.15)"   },
  { id: "yango"   as PlatformId, name: "Yango",   color: "#FFC107", tint: "rgba(255,193,7,0.15)"   },
  { id: "other"   as PlatformId, name: "Other",   color: "#64748B", tint: "rgba(100,116,139,0.15)" },
] as const;

export default function AddRidePage() {
  const router          = useRouter();
  const addRide         = useRideStore((s) => s.addRide);
  const driver          = useCurrentDriver();
  const fuelLogs        = useFuelStore((s) => s.fuelLogs);
  const estimateFuel    = useVehicleSettingsStore((s) => s.estimateFuelCost);
  const effectiveAvg    = useVehicleSettingsStore((s) => s.getEffectiveAverage)(fuelLogs);
  const petrolPrice     = useVehicleSettingsStore((s) => s.petrolPricePkrL);

  const [platform,   setPlatform]   = useState<PlatformId | null>(null);
  const [fare,       setFare]       = useState("");
  const [payment,    setPayment]    = useState<PaymentType>("cash");
  const [pickup,     setPickup]     = useState("");
  const [drop,       setDrop]       = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [areaModal,  setAreaModal]  = useState<"pickup" | "drop" | null>(null);
  const [areaSearch, setAreaSearch] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const canSubmit      = platform !== null && Number(fare) > 0;
  const selectedPlatform = PLATFORM_OPTIONS.find((p) => p.id === platform);

  // Focus search when modal opens
  useEffect(() => {
    if (areaModal) {
      setAreaSearch("");
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [areaModal]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.replace("/home"), 1600);
    return () => clearTimeout(t);
  }, [success, router]);

  const filteredAreas = LAHORE_AREAS.filter(
    (a) =>
      a.name.toLowerCase().includes(areaSearch.toLowerCase()) ||
      a.nameUrdu.includes(areaSearch)
  );

  function selectArea(value: string) {
    if (areaModal === "pickup") setPickup(value);
    else setDrop(value);
    setAreaModal(null);
  }

  async function handleSave() {
    if (!canSubmit || !platform) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));

    const rideData = {
      vehicleId:   driver?.vehicleId ?? "v1",
      driverId:    driver?.id ?? "d1",
      platform,
      fareAmount:  Number(fare),
      paymentType: payment,
      pickupArea:  pickup  || undefined,
      dropoffArea: drop    || undefined,
      distanceKm:  distanceKm ? Number(distanceKm) : undefined,
      isDisputed:  false,
      rideTime:    new Date().toISOString(),
    };

    if (!navigator.onLine) {
      saveRideOffline(rideData);
      toast("Ride saved offline. Will sync when connected.", {
        icon: "📶",
        style: { background: "#1E293B", color: "#fff", borderRadius: "12px", borderLeft: "4px solid #F59E0B" },
      });
    } else {
      addRide(rideData);
    }

    setSaving(false);
    setSuccess(true);
  }

  return (
    <div className="flex flex-col min-h-full bg-brand-bg">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-brand-bg shrink-0">
        <div>
          <p className="text-base font-bold text-white leading-snug">Add Ride</p>
          <p className="text-[11px] text-slate-500 leading-snug" dir="rtl">سواری درج کریں</p>
        </div>
        <button
          onClick={() => router.push("/home")}
          className="w-8 h-8 rounded-full bg-brand-elevated flex items-center justify-center text-slate-400 active:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Scrollable form ── */}
      <div className="flex flex-col px-4 pt-4 pb-8 gap-5">

        {/* Platform */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Platform</p>
          <div className="flex gap-3">
            {PLATFORM_OPTIONS.map((p) => {
              const isSelected = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  style={{ backgroundColor: isSelected ? p.tint : "#1E293B" }}
                  className={[
                    "relative flex-1 h-16 rounded-2xl flex flex-col items-center justify-center gap-1.5",
                    "border-2 transition-all duration-150 select-none active:scale-95",
                    isSelected ? "border-white scale-105" : "border-transparent",
                  ].join(" ")}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                      <span className="text-[9px] font-black leading-none" style={{ color: p.color }}>✓</span>
                    </span>
                  )}
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[11px] font-semibold text-white leading-none">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fare */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Fare Amount</p>
          <NumericKeypad value={fare} onChange={setFare} compact maxLength={6} />
        </div>

        {/* Payment */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Payment</p>
          <div className="flex gap-3">
            {([
              { type: "cash"   as PaymentType, label: "Cash 💵",   active: "bg-accent-greenDim border-accent-green text-white" },
              { type: "wallet" as PaymentType, label: "Wallet 💳", active: "bg-accent-blueDim  border-accent-blue  text-white" },
            ] as const).map(({ type, label, active }) => (
              <button
                key={type}
                onClick={() => setPayment(type)}
                className={[
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold text-center border-2 transition-all",
                  payment === type ? active : "bg-brand-surface border-transparent text-slate-400",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Areas */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Areas</p>
            <span className="text-[10px] text-slate-600">— optional</span>
          </div>
          <div className="flex gap-2">
            {([
              { key: "pickup" as const, label: "Pickup area...", urdu: "شروع کی جگہ", value: pickup },
              { key: "drop"   as const, label: "Drop area...",   urdu: "اترنے کی جگہ", value: drop  },
            ] as const).map(({ key, label, urdu, value }) => (
              <button
                key={key}
                onClick={() => setAreaModal(key)}
                className={[
                  "flex-1 py-2.5 px-3 rounded-xl text-sm border-2 border-transparent text-left transition-all",
                  "bg-brand-surface active:scale-[0.98]",
                  value ? "text-white border-slate-600" : "text-slate-500",
                ].join(" ")}
              >
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className={value ? "text-accent-blue" : "text-slate-600"} />
                  <span className="truncate">{value || label}</span>
                </div>
                {!value && <p className="text-[9px] text-slate-600 mt-0.5 pl-5" dir="rtl">{urdu}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Distance (optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Distance</p>
            <span className="text-[10px] text-slate-600">— optional, km</span>
            <span className="text-[9px] text-slate-600 font-[system-ui]" dir="rtl">فاصلہ</span>
          </div>
          <div className="flex items-center bg-brand-surface border-2 border-transparent focus-within:border-accent-blue rounded-xl px-4 py-3 transition-all">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="e.g. 12.5"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 outline-none"
            />
            <span className="text-slate-500 text-sm font-medium ml-2">km</span>
          </div>
          {Number(distanceKm) > 0 && (
            <div className="mt-2 px-1 flex flex-wrap gap-x-4 gap-y-1">
              {Number(fare) > 0 && (
                <p className="text-[11px] text-slate-500">
                  Revenue: <span className="text-accent-green font-semibold">
                    Rs {Math.round(Number(fare) / Number(distanceKm))}/km
                  </span>
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                Est. fuel: <span className="text-status-amber font-semibold">
                  Rs {estimateFuel(Number(distanceKm), fuelLogs)}
                </span>
                <span className="text-slate-600"> ({effectiveAvg} km/L @ Rs {petrolPrice}/L)</span>
              </p>
              {Number(fare) > 0 && (
                <p className="text-[11px] text-slate-500">
                  Net: <span className="text-white font-semibold">
                    Rs {Number(fare) - estimateFuel(Number(distanceKm), fuelLogs)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="pt-2">
          <Button variant="driver" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSave}>
            Save Ride ✓
          </Button>
          <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">سواری محفوظ کریں</p>
        </div>

      </div>

      {/* ── Area picker modal ── */}
      <Modal
        isOpen={areaModal !== null}
        onClose={() => setAreaModal(null)}
        title={areaModal === "pickup" ? "Pickup Location" : "Drop Location"}
      >
        {/* Search / custom input */}
        <div className="flex items-center gap-2 bg-brand-elevated rounded-xl px-3 py-2 mb-3">
          <Search size={15} className="text-slate-500 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={areaSearch}
            onChange={(e) => setAreaSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && areaSearch.trim()) selectArea(areaSearch.trim());
            }}
            placeholder="Search or type custom location…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          {areaSearch && (
            <button onClick={() => setAreaSearch("")} className="text-slate-500 active:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Use custom if typed and not in list */}
        {areaSearch.trim() && filteredAreas.length === 0 && (
          <button
            onClick={() => selectArea(areaSearch.trim())}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-xl bg-accent-blueDim text-accent-blue text-sm font-medium mb-1 active:scale-[0.98] transition-all"
          >
            <MapPin size={14} className="shrink-0" />
            Use &ldquo;{areaSearch.trim()}&rdquo;
          </button>
        )}

        {/* Custom option shown when typed, even if some results exist */}
        {areaSearch.trim().length > 1 && filteredAreas.length > 0 && (
          <button
            onClick={() => selectArea(areaSearch.trim())}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-accent-blue text-sm mb-1 active:bg-accent-blueDim transition-all"
          >
            <MapPin size={13} className="shrink-0" />
            <span>Use &ldquo;{areaSearch.trim()}&rdquo; as custom</span>
          </button>
        )}

        {/* List */}
        <div className="flex flex-col gap-0.5 -mx-1">
          {filteredAreas.map((area) => {
            const currentVal = areaModal === "pickup" ? pickup : drop;
            const isActive   = currentVal === area.name;
            return (
              <button
                key={area.id}
                onClick={() => selectArea(area.name)}
                className={[
                  "flex items-center justify-between w-full px-3 py-3 rounded-xl transition-colors text-left",
                  isActive ? "bg-accent-blueDim text-white" : "text-slate-300 active:bg-brand-elevated",
                ].join(" ")}
              >
                <span className="text-sm font-medium">{area.name}</span>
                <span className="text-xs text-slate-500" dir="rtl">{area.nameUrdu}</span>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ── Success overlay ── */}
      {success && (
        <div className="fixed inset-0 z-50 bg-brand-bg/95 flex flex-col items-center justify-center gap-5">
          <div className="w-24 h-24 rounded-full bg-accent-greenDim flex items-center justify-center animate-scaleIn">
            <CheckCircle2 size={56} className="text-accent-green" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Ride Saved!</p>
            <p className="text-slate-400 text-sm mt-2">
              {formatCurrency(Number(fare))}
              {selectedPlatform && ` · ${selectedPlatform.name}`}
              {` · ${payment === "cash" ? "Cash" : "Wallet"}`}
              {distanceKm && ` · ${distanceKm} km`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
