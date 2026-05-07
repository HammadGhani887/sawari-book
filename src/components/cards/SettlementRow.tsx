type RowType = "revenue" | "expense" | "salary" | "profit" | "neutral";

interface SettlementRowProps {
  label: string;
  amount: number | string;
  type?: RowType;
}

const TYPE_CONFIG: Record<
  RowType,
  { labelClass: string; amountClass: string; prefix: string; large: boolean }
> = {
  revenue: {
    labelClass: "text-slate-300",
    amountClass: "text-white",
    prefix: "",
    large: false,
  },
  expense: {
    labelClass: "text-status-amber",
    amountClass: "text-status-amber",
    prefix: "−",
    large: false,
  },
  salary: {
    labelClass: "text-accent-blue",
    amountClass: "text-accent-blue",
    prefix: "−",
    large: false,
  },
  profit: {
    labelClass: "text-accent-green font-semibold",
    amountClass: "text-accent-green font-bold",
    prefix: "",
    large: true,
  },
  neutral: {
    labelClass: "text-slate-400",
    amountClass: "text-white",
    prefix: "",
    large: false,
  },
};

export default function SettlementRow({
  label,
  amount,
  type = "neutral",
}: SettlementRowProps) {
  const cfg = TYPE_CONFIG[type];
  const displayAmount =
    typeof amount === "number"
      ? `₨${amount.toLocaleString("en-PK")}`
      : amount;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700/30 last:border-0">
      <span className={`text-sm ${cfg.labelClass}`}>{label}</span>
      <span
        className={[
          "tabular-nums",
          cfg.large ? "text-xl" : "text-sm",
          cfg.amountClass,
        ].join(" ")}
      >
        {cfg.prefix}
        {displayAmount}
      </span>
    </div>
  );
}
