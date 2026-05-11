"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Link2, CheckCheck, Pencil, Check, X, RefreshCw } from "lucide-react";
import { ScreenHeader, Card, Badge } from "@/components/ui";
import { RideEntryCard, ExpenseCard, SettlementRow } from "@/components/cards";
import PlatformBadge from "@/components/ui/PlatformBadge";
import { formatCurrency } from "@/lib/utils/format";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { openReceiptImage } from "@/lib/utils/image";
import { exportToPDF } from "@/lib/utils/pdfExport";
import { EXPENSE_CATEGORIES } from "@/lib/constants/expenseCategories";
import toast from "react-hot-toast";
import api from "@/lib/services/api";
import { getRangeInterval, isDateInRange } from "@/lib/utils/date";

type DateRange = "today" | "week" | "month" | "custom";
type TabId     = "rides" | "expenses" | "summary" | "fuel";



function Stat({ icon, value, label, colorClass = "text-slate-900" }: {
  icon: string; value: string; label: string; colorClass?: string;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl flex flex-col items-center gap-1 py-3 px-1">
      <span className="text-base leading-none">{icon}</span>
      <span className={`text-sm font-bold tabular-nums leading-none ${colorClass}`}>{value}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicleId = params.id;

  const storeVehicle = useVehicleStore((s) => s.vehicles.find((v) => v.id === vehicleId));
  const updateVehicle = useVehicleStore((s) => s.updateVehicle);
  const getEffective  = useVehicleStore((s) => s.getEffectiveAverage);
  const drivers       = useDriverStore((s) => s.drivers);
  const allRides      = useRideStore((s) => s.rides);
  const fuelLogs      = useFuelStore((s) => s.fuelLogs);
  const { expenses, approveExpense, rejectExpense } = useExpenseStore();
  const token         = useAuthStore((s) => s.token);

  // State for vehicle data (fetched fresh from DB)
  const [vehicle, setVehicle] = useState(storeVehicle);

  // Fetch vehicle fresh from DB on mount
  useEffect(() => {
    async function fetchVehicle() {
      try {
        const res = await api.get(`/vehicles/${vehicleId}`);
        if (res.data) {
          setVehicle(res.data);
          // Also update store
          updateVehicle(vehicleId, res.data);
        }
      } catch {
        // Use store data as fallback
        setVehicle(storeVehicle);
      }
    }
    fetchVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [activeTab, setActiveTab] = useState<TabId>("rides");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [customStart, setCustomStart] = useState(TODAY);
  const [customEnd,   setCustomEnd]   = useState(TODAY);

  // Refresh drivers from DB (useful after invite is accepted)
  const refreshDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          useDriverStore.setState({ drivers: data });
        }
      }
    } catch {
      // ignore
    }
  }, [token]);

  // Auto-refresh drivers on mount so newly joined drivers show up
  useEffect(() => {
    refreshDrivers();
  }, [refreshDrivers]);

  // Fuel settings edit state
  const [editingFuel,    setEditingFuel]    = useState(false);
  const [priceInput,     setPriceInput]     = useState(String(vehicle?.petrolPricePkrL ?? 280));
  const [avgInput,       setAvgInput]       = useState(String(vehicle?.fuelAverageKmL  ?? 12));
  const [tankInput,      setTankInput]      = useState(String(vehicle?.tankCapacityLitres ?? ""));

  const effectiveAvg = getEffective(vehicleId, fuelLogs);
  const driver = drivers.find((d) => d.vehicleId === vehicleId);

  const activeInterval = useMemo(() => {
    return getRangeInterval(dateRange, dateRange === "custom" ? { start: customStart, end: customEnd } : undefined);
  }, [dateRange, customStart, customEnd]);

  const filteredRides = useMemo(() => {
    const vRides = allRides.filter((r) => r.vehicleId === vehicleId);
    return vRides.filter((r) => isDateInRange(r.rideTime, activeInterval));
  }, [allRides, vehicleId, activeInterval]);

  const filteredExpenses = useMemo(() => {
    const vExp = expenses.filter((e) => e.vehicleId === vehicleId);
    return vExp.filter((e) => isDateInRange(e.date, activeInterval));
  }, [expenses, vehicleId, activeInterval]);

  const filteredFuelLogs = useMemo(() => {
    const vFuel = fuelLogs.filter((f) => f.vehicleId === vehicleId);
    return vFuel.filter((f) => isDateInRange(f.date, activeInterval));
  }, [fuelLogs, vehicleId, activeInterval]);

  const totalRevenue  = filteredRides.reduce((s, r) => s + r.fareAmount, 0);
  const totalExpenses = filteredExpenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + e.amount, 0);

  const TABS: { id: TabId; label: string }[] = [
    { id: "rides",    label: "Rides"    },
    { id: "expenses", label: "Expenses" },
    { id: "summary",  label: "Summary"  },
    { id: "fuel",     label: "Fuel ⛽"  },
  ];

  async function saveFuelSettings() {
    const price = Number(priceInput);
    const avg   = Number(avgInput);
    const tank  = Number(tankInput);
    if (price <= 0 || avg <= 0) { toast.error("Enter valid price and average"); return; }
    
    try {
      // Save to DB via API
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          petrolPricePkrL:    price,
          fuelAverageKmL:     avg,
          tankCapacityLitres: tank > 0 ? tank : null,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to save settings");
        return;
      }

      const updated = await res.json();
      
      // Update local store
      updateVehicle(vehicleId, {
        petrolPricePkrL:    updated.petrolPricePkrL,
        fuelAverageKmL:     updated.fuelAverageKmL,
        tankCapacityLitres: updated.tankCapacityLitres,
      });

      toast.success("Fuel settings saved ✓");
      setEditingFuel(false);
    } catch {
      toast.error("Network error");
    }
  }

  async function handleGenerateInvite() {
    setGeneratingInvite(true);
    try {
      const res = await fetch("/api/invites", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicleId }),
      });
      let json: { ok?: boolean; token?: string; error?: string } = {};
      try { json = await res.json(); } catch { /* empty */ }
      if (!res.ok) {
        toast.error(json.error ?? `Error ${res.status}`);
        return;
      }
      if (!json.token) {
        toast.error("No token returned");
        return;
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setInviteLink(`${origin}/invite/${json.token}`);
      toast.success("Invite link created ✓");
    } catch {
      toast.error("Network error");
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const title = vehicle
    ? `${vehicle.makeModel} · ${vehicle.plateNumber}`
    : "Vehicle";

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title={title} showBack />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-28">

        {/* Vehicle info */}
        <Card>
          <div className="flex items-start gap-4">
            <span className="text-4xl leading-none shrink-0">🚗</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-900 leading-tight">
                {vehicle?.makeModel ?? "—"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge type="inactive" label={vehicle?.fuelType ?? "petrol"} />
                {vehicle?.platforms.map((p) => (
                  <PlatformBadge key={p} platform={p as "indrive" | "yango" | "other" | "private"} />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Driver card */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Driver</p>
          {driver ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-blueDim flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-accent-blue">{driver.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{driver.name}</p>
                <p className="text-xs text-slate-500">
                  {driver.phone}
                  {driver.salaryType === "fixed"
                    ? ` · Rs ${driver.salaryAmount.toLocaleString()}/mo`
                    : ` · ${driver.salaryAmount}%`}
                </p>
                {driver.cnic && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{driver.cnic}</p>
                )}
              </div>
              <a
                href={`tel:+92${driver.phone.replace(/\D/g, "").slice(-10)}`}
                className="text-accent-green active:opacity-70"
              >
                <Phone size={18} />
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-500">No driver linked to this vehicle.</p>
              <button
                onClick={refreshDrivers}
                className="flex items-center gap-1.5 text-xs text-slate-400 active:opacity-70 self-start"
              >
                <RefreshCw size={12} /> Refresh
              </button>
              {inviteLink ? (
                <div className="bg-brand-elevated rounded-xl p-3 flex flex-col gap-2">
                  <p className="text-xs text-slate-500">Share this link with your driver:</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-brand-surface text-xs text-slate-400 px-3 py-2 rounded-lg outline-none font-mono truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-accent-green text-xs font-semibold shrink-0"
                    >
                      {copied ? <CheckCheck size={13} /> : <Link2 size={13} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  disabled={generatingInvite}
                  className="flex items-center gap-2 text-accent-green text-sm font-semibold active:opacity-70 disabled:opacity-50"
                >
                  <Link2 size={15} />
                  {generatingInvite ? "Generating..." : "Generate Invite Link"}
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Date range */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(["today", "week", "month", "custom"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={[
                  "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
                  dateRange === r
                    ? "bg-accent-green text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 shadow-sm",
                ].join(" ")}
              >
                {r === "today" ? "Today" : r === "week" ? "Week" : r === "month" ? "Month" : "Custom"}
              </button>
            ))}
          </div>

          {dateRange === "custom" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 flex gap-3 shadow-sm">
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 mb-1">From</p>
                <input
                  type="date"
                  value={customStart}
                  max={TODAY}
                  onChange={(e) => { setCustomStart(e.target.value); if (e.target.value > customEnd) setCustomEnd(e.target.value); }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-green"
                />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 mb-1">To</p>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={TODAY}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-green"
                />
              </div>
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <Stat icon="🚗" value={String(filteredRides.length)} label="Rides" />
          <Stat icon="💰" value={formatCurrency(totalRevenue)}  label="Revenue"  colorClass="text-accent-green" />
          <Stat icon="🧾" value={formatCurrency(totalExpenses)} label="Expenses" colorClass="text-status-amber" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200/50">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                "flex-1 py-2.5 text-sm font-semibold transition-colors",
                activeTab === id
                  ? "border-b-2 border-accent-green text-slate-900"
                  : "text-slate-500",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "rides" && (
          <div className="flex flex-col gap-3">
            {filteredRides.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No rides in this period.</p>
            ) : (
              filteredRides.map((ride) => <RideEntryCard key={ride.id} ride={ride} />)
            )}
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="flex flex-col gap-3">
            {filteredExpenses.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No expenses in this period.</p>
            ) : (
              filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  showActions
                  onApprove={approveExpense}
                  onReject={rejectExpense}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "summary" && (
          <Card>
            {(() => {
              const fuelCostToday = fuelLogs
                .filter((f) => f.vehicleId === vehicleId && isDateInRange(f.date, activeInterval))
                .reduce((s, f) => s + f.amountPkr, 0);
              const estFuelFromRides = filteredRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
              const fuelCost = fuelCostToday > 0 ? fuelCostToday : estFuelFromRides;
              const net = totalRevenue - fuelCost - totalExpenses;
              return (
                <>
                  <SettlementRow label="Total Revenue"  amount={totalRevenue}  type="revenue" />
                  <SettlementRow label="Fuel Cost"      amount={fuelCost}      type="expense" />
                  <SettlementRow label="Other Expenses" amount={totalExpenses} type="expense" />
                  <SettlementRow label="Net Profit"     amount={net}           type="profit"  />
                  <button
                    onClick={() => {
                      const rangeLabel = dateRange === "custom"
                        ? customStart === customEnd ? customStart : `${customStart} → ${customEnd}`
                        : dateRange;
                      exportToPDF({
                        title:       "Vehicle Report",
                        period:      rangeLabel,
                        vehicleName: vehicle ? `${vehicle.makeModel} · ${vehicle.plateNumber}` : vehicleId,
                        rows: [
                          { label: "Total Rides",    value: String(filteredRides.length) },
                          { label: "Total Revenue",  value: `Rs ${totalRevenue.toLocaleString()}`,  color: "green" },
                          { label: "Fuel Cost",      value: `Rs ${fuelCost.toLocaleString()}`,      color: "amber" },
                          { label: "Other Expenses", value: `Rs ${totalExpenses.toLocaleString()}`, color: "amber" },
                          { label: "Net Profit",     value: `Rs ${net.toLocaleString()}`,           color: net >= 0 ? "green" : "red", bold: true },
                        ],
                        rides: filteredRides.map((r) => ({
                          time:      new Date(r.rideTime).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
                          platform:  r.platform === "indrive" ? "inDrive" : r.platform === "yango" ? "Yango" : "Other",
                          route:     [r.pickupArea, r.dropoffArea].filter(Boolean).join(" → ") || "—",
                          fare:      r.fareAmount,
                          fuelCost:  r.estimatedFuelCost,
                          boostCost: r.boostCost,
                          netProfit: (r.estimatedFuelCost !== undefined || r.boostCost !== undefined)
                            ? r.fareAmount - (r.estimatedFuelCost ?? 0) - (r.boostCost ?? 0)
                            : undefined,
                          distance:  r.distanceKm,
                        })),
                        expenses: filteredExpenses.map((e) => ({
                          date:     new Date(e.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
                          category: EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.name ?? e.category,
                          amount:   e.amount,
                          note:     e.note,
                          status:   e.status,
                        })),
                        fuelLogs: fuelLogs
                          .filter((f) => f.vehicleId === vehicleId)
                          .map((f) => ({
                            date:   new Date(f.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
                            amount: f.amountPkr,
                            litres: f.litres,
                            pump:   f.pumpName,
                          })),
                      });
                    }}
                    className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium active:opacity-70 transition-opacity"
                  >
                    Export PDF 📄
                  </button>
                </>
              );
            })()}
          </Card>
        )}

        {activeTab === "fuel" && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">⛽ Fuel Settings</p>
              {!editingFuel ? (
                <button
                  onClick={() => {
                    setPriceInput(String(vehicle?.petrolPricePkrL ?? 280));
                    setAvgInput(String(vehicle?.fuelAverageKmL ?? 12));
                    setTankInput(String(vehicle?.tankCapacityLitres ?? ""));
                    setEditingFuel(true);
                  }}
                  className="flex items-center gap-1 text-accent-green text-xs font-semibold"
                >
                  <Pencil size={12} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveFuelSettings} className="flex items-center gap-1 text-accent-green text-xs font-semibold">
                    <Check size={13} /> Save
                  </button>
                  <button onClick={() => setEditingFuel(false)} className="flex items-center gap-1 text-slate-500 text-xs">
                    <X size={13} /> Cancel
                  </button>
                </div>
              )}
            </div>

            {editingFuel ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Petrol Price (Rs/L)</p>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-accent-green">
                    <span className="text-slate-500 text-sm mr-2">Rs</span>
                    <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)}
                      className="flex-1 bg-transparent text-slate-900 text-sm outline-none" />
                    <span className="text-slate-500 text-sm">/L</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Fuel Average (km/L)</p>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-accent-green">
                    <input type="number" value={avgInput} onChange={(e) => setAvgInput(e.target.value)}
                      className="flex-1 bg-transparent text-slate-900 text-sm outline-none" />
                    <span className="text-slate-500 text-sm">km/L</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tank Capacity (optional)</p>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-accent-green">
                    <input type="number" value={tankInput} onChange={(e) => setTankInput(e.target.value)}
                      placeholder="e.g. 35"
                      className="flex-1 bg-transparent text-slate-900 text-sm outline-none placeholder:text-slate-400" />
                    <span className="text-slate-500 text-sm">L</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                {[
                  { label: "Petrol Price",    value: vehicle?.petrolPricePkrL ? `Rs ${vehicle.petrolPricePkrL}/L` : "Not set" },
                  { label: "Manual Average",  value: vehicle?.fuelAverageKmL  ? `${vehicle.fuelAverageKmL} km/L`  : "Not set" },
                  { label: "Auto Average",    value: `${effectiveAvg} km/L (from fill-ups)` },
                  { label: "Tank Capacity",   value: vehicle?.tankCapacityLitres ? `${vehicle.tankCapacityLitres} L` : "Not set" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <p className="text-sm text-slate-600">{label}</p>
                    <p className="text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-3">
              Driver sees these settings automatically. If driver updates price/average, it reflects here too.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-900">Fuel Entries</p>
                {vehicle && (
                  <Link 
                    href={`/add-fuel?vehicleId=${vehicle.id}`}
                    className="px-3 py-1 bg-accent-greenDim text-accent-green text-[10px] font-bold rounded-lg hover:bg-accent-green hover:text-white transition-all active:scale-95"
                  >
                    + ADD FUEL
                  </Link>
                )}
              </div>
              {filteredFuelLogs.length === 0 ? (
                <p className="text-xs text-slate-500">No fuel entries in selected date range.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredFuelLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(log.amountPkr)} · {log.litres}L
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(log.date).toLocaleString("en-PK", {
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {log.receiptUrl && (
                          <button
                            onClick={() => openReceiptImage(log.receiptUrl!)}
                            className="relative group shrink-0"
                          >
                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 transition-all active:scale-95 group-hover:opacity-90">
                              <Image
                                src={log.receiptUrl}
                                alt="Fuel Receipt"
                                width={56}
                                height={56}
                                unoptimized
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-md p-0.5 border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <p className="text-[7px] font-bold text-slate-700">OPEN</p>
                            </div>
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        {log.pumpName && <span>Pump: {log.pumpName}</span>}
                        {log.odometer !== undefined && <span>Odometer: {log.odometer} km</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

      </div>

      {activeTab === "rides" && filteredRides.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pointer-events-none">
          <div className="bg-brand-elevated border border-slate-200/50 rounded-2xl px-4 py-3 shadow-lg shadow-black/40 pointer-events-auto">
            <p className="text-sm font-semibold text-slate-900 text-center">
              Total:{" "}
              <span className="text-slate-600 font-normal">{filteredRides.length} rides</span>
              <span className="text-slate-600 mx-1">·</span>
              <span className="text-accent-green">{formatCurrency(totalRevenue)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
