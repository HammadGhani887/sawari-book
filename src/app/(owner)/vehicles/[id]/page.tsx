"use client";

import { useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { ScreenHeader, Card, DateRangeSelector, Badge } from "@/components/ui";
import { RideEntryCard, ExpenseCard, SettlementRow } from "@/components/cards";
import PlatformBadge from "@/components/ui/PlatformBadge";
import { formatCurrency } from "@/lib/utils/format";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useExpenseStore } from "@/lib/store/expenseStore";
import { useDriverStore } from "@/lib/store/driverStore";

type DateRange = "today" | "week" | "month" | "custom";
type TabId     = "rides" | "expenses" | "summary";

const WEEK_START = "2026-05-01";

function Stat({ icon, value, label, colorClass = "text-white" }: {
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

  const vehicle  = useVehicleStore((s) => s.vehicles.find((v) => v.id === vehicleId));
  const drivers  = useDriverStore((s) => s.drivers);
  const allRides = useRideStore((s) => s.rides);
  const { expenses, approveExpense, rejectExpense } = useExpenseStore();

  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [activeTab, setActiveTab]  = useState<TabId>("rides");

  const driver = drivers.find((d) => d.vehicleId === vehicleId);

  const filteredRides = useMemo(() => {
    const vRides = allRides.filter((r) => r.vehicleId === vehicleId);
    if (dateRange === "today") return vRides.filter((r) => r.rideTime.startsWith(TODAY));
    if (dateRange === "week")  return vRides.filter((r) => r.rideTime.slice(0, 10) >= WEEK_START);
    return vRides; // month / custom — show all for mock
  }, [allRides, vehicleId, dateRange]);

  const filteredExpenses = useMemo(() => {
    const vExp = expenses.filter((e) => e.vehicleId === vehicleId);
    if (dateRange === "today") return vExp.filter((e) => e.date.startsWith(TODAY));
    if (dateRange === "week")  return vExp.filter((e) => e.date.slice(0, 10) >= WEEK_START);
    return vExp;
  }, [expenses, vehicleId, dateRange]);

  const totalRevenue  = filteredRides.reduce((s, r) => s + r.fareAmount, 0);
  const totalExpenses = filteredExpenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + e.amount, 0);

  const TABS: { id: TabId; label: string }[] = [
    { id: "rides",    label: "Rides"    },
    { id: "expenses", label: "Expenses" },
    { id: "summary",  label: "Summary"  },
  ];

  const title = vehicle
    ? `${vehicle.makeModel} · ${vehicle.plateNumber}`
    : "Vehicle";

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title={title} showBack />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-28">

        {/* ── Vehicle info ── */}
        <Card>
          <div className="flex items-start gap-4">
            <span className="text-4xl leading-none shrink-0">🚗</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white leading-tight">
                {vehicle?.makeModel ?? "—"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge type="inactive" label={vehicle?.fuelType ?? "petrol"} />
                {vehicle?.platforms.map((p) => (
                  <PlatformBadge key={p} platform={p as "indrive" | "yango" | "other" | "private"} />
                ))}
              </div>
              {driver && (
                <a
                  href={`tel:+92${driver.phone.replace(/\D/g, "").slice(-10)}`}
                  className="flex items-center gap-1.5 mt-2 text-accent-green active:opacity-70 transition-opacity w-fit"
                >
                  <Phone size={13} />
                  <span className="text-xs font-medium">{driver.name} · {driver.phone}</span>
                </a>
              )}
            </div>
          </div>
        </Card>

        {/* ── Date range ── */}
        <DateRangeSelector selected={dateRange} onChange={setDateRange} />

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-3 gap-2">
          <Stat icon="🚗" value={String(filteredRides.length)} label="Rides" />
          <Stat icon="💰" value={formatCurrency(totalRevenue)}  label="Revenue"  colorClass="text-accent-green" />
          <Stat icon="🧾" value={formatCurrency(totalExpenses)} label="Expenses" colorClass="text-status-amber" />
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-slate-700/50">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={[
                "flex-1 py-2.5 text-sm font-semibold transition-colors",
                activeTab === id
                  ? "border-b-2 border-accent-green text-white"
                  : "text-slate-500",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
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
            <SettlementRow label="Total Revenue"  amount={totalRevenue}  type="revenue" />
            <SettlementRow label="Total Expenses" amount={totalExpenses} type="expense" />
            <SettlementRow label="Net"            amount={totalRevenue - totalExpenses} type="profit" />
          </Card>
        )}

      </div>

      {/* ── Sticky rides total ── */}
      {activeTab === "rides" && filteredRides.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pointer-events-none">
          <div className="bg-brand-elevated border border-slate-700/50 rounded-2xl px-4 py-3 shadow-lg shadow-black/40 pointer-events-auto">
            <p className="text-sm font-semibold text-white text-center">
              Total:{" "}
              <span className="text-slate-400 font-normal">{filteredRides.length} rides</span>
              <span className="text-slate-600 mx-1">·</span>
              <span className="text-accent-green">{formatCurrency(totalRevenue)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
