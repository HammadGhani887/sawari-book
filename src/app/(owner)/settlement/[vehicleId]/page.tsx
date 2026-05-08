"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { ScreenHeader, Card, Button } from "@/components/ui";
import { SettlementRow } from "@/components/cards";
import { formatCurrency } from "@/lib/utils/format";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useDriverStore } from "@/lib/store/driverStore";
import { useSettlementStore } from "@/lib/store/settlementStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { exportToPDF } from "@/lib/utils/pdfExport";

const MONTH_NAMES = [
  "January", "February", "March",     "April",
  "May",     "June",     "July",      "August",
  "September","October", "November",  "December",
];

export default function SettlementPage({ params }: { params: { vehicleId: string } }) {
  const vehicles   = useVehicleStore((s) => s.vehicles);
  const rides      = useRideStore((s) => s.rides);
  const expenses   = useExpenseStore((s) => s.expenses);
  const drivers    = useDriverStore((s) => s.drivers);
  const fuelLogs   = useFuelStore((s) => s.fuelLogs);
  const { settlements, upsertSettlement } = useSettlementStore();
  const ownerId    = useAuthStore((s) => s.user?.id ?? "");

  const now = new Date();
  const [vehicleId, setVehicleId] = useState(params.vehicleId || vehicles[0]?.id || "");
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState(now.getMonth()); // 0-indexed
  const [isSettled, setIsSettled] = useState(false);

  // Platform commission — owner can set to 0 if not applicable
  const [commRate, setCommRate] = useState(0); // default 0% — owner sets manually

  const driver  = drivers.find((d) => d.vehicleId === vehicleId);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const periodLabel = `1 ${MONTH_NAMES[month]} — ${lastDay} ${MONTH_NAMES[month]} ${year}`;

  const periodStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const periodEnd   = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Compute settlement figures from store data
  const periodRides = useMemo(
    () => rides.filter((r) => r.vehicleId === vehicleId && r.rideTime.slice(0, 10) >= periodStart && r.rideTime.slice(0, 10) <= periodEnd),
    [rides, vehicleId, periodStart, periodEnd]
  );

  const periodExpenses = useMemo(
    () => expenses.filter((e) => e.vehicleId === vehicleId && e.status === "approved" && e.date.slice(0, 10) >= periodStart && e.date.slice(0, 10) <= periodEnd),
    [expenses, vehicleId, periodStart, periodEnd]
  );

  const grossRevenue = periodRides.reduce((s, r) => s + r.fareAmount, 0);
  const platformComm = Math.round(grossRevenue * (commRate / 100));
  const fuelExp      = periodExpenses.filter((e) => e.category === "fuel").reduce((s, e) => s + e.amount, 0);
  const maintExp     = periodExpenses.filter((e) => e.category === "maintenance" || e.category === "oil_change").reduce((s, e) => s + e.amount, 0);
  const otherExp     = periodExpenses.filter((e) => !["fuel", "maintenance", "oil_change"].includes(e.category)).reduce((s, e) => s + e.amount, 0);

  // Fuel logs for the period (actual fill-ups)
  const periodFuelLogs = fuelLogs.filter((f) => f.vehicleId === vehicleId && f.date.slice(0, 10) >= periodStart && f.date.slice(0, 10) <= periodEnd);
  const actualFuelCost = periodFuelLogs.reduce((s, f) => s + f.amountPkr, 0);
  // Estimated fuel from rides (if no actual logs)
  const estFuelFromRides = periodRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
  const totalFuelCost = actualFuelCost > 0 ? actualFuelCost : fuelExp > 0 ? fuelExp : estFuelFromRides;

  const netAfterExp  = grossRevenue - platformComm - totalFuelCost - maintExp - otherExp;

  // Salary: fixed or percentage
  const driverSalary = driver?.salaryType === "fixed"
    ? driver.salaryAmount
    : driver?.salaryType === "percentage"
    ? Math.round(grossRevenue * (driver.salaryAmount / 100))
    : 0;

  const ownerProfit  = netAfterExp - driverSalary;
  const totalExpenses = totalFuelCost + maintExp + otherExp;

  // Past settlements for this vehicle (settled ones, excluding current month)
  const pastSettlements = useMemo(
    () =>
      settlements
        .filter((s) => s.vehicleId === vehicleId && s.status === "settled")
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
        .slice(0, 3),
    [settlements, vehicleId]
  );

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  function handleSettle() {
    if (!window.confirm("Are you sure you want to record this settlement?")) return;
    if (!driver) { toast.error("No driver assigned to this vehicle"); return; }

    upsertSettlement({
      id:            `s-${vehicleId}-${periodStart}`,
      ownerId,
      driverId:      driver.id,
      vehicleId,
      periodStart,
      periodEnd,
      totalRevenue:  grossRevenue,
      totalExpenses,
      driverSalary,
      ownerProfit,
      status:        "settled",
      settledAt:     new Date().toISOString(),
    });

    // Notify driver about settlement
    const addNotif = useNotificationStore.getState().addNotification;
    addNotif({
      userId: driver.userId,
      type:   "settlement_ready",
      title:  `Settlement done — ${MONTH_NAMES[month]} ${year}`,
      body:   `Your salary: Rs ${driverSalary.toLocaleString()} · Owner profit: Rs ${ownerProfit.toLocaleString()}`,
    });

    setIsSettled(true);
    toast.success("Settlement recorded ✓");
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Settlement" titleUrdu="حساب کتاب" showBack />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-8">

        {/* Vehicle selector */}
        <div className="relative">
          <select
            value={vehicleId}
            onChange={(e) => { setVehicleId(e.target.value); setIsSettled(false); }}
            className="w-full appearance-none bg-white shadow-sm text-sm text-slate-900 border border-slate-200 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-accent-green focus:border-accent-green"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.makeModel} · {v.plateNumber}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* Period navigator */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={prevMonth}
            className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-slate-700" />
          </button>
          <p className="text-lg font-medium text-slate-900 text-center">{periodLabel}</p>
          <button
            type="button"
            onClick={nextMonth}
            className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={18} className="text-slate-700" />
          </button>
        </div>

        {/* Calculation card */}
        <Card>
          <div className="p-2">
            <SettlementRow label="Gross Revenue" amount={grossRevenue} type="revenue" />
            <div className="border-b border-slate-200 my-2" />

            {/* Platform commission — editable */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-600">− Platform Commission</span>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-0.5">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={commRate}
                    onChange={(e) => setCommRate(Math.max(0, Math.min(50, Number(e.target.value))))}
                    className="w-8 bg-transparent text-xs text-slate-700 text-center outline-none tabular-nums"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
                {commRate === 0 && <span className="text-[10px] text-slate-400">tap % to set</span>}
              </div>
              <span className="text-sm font-semibold text-status-red tabular-nums">
                − {formatCurrency(platformComm)}
              </span>
            </div>

            <SettlementRow label={`− Fuel${actualFuelCost === 0 && estFuelFromRides > 0 ? " (est.)" : ""}`} amount={totalFuelCost} type="expense" />
            <SettlementRow label="− Maintenance"   amount={maintExp}  type="expense" />
            <SettlementRow label="− Other Expenses" amount={otherExp}  type="expense" />
            <div className="border-b border-slate-200 my-2" />
            <SettlementRow label="Net After Expenses" amount={netAfterExp} type="neutral" />
            <SettlementRow
              label={`− Driver Salary (${driver?.salaryType === "percentage" ? `${driver.salaryAmount}%` : "Fixed"})`}
              amount={driverSalary}
              type="salary"
            />
            <div className="border-b-2 border-accent-green my-3" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-accent-green uppercase tracking-wide">YOUR PROFIT</p>
                <p className="text-[10px] text-accent-green/60 mt-0.5 font-[system-ui]" dir="rtl">آپ کا منافع</p>
              </div>
              <span className={`text-2xl font-bold tabular-nums ${ownerProfit >= 0 ? "text-accent-green" : "text-status-red"}`}>
                {formatCurrency(ownerProfit)}
              </span>
            </div>
          </div>
        </Card>

        {/* Settle button */}
        {isSettled ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-greenDim border border-accent-green/30">
              <CheckCircle2 size={18} className="text-accent-green" />
              <span className="text-sm font-semibold text-accent-green">Settled ✓</span>
            </div>
            <button
              onClick={() => {
                const vehicle = vehicles.find((v) => v.id === vehicleId);
                exportToPDF({
                  title:       "Settlement Report",
                  period:      periodLabel,
                  vehicleName: vehicle ? `${vehicle.makeModel} · ${vehicle.plateNumber}` : vehicleId,
                  rows: [
                    { label: "Gross Revenue",          value: formatCurrency(grossRevenue),   color: "green" },
                    { label: "Platform Commission 12%", value: `− ${formatCurrency(platformComm)}`, color: "amber" },
                    { label: "Fuel Cost",               value: `− ${formatCurrency(totalFuelCost)}`, color: "amber" },
                    { label: "Maintenance",             value: `− ${formatCurrency(maintExp)}`, color: "amber" },
                    { label: "Other Expenses",          value: `− ${formatCurrency(otherExp)}`, color: "amber" },
                    { label: "Net After Expenses",      value: formatCurrency(netAfterExp) },
                    { label: `Driver Salary`,           value: `− ${formatCurrency(driverSalary)}`, color: "amber" },
                    { label: "Owner Profit",            value: formatCurrency(ownerProfit), color: ownerProfit >= 0 ? "green" : "red", bold: true },
                  ],
                });
              }}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium active:opacity-70 transition-opacity"
            >
              Export PDF 📄
            </button>
            <button
              onClick={() => {
                const vehicle = vehicles.find((v) => v.id === vehicleId);
                const vName = vehicle ? `${vehicle.makeModel} · ${vehicle.plateNumber}` : "";
                const msg = encodeURIComponent(
                  `💰 *Settlement — ${periodLabel}*\n` +
                  `🚗 ${vName}\n\n` +
                  `📈 Gross Revenue: Rs ${grossRevenue.toLocaleString()}\n` +
                  `⛽ Fuel: Rs ${totalFuelCost.toLocaleString()}\n` +
                  `🧾 Expenses: Rs ${(maintExp + otherExp).toLocaleString()}\n` +
                  `💼 Driver Salary: Rs ${driverSalary.toLocaleString()}\n\n` +
                  `✅ *Owner Profit: Rs ${ownerProfit.toLocaleString()}*\n\n` +
                  `_Sent from Sawari Book_`
                );
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
              className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-sm font-medium active:opacity-70 transition-opacity flex items-center justify-center gap-2"
            >
              <span style={{ color: "#25D366" }}>📱</span> Share via WhatsApp
            </button>
          </div>
        ) : (
          <div>
            <Button variant="primary" fullWidth onClick={handleSettle}>
              Mark as Settled ✓
            </Button>
            <p className="text-center text-[11px] text-slate-600 mt-1.5" dir="rtl">حساب مکمل ✓</p>
          </div>
        )}

        {/* Past settlements */}
        {pastSettlements.length > 0 && (
          <div className="mt-2">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-base font-bold text-slate-900">Past Settlements</p>
              <p className="text-[10px] text-slate-600 font-[system-ui]" dir="rtl">گزشتہ حساب</p>
            </div>
            <Card>
              {pastSettlements.map((s) => {
                const monthLabel = new Date(s.periodStart + "T00:00:00Z")
                  .toLocaleString("en-PK", { month: "long", year: "numeric" });
                const settledLabel = s.settledAt
                  ? new Date(s.settledAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                  : "";
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toast(`${monthLabel}: ${formatCurrency(s.ownerProfit)} profit · settled ${settledLabel}`)}
                    className="w-full flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 active:opacity-70 transition-opacity"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
                      <p className="text-xs text-accent-green font-medium mt-0.5">{formatCurrency(s.ownerProfit)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Settled {settledLabel}</span>
                      <CheckCircle2 size={14} className="text-accent-green" />
                    </div>
                  </button>
                );
              })}
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
