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

const WEEK_START = "2026-05-01";

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

const DATE_LABEL_MAP: Record<string, string> = {
  [TODAY]:        "Today — 7 May 2026",
  "2026-05-06":   "6 May 2026",
  "2026-05-05":   "5 May 2026",
  "2026-05-04":   "4 May 2026",
  "2026-05-03":   "3 May 2026",
};

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 shrink-0",
        active
          ? "bg-accent-green text-white"
          : "bg-brand-surface border border-slate-700 text-slate-400",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function AllRidesPage() {
  const rides   = useRideStore((s) => s.rides);
  const drivers = useDriverStore((s) => s.drivers);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [platform,     setPlatform]     = useState("all");
  const [payment,      setPayment]      = useState("all");
  const [dateRange,    setDateRange]    = useState<DateRange>("month");

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

  const totalRevenue = filteredRides.reduce((s, r) => s + r.fareAmount, 0);
  const cashCount    = filteredRides.filter((r) => r.paymentType === "cash").length;
  const cashPct      = filteredRides.length > 0
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
            <Funnel size={15} className={isFilterOpen ? "text-white" : "text-slate-400"} />
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-4 pt-3 pb-6">

        {isFilterOpen && (
          <div className="flex flex-col gap-3 bg-brand-surface border border-slate-700/30 rounded-2xl p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Platform</p>
              <div className="flex gap-2 flex-wrap">
                {PLATFORM_OPTIONS.map(({ id, label }) => (
                  <Chip key={id} active={platform === id} label={label} onClick={() => setPlatform(id)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Date</p>
              <DateRangeSelector selected={dateRange} onChange={setDateRange} />
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

        <div className="bg-brand-elevated rounded-xl p-3">
          <p className="text-sm text-white text-center">
            <span className="font-semibold">{filteredRides.length} rides</span>
            <span className="text-slate-500 mx-1.5">·</span>
            <span className="text-accent-green font-semibold">{formatCurrency(totalRevenue)}</span>
            <span className="text-slate-500 mx-1.5">·</span>
            <span className="text-slate-300">{cashPct}% cash</span>
          </p>
        </div>

        {grouped.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-12">No rides match the selected filters.</p>
        ) : (
          grouped.map(([date, dayRides]) => (
            <div key={date}>
              <p className="text-xs uppercase tracking-wider text-slate-500 py-2">
                {DATE_LABEL_MAP[date] ?? date}
              </p>
              <div className="flex flex-col gap-3">
                {dayRides.map((ride) => (
                  <RideEntryCard
                    key={ride.id}
                    ride={ride}
                    showDriver
                    driverName={driverMap[ride.driverId]}
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
