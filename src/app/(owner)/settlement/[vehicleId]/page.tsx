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
  const { settlements, markSettled } = useSettlementStore();

  const [vehicleId, setVehicleId] = useState(params.vehicleId || "v1");
  const [year,      setYear]      = useState(2026);
  const [month,     setMonth]     = useState(4); // 0-indexed: 4 = May
  const [isSettled, setIsSettled] = useState(false);

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
  const platformComm = Math.round(grossRevenue * 0.12);
  const fuelExp      = periodExpenses.filter((e) => e.category === "fuel").reduce((s, e) => s + e.amount, 0);
  const maintExp     = periodExpenses.filter((e) => e.category === "maintenance" || e.category === "oil_change").reduce((s, e) => s + e.amount, 0);
  const otherExp     = periodExpenses.filter((e) => !["fuel", "maintenance", "oil_change"].includes(e.category)).reduce((s, e) => s + e.amount, 0);
  const netAfterExp  = grossRevenue - platformComm - fuelExp - maintExp - otherExp;
  const driverSalary = driver?.salaryType === "fixed" ? driver.salaryAmount : 0;
  const ownerProfit  = netAfterExp - driverSalary;

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
            className="w-full appearance-none bg-brand-surface text-sm text-white border border-slate-700 rounded-xl py-3 pl-4 pr-10 outline-none focus:ring-2 focus:ring-accent-green focus:border-accent-green"
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
            className="w-9 h-9 rounded-full bg-brand-surface border border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} className="text-slate-300" />
          </button>
          <p className="text-lg font-medium text-white text-center">{periodLabel}</p>
          <button
            type="button"
            onClick={nextMonth}
            className="w-9 h-9 rounded-full bg-brand-surface border border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        </div>

        {/* Calculation card */}
        <Card>
          <div className="p-2">
            <SettlementRow label="Gross Revenue"               amount={grossRevenue}  type="revenue" />
            <div className="border-b border-slate-700 my-2" />
            <SettlementRow label={`− Platform Commission (12%)`} amount={platformComm}  type="expense" />
            <SettlementRow label="− Fuel"                       amount={fuelExp}        type="expense" />
            <SettlementRow label="− Maintenance"                amount={maintExp}       type="expense" />
            <SettlementRow label="− Other Expenses"             amount={otherExp}       type="expense" />
            <div className="border-b border-slate-700 my-2" />
            <SettlementRow label="Net After Expenses"           amount={netAfterExp}    type="neutral" />
            <SettlementRow label="− Driver Salary (Fixed)"      amount={driverSalary}   type="salary"  />
            <div className="border-b-2 border-accent-green my-3" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold text-accent-green uppercase tracking-wide">YOUR PROFIT</p>
                <p className="text-[10px] text-accent-green/60 mt-0.5 font-[system-ui]" dir="rtl">آپ کا منافع</p>
              </div>
              <span className="text-2xl font-bold text-accent-green tabular-nums">
                {formatCurrency(ownerProfit)}
              </span>
            </div>
          </div>
        </Card>

        {/* Settle button */}
        {isSettled ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-greenDim border border-accent-green/30">
            <CheckCircle2 size={18} className="text-accent-green" />
            <span className="text-sm font-semibold text-accent-green">Settled ✓</span>
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
              <p className="text-base font-bold text-white">Past Settlements</p>
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
                    className="w-full flex items-center justify-between py-3.5 border-b border-slate-800 last:border-0 active:opacity-70 transition-opacity"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{monthLabel}</p>
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
