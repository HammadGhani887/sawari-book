"use client";

import { useMemo, useState } from "react";
import { Funnel } from "lucide-react";
import { ScreenHeader, DateRangeSelector } from "@/components/ui";
import { RideEntryCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils/format";
import { useRideStore, TODAY } from "@/lib/store/rideStore";
import { useDriverStore } from "@/lib/store/driverStore";
import type { Ride } from "@/lib/types";

type DateRange = "today" | "week" | "month" | "custom";

const WEEK_START = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
})();

const THIS_MONTH = new Date().toISOString().slice(0, 7);

const PLATFORM_OPTIONS = [
  { id: "all",     label: "All"     },
  { id: "indrive", label: "inDrive" },
  { id: "yango",   label: "Yango"   },
  { id: "other",   label: "Other"   },
] as const;

const PAYMENT_OPTIONS = [
  { id: "all",    label: "All"    },
  { id: "cash",   label: "Cash"   },
  { id: "wallet", label: "Wallet" },
] as const;

function formatDateLabel(dateStr: string): string {
  const today     = TODAY;
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  if (dateStr === today)     return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 shrink-0",
        active
          ? "bg-accent-green text-white"
          : "bg-brand-surface border border-slate-200 text-slate-600",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function AllRidesPage() {
  const rides   = useRideStore((s) => s.rides);
  const flagRide = useRideStore((s) => s.flagRide);
  const drivers = useDriverStore((s) => s.drivers);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [platform,     setPlatform]     = useState("all");
  const [payment,      setPayment]      = useState("all");
  const [dateRange,    setDateRange]    = useState<DateRange>("today");

  const driverMap = useMemo(
    () => Object.fromEntries(drivers.map((d) => [d.id, d.name])),
    [drivers]
  );

  const filteredRides = useMemo(() => {
    return rides.filter((r) => {
      if (platform !== "all" && r.platform !== platform) return false;
      if (payment  !== "all" && r.paymentType !== payment) return false;
      const date = r.rideTime.slice(0, 10);
      if (dateRange === "today" && date !== TODAY) return false;
      if (dateRange === "week"  && date < WEEK_START) return false;
      if (dateRange === "month" && !r.rideTime.startsWith(THIS_MONTH)) return false;
      return true;
    });
  }, [rides, platform, payment, dateRange]);

  const grouped = useMemo(() => {
    const map = new Map<string, Ride[]>();
    for (const ride of filteredRides) {
      const date = ride.rideTime.slice(0, 10);
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(ride);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRides]);

  const totalRevenue  = filteredRides.reduce((s, r) => s + r.fareAmount, 0);
  const cashCount     = filteredRides.filter((r) => r.paymentType === "cash").length;
  const disputedCount = filteredRides.filter((r) => r.isDisputed).length;
  const cashPct       = filteredRides.length > 0
    ? Math.round((cashCount / filteredRides.length) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader
        title="All Rides"
        titleUrdu="تمام سواریاں"
        rightAction={
          <button
            type="button"
            onClick={() => setIsFilterOpen((o) => !o)}
            className={[
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isFilterOpen ? "bg-accent-green" : "bg-brand-elevated",
            ].join(" ")}
          >
            <Funnel size={15} className={isFilterOpen ? "text-white" : "text-slate-600"} />
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-3 pb-6">

        {isFilterOpen && (
          <div className="flex flex-col gap-3 bg-brand-surface border border-slate-200/30 rounded-2xl p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Date</p>
              <DateRangeSelector selected={dateRange} onChange={setDateRange} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Platform</p>
              <div className="flex gap-2 flex-wrap">
                {PLATFORM_OPTIONS.map(({ id, label }) => (
                  <Chip key={id} active={platform === id} label={label} onClick={() => setPlatform(id)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Payment</p>
              <div className="flex gap-2">
                {PAYMENT_OPTIONS.map(({ id, label }) => (
                  <Chip key={id} active={payment === id} label={label} onClick={() => setPayment(id)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary bar */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{filteredRides.length} rides</span>
            <span className="text-accent-green font-semibold">{formatCurrency(totalRevenue)}</span>
            <span className="text-slate-600">{cashPct}% cash</span>
            {disputedCount > 0 && (
              <span className="text-status-red font-semibold">{disputedCount} disputed</span>
            )}
          </div>
        </div>

        {filteredRides.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="text-4xl opacity-20">🚗</span>
            <p className="text-center text-slate-500 text-sm">No rides in this period.</p>
          </div>
        ) : (
          grouped.map(([date, dayRides]) => (
            <div key={date}>
              <div className="flex items-center justify-between py-2">
                <p className="text-xs uppercase tracking-wider text-slate-500">{formatDateLabel(date)}</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {formatCurrency(dayRides.reduce((s, r) => s + r.fareAmount, 0))}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {dayRides.map((ride) => (
                  <RideEntryCard
                    key={ride.id}
                    ride={ride}
                    showDriver
                    driverName={driverMap[ride.driverId]}
                    onFlag={flagRide}
                  />
                ))}
              </div>
            </div>
          ))
        )}

      </div>
    </div>
  );
}
