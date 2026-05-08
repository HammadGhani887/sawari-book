import Card from "@/components/ui/Card";

interface Trend {
  value: string;
  positive: boolean;
}

interface KPICardProps {
  label: string;
  labelUrdu?: string;
  value: string;
  icon: string;
  trend?: Trend;
  colorClass?: string;
}

export default function KPICard({
  label,
  labelUrdu,
  value,
  icon,
  trend,
  colorClass = "text-accent-green",
}: KPICardProps) {
  return (
    <Card className="flex items-center gap-3 !p-3">
      {/* Icon square */}
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-elevated flex items-center justify-center text-xl">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1 flex-wrap">
          <p
            className={`text-2xl font-bold leading-none ${colorClass} truncate`}
          >
            {value}
          </p>
          {trend && (
            <span
              className={`text-xs font-semibold flex-shrink-0 ${
                trend.positive ? "text-accent-green" : "text-status-red"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>

        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mt-1 truncate">
          {label}
        </p>
        {labelUrdu && (
          <p
            className="text-[10px] text-slate-600 leading-tight truncate"
            dir="rtl"
          >
            {labelUrdu}
          </p>
        )}
      </div>
    </Card>
  );
}
