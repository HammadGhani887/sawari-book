import Image from "next/image";
import { User } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/format";

interface DriverCardProps {
  name: string;
  phone: string;
  vehicleName?: string;
  todayRides?: number;
  todayRevenue?: number;
  isActive?: boolean;
  photoUrl?: string;
  onClick?: () => void;
}

export default function DriverCard({
  name,
  phone,
  vehicleName,
  todayRides = 0,
  todayRevenue = 0,
  isActive = true,
  photoUrl,
  onClick,
}: DriverCardProps) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-elevated flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        ) : (
          <User size={22} className="text-slate-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm truncate">{name}</p>
        <p className="text-xs text-slate-500 truncate">{phone}</p>

        {vehicleName ? (
          <p className="text-xs text-slate-600 mt-0.5 truncate">
            🚗 {vehicleName}
          </p>
        ) : (
          <p className="text-xs text-status-amber mt-0.5">No vehicle</p>
        )}
      </div>

      {/* Right: badge + mini stats */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <Badge type={isActive ? "active" : "inactive"} />

        {(todayRides > 0 || todayRevenue > 0) && (
          <div className="text-right">
            <p className="text-xs font-semibold text-accent-green leading-none">
              {formatCurrency(todayRevenue)}
            </p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">
              {todayRides} ride{todayRides !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
