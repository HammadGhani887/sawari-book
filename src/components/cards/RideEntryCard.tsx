"use client";

import { Flag } from "lucide-react";
import Badge from "@/components/ui/Badge";
import PlatformBadge from "@/components/ui/PlatformBadge";
import { Ride } from "@/lib/types";
import { PLATFORM_MAP } from "@/lib/constants/platforms";
import { formatCurrency, formatTime } from "@/lib/utils/format";

interface RideEntryCardProps {
  ride: Ride;
  showDriver?: boolean;
  driverName?: string;
  onFlag?: (id: string) => void;
}

export default function RideEntryCard({
  ride,
  showDriver = false,
  driverName,
  onFlag,
}: RideEntryCardProps) {
  const platform = PLATFORM_MAP[ride.platform];
  const route =
    ride.pickupArea && ride.dropoffArea
      ? `${ride.pickupArea} → ${ride.dropoffArea}`
      : ride.pickupArea ?? ride.dropoffArea ?? "—";

  const hasProfit = ride.estimatedFuelCost !== undefined || ride.boostCost !== undefined;
  const fuelCost  = ride.estimatedFuelCost ?? 0;
  const boostCost = ride.boostCost ?? 0;
  const profit    = hasProfit ? ride.fareAmount - fuelCost - boostCost : null;

  return (
    <div
      className={[
        "flex items-center gap-3 bg-brand-surface rounded-2xl p-4 border",
        ride.isDisputed ? "border-status-red/50" : "border-slate-200/30",
      ].join(" ")}
    >
      {/* Platform color dot */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: platform?.color ?? "#64748B" }}
        />
      </div>

      {/* Center info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            {formatTime(ride.rideTime)}
          </span>
          {ride.isDisputed && <Badge type="disputed" />}
        </div>

        <p className="text-xs text-slate-600 mt-0.5 truncate">{route}</p>

        {ride.distanceKm && (
          <p className="text-xs text-slate-500 mt-0.5">{ride.distanceKm} km</p>
        )}

        {showDriver && driverName && (
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
            👤 {driverName}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <PlatformBadge platform={ride.platform} />
          <Badge type={ride.paymentType as "cash" | "wallet"} />
        </div>
      </div>

      {/* Right: fare + profit + flag */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-lg font-bold text-slate-900">
          {formatCurrency(ride.fareAmount)}
        </span>

        {hasProfit && profit !== null && (
          <div className="flex flex-col items-end gap-0.5">
            {fuelCost > 0 && (
              <span className="text-[10px] text-slate-400">
                − {formatCurrency(fuelCost)} fuel
              </span>
            )}
            {boostCost > 0 && (
              <span className="text-[10px] text-status-red">
                − {formatCurrency(boostCost)} boost
              </span>
            )}
            <span className={`text-xs font-bold ${profit >= 0 ? "text-accent-green" : "text-status-red"}`}>
              {formatCurrency(profit)} net
            </span>
          </div>
        )}

        {!hasProfit && (
          <span className="text-[10px] text-slate-400">no dist.</span>
        )}

        {onFlag && (
          <button
            onClick={() => onFlag(ride.id)}
            className="text-slate-600 hover:text-status-amber transition-colors active:scale-95 mt-1"
          >
            <Flag size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
