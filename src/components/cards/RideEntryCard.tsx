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

  return (
    <div
      className={[
        "flex items-center gap-3 bg-brand-surface rounded-2xl p-4",
        "border",
        ride.isDisputed
          ? "border-status-red/50"
          : "border-slate-700/30",
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
          <span className="text-sm font-medium text-white">
            {formatTime(ride.rideTime)}
          </span>
          {ride.isDisputed && <Badge type="disputed" />}
        </div>

        <p className="text-xs text-slate-400 mt-0.5 truncate">{route}</p>

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

      {/* Right: fare + flag */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-lg font-bold text-white">
          {formatCurrency(ride.fareAmount)}
        </span>

        {onFlag && (
          <button
            onClick={() => onFlag(ride.id)}
            className="text-slate-600 hover:text-status-amber transition-colors active:scale-95"
          >
            <Flag size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
