"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Phone, User, Pencil, Check, X } from "lucide-react";
import { ScreenHeader, Card, DateRangeSelector, Badge } from "@/components/ui";
import { ProfitLineChart } from "@/components/charts";
import { formatCurrency } from "@/lib/utils/format";
import { useDriverStore } from "@/lib/store/driverStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useSettlementStore } from "@/lib/store/settlementStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";
import type { SalaryType } from "@/lib/types";

type DateRange = "today" | "week" | "month" | "custom";

const WEEK_START = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
})();

const SALARY_TYPES: { id: SalaryType; label: string }[] = [
  { id: "fixed",      label: "Fixed Monthly" },
  { id: "percentage", label: "% of Revenue"  },
];

interface ActivityEntry {
  time: string; icon: string; description: string;
  sub: string; amount: string; dotColor: string; amountColor: string;
}

function ActivityRow({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
  return (
    <div className="flex items-start">
      <div className="w-[4.5rem] shrink-0 text-right pr-3 pt-0.5">
        <span className="text-xs text-slate-500 leading-tight">{entry.time}</span>
      </div>
      <div className="flex flex-col items-center shrink-0 self-stretch w-3">
        <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: entry.dotColor }} />
        {!isLast && <div className="w-px flex-1 mt-1 bg-slate-200" />}
      </div>
      <div className="flex-1 pl-3 pb-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-800 leading-snug">{entry.icon} {entry.description}</p>
          <p className={`text-sm font-semibold tabular-nums shrink-0 leading-snug ${entry.amountColor}`}>{entry.amount}</p>
        </div>
        {entry.sub && <p className="text-xs text-slate-500 mt-0.5">{entry.sub}</p>}
      </div>
    </div>
  );
}

