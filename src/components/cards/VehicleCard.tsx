import { ChevronRight } from "lucide-react";
import Card from "@/components/ui/Card";
import PlatformBadge from "@/components/ui/PlatformBadge";
import { Vehicle, PlatformId } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

interface VehicleCardProps {
  vehicle: Vehicle;
  todayRides?: number;
  todayRevenue?: number;
  driverName?: string;
  onClick?: () => void;
}

export default function VehicleCard({
  vehicle,
  todayRides = 0,
  todayRevenue = 0,
  driverName,
  onClick,
}: VehicleCardProps) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3">
      {/* Vehicle icon */}
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-elevated flex items-center justify-center text-xl">
        🚗
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm tracking-wide">
            {vehicle.plateNumber}
          </span>
          {!vehicle.isActive && (
            <span className="text-[10px] text-slate-500 bg-slate-700/50 rounded px-1.5 py-0.5">
              Inactive
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 truncate">{vehicle.makeModel}</p>

        {/* Stats */}
        {(todayRides > 0 || todayRevenue > 0) && (
          <p className="text-xs font-semibold text-accent-green mt-1">
            {todayRides} ride{todayRides !== 1 ? "s" : ""} ·{" "}
            {formatCurrency(todayRevenue)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {driverName ? (
            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
              👤 {driverName}
            </span>
          ) : (
            <span className="text-[10px] text-status-amber">No driver</span>
          )}

          <div className="flex gap-1 flex-wrap">
            {vehicle.platforms.map((p) => (
              <PlatformBadge key={p} platform={p as PlatformId} />
            ))}
          </div>
        </div>
      </div>

      {/* Chevron */}
      {onClick && (
        <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
      )}
    </Card>
  );
}