function DriverStat({ icon, value, label, colorClass = "text-slate-900" }: {
  icon: string; value: string; label: string; colorClass?: string;
}) {
  return (
    <div className="bg-brand-surface rounded-2xl flex flex-col items-center gap-2 py-4 px-2 text-center">
      <span className="text-2xl leading-none">{icon}</span>
      <span className={`text-xl font-bold tabular-nums leading-none ${colorClass}`}>{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">{label}</span>
    </div>
  );
}

export default function DriverDetailPage({ params }: { params: { id: string } }) {
  const driverId = params.id;

  const driver      = useDriverStore((s) => s.drivers.find((d) => d.id === driverId));
  const updateDriver = useDriverStore((s) => s.updateDriver);
  const vehicles    = useVehicleStore((s) => s.vehicles);
  const allRides    = useRideStore((s) => s.rides);
  const expenses    = useExpenseStore((s) => s.expenses);
  const fuelLogs    = useFuelStore((s) => s.fuelLogs);
  const settlements = useSettlementStore((s) => s.settlements);

  const [dateRange, setDateRange] = useState<DateRange>("month");

  // Salary edit state
  const [editingSalary,  setEditingSalary]  = useState(false);
  const [salaryType,     setSalaryType]     = useState<SalaryType>(driver?.salaryType ?? "fixed");
  const [salaryAmount,   setSalaryAmount]   = useState(String(driver?.salaryAmount ?? 0));

  // Daily target edit state
  const [editingTarget,  setEditingTarget]  = useState(false);
  const [targetInput,    setTargetInput]    = useState(String(driver?.dailyTargetPkr ?? ""));

  const vehicle = vehicles.find((v) => v.id === driver?.vehicleId);

  const driverRides = useMemo(() => {
    const all = allRides.filter((r) => r.driverId === driverId);
    if (dateRange === "today") return all.filter((r) => r.rideTime.startsWith(TODAY));
    if (dateRange === "week")  return all.filter((r) => r.rideTime.slice(0, 10) >= WEEK_START);
    return all;
  }, [allRides, driverId, dateRange]);

  const pendingExpenses = useMemo(
    () => expenses.filter((e) => e.loggedBy === driverId && e.status === "pending"),
    [expenses, driverId]
  );

  // This month stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRides = allRides.filter((r) => r.driverId === driverId && r.rideTime.startsWith(thisMonth));
  const thisMonthRevenue = thisMonthRides.reduce((s, r) => s + r.fareAmount, 0);
  const thisMonthFuel = fuelLogs.filter((f) => f.vehicleId === driver?.vehicleId && f.date.startsWith(thisMonth)).reduce((s, f) => s + f.amountPkr, 0);
  const estFuelFromRides = thisMonthRides.reduce((s, r) => s + (r.estimatedFuelCost ?? 0), 0);
  const fuelCost = thisMonthFuel > 0 ? thisMonthFuel : estFuelFromRides;
  const salary = driver?.salaryType === "fixed"
    ? driver.salaryAmount
    : driver?.salaryType === "percentage"
    ? Math.round(thisMonthRevenue * (driver.salaryAmount / 100))
    : 0;

  const recentActivity = useMemo((): ActivityEntry[] => {
    const rideEntries: ActivityEntry[] = allRides
      .filter((r) => r.driverId === driverId).slice(0, 5)
      .map((r) => ({
        time:        new Date(r.rideTime).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        "🚗",
        description: `${r.platform === "indrive" ? "inDrive" : r.platform === "yango" ? "Yango" : "Other"} · ${r.dropoffArea ?? ""}`.trimEnd().replace(/ ·$/, ""),
        sub:         r.paymentType === "cash" ? "Cash" : "Wallet",
        amount:      `+${formatCurrency(r.fareAmount)}`,
        dotColor:    "#10B981",
        amountColor: "text-accent-green",
      }));

    const expenseEntries: ActivityEntry[] = expenses
      .filter((e) => e.loggedBy === driverId).slice(0, 3)
      .map((e) => ({
        time:        new Date(e.date).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }),
        icon:        e.category === "fuel" ? "⛽" : "🧾",
        description: e.note ?? e.category,
        sub:         e.status === "pending" ? "Pending" : e.status === "approved" ? "Approved" : "Rejected",
        amount:      `−${formatCurrency(e.amount)}`,
        dotColor:    e.status === "pending" ? "#64748B" : "#F59E0B",
        amountColor: "text-status-amber",
      }));

    return [...rideEntries, ...expenseEntries]
      .sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
  }, [allRides, expenses, driverId]);

  const chartData = useMemo(() => {
    return settlements
      .filter((s) => s.driverId === driverId && s.status === "settled")
      .slice(-4)
      .map((s) => ({
        week:   new Date(s.periodStart).toLocaleString("en-PK", { month: "short" }),
        profit: s.totalRevenue,
      }));
  }, [settlements, driverId]);

  const totalRides   = driverRides.length;
  const totalRevenue = driverRides.reduce((s, r) => s + r.fareAmount, 0);
  const avgDaily     = totalRevenue > 0 ? Math.round(totalRevenue / Math.max(driverRides.length / 6, 1)) : 0;
  const initials     = driver?.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  async function saveSalary() {
    const amt = Number(salaryAmount);
    if (amt < 0) { toast.error("Enter valid amount"); return; }
    
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/drivers/${driverId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ salaryType, salaryAmount: amt }),
      });

      if (!res.ok) {
        toast.error("Failed to update salary");
        return;
      }

      const updated = await res.json();
      updateDriver(driverId, updated);
      toast.success("Salary updated ✓");
      setEditingSalary(false);
    } catch {
      toast.error("Network error");
    }
  }

  async function saveTarget() {
    const t = Number(targetInput);
    if (t < 0) { toast.error("Enter valid target"); return; }
    
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/drivers/${driverId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ dailyTargetPkr: t > 0 ? t : null }),
      });

      if (!res.ok) {
        toast.error("Failed to update target");
        return;
      }

      const updated = await res.json();
      updateDriver(driverId, updated);
      toast.success("Daily target updated ✓");
      setEditingTarget(false);
    } catch {
      toast.error("Network error");
    }
  }

  const salaryLabel = driver?.salaryType === "fixed"
    ? `Fixed ${formatCurrency(driver.salaryAmount)}/month`
    : driver?.salaryType === "percentage"
    ? `${driver.salaryAmount}% of revenue`
    : "Not set";

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title={driver?.name ?? "Driver"}
        showBack
        rightAction={
          <div className="w-8 h-8 rounded-full bg-brand-elevated flex items-center justify-center">
            <User size={16} className="text-slate-600" />
          </div>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

        {pendingExpenses.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-status-amberDim border border-status-amber/20 rounded-xl px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none shrink-0">⚠️</span>
              <p className="text-sm text-status-amber font-medium">
                {pendingExpenses.length} expense{pendingExpenses.length > 1 ? "s" : ""} pending approval
              </p>
            </div>
            <Link href="/expenses"
              className="shrink-0 text-xs font-semibold text-status-amber border border-status-amber/40 rounded-lg px-3 py-1.5 active:opacity-70 transition-opacity">
              Review
            </Link>
          </div>
        )}

        {/* Driver info */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-elevated flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-slate-700">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold text-slate-900">{driver?.name}</p>
                <Badge type={driver?.isActive ? "active" : "inactive"} />
              </div>
              {driver && (
                <a href={`tel:+92${driver.phone.replace(/\D/g, "").slice(-10)}`}
                  className="flex items-center gap-1.5 mt-1 text-accent-green active:opacity-70 w-fit">
                  <Phone size={12} />
                  <span className="text-xs font-medium">{driver.phone}</span>
                </a>
              )}
              <div className="mt-2 space-y-0.5">
                {driver?.cnic && <p className="text-xs text-slate-600"><span className="text-slate-500">CNIC: </span>{driver.cnic}</p>}
                {vehicle && <p className="text-xs text-slate-600"><span className="text-slate-500">Vehicle: </span>{vehicle.makeModel} · {vehicle.plateNumber}</p>}
                {driver && <p className="text-xs text-slate-500 mt-1">Since {driver.startDate}</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* ── Salary card ── */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Salary Structure</p>
              <p className="text-[10px] text-slate-400 mt-0.5" dir="rtl">تنخواہ کا طریقہ</p>
            </div>
            {!editingSalary ? (
              <button onClick={() => { setSalaryType(driver?.salaryType ?? "fixed"); setSalaryAmount(String(driver?.salaryAmount ?? 0)); setEditingSalary(true); }}
                className="flex items-center gap-1 text-accent-green text-xs font-semibold">
                <Pencil size={12} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveSalary} className="flex items-center gap-1 text-accent-green text-xs font-semibold">
                  <Check size={13} /> Save
                </button>
                <button onClick={() => setEditingSalary(false)} className="flex items-center gap-1 text-slate-400 text-xs">
                  <X size={13} /> Cancel
                </button>
              </div>
            )}
          </div>

          {editingSalary ? (
            <div className="flex flex-col gap-3">
              {/* Type selector */}
              <div className="flex gap-2">
                {SALARY_TYPES.map((t) => (
                  <button key={t.id} onClick={() => setSalaryType(t.id)}
                    className={["flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                      salaryType === t.id ? "border-accent-green bg-accent-greenDim text-accent-green" : "border-slate-200 text-slate-600"
                    ].join(" ")}>
                    {t.label}
                  </button>
                ))}
              </div>
              {/* Amount */}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  {salaryType === "fixed" ? "Monthly Amount (Rs)" : "Percentage (%)"}
                </p>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-accent-green">
                  {salaryType === "fixed" && <span className="text-slate-500 text-sm mr-2">Rs</span>}
                  <input
                    type="number"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    placeholder={salaryType === "fixed" ? "e.g. 25000" : "e.g. 20"}
                    className="flex-1 bg-transparent text-slate-900 text-sm outline-none"
                  />
                  {salaryType === "percentage" && <span className="text-slate-500 text-sm ml-2">%</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Salary Type</span>
                <span className="text-sm font-semibold text-slate-900">
                  {driver?.salaryType === "fixed" ? "Fixed Monthly" : driver?.salaryType === "percentage" ? "% of Revenue" : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Amount</span>
                <span className="text-base font-bold text-accent-blue">{salaryLabel}</span>
              </div>
              {/* This month salary estimate */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">This Month (est.)</span>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(salary)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* ── Daily Target card ── */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily Revenue Target</p>
              <p className="text-[10px] text-slate-400 mt-0.5" dir="rtl">روزانہ ہدف</p>
            </div>
            {!editingTarget ? (
              <button onClick={() => { setTargetInput(String(driver?.dailyTargetPkr ?? "")); setEditingTarget(true); }}
                className="flex items-center gap-1 text-accent-green text-xs font-semibold">
                <Pencil size={12} /> {driver?.dailyTargetPkr ? "Edit" : "Set"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveTarget} className="flex items-center gap-1 text-accent-green text-xs font-semibold">
                  <Check size={13} /> Save
                </button>
                <button onClick={() => setEditingTarget(false)} className="flex items-center gap-1 text-slate-400 text-xs">
                  <X size={13} /> Cancel
                </button>
              </div>
            )}
          </div>

          {editingTarget ? (
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-accent-green">
              <span className="text-slate-500 text-sm mr-2">Rs</span>
              <input
                type="number"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="e.g. 3000"
                className="flex-1 bg-transparent text-slate-900 text-sm outline-none"
              />
              <span className="text-slate-500 text-sm">/day</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Target</span>
              <span className="text-base font-bold text-accent-green">
                {driver?.dailyTargetPkr ? formatCurrency(driver.dailyTargetPkr) + "/day" : "Not set"}
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-2">Driver sees a progress bar on their home screen.</p>
        </Card>

        {/* This month profit summary */}
        {thisMonthRevenue > 0 && (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">This Month Summary</p>
            <div className="flex flex-col gap-0">
              {[
                { label: "Revenue",       value: formatCurrency(thisMonthRevenue), color: "text-accent-green" },
                { label: `Fuel Cost${thisMonthFuel === 0 && estFuelFromRides > 0 ? " (est.)" : ""}`, value: formatCurrency(fuelCost), color: "text-status-amber" },
                { label: "Driver Salary", value: formatCurrency(salary),           color: "text-accent-blue"  },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-accent-green">
                <span className="text-sm font-bold text-slate-900">Owner Profit (est.)</span>
                <span className={`text-base font-bold tabular-nums ${thisMonthRevenue - fuelCost - salary >= 0 ? "text-accent-green" : "text-status-red"}`}>
                  {formatCurrency(thisMonthRevenue - fuelCost - salary)}
                </span>
              </div>
            </div>
          </Card>
        )}

        <DateRangeSelector selected={dateRange} onChange={setDateRange} />

        <div className="grid grid-cols-2 gap-3">
          <DriverStat icon="🚗" value={String(totalRides)}          label="Rides"     />
          <DriverStat icon="💰" value={formatCurrency(totalRevenue)} label="Revenue"   colorClass="text-accent-green" />
          <DriverStat icon="💼" value={salaryLabel}                  label="Salary"    colorClass="text-accent-blue"  />
          <DriverStat icon="📈" value={formatCurrency(avgDaily)}     label="Avg Daily" colorClass="text-accent-green" />
        </div>

        {chartData.length > 0 && (
          <Card>
            <p className="text-sm font-medium text-slate-700 mb-3">Monthly Revenue Trend</p>
            <ProfitLineChart data={chartData} height={160} />
          </Card>
        )}

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-base font-bold text-slate-900">Recent Activity</p>
            <p className="text-[10px] text-slate-600" dir="rtl">حالیہ سرگرمی</p>
          </div>
          <Card>
            {recentActivity.length > 0 ? recentActivity.map((entry, i) => (
              <ActivityRow key={i} entry={entry} isLast={i === recentActivity.length - 1} />
            )) : (
              <p className="text-sm text-slate-500 text-center py-6">No activity yet</p>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
