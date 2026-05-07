type BadgeType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "disputed"
  | "settled"
  | "cash"
  | "wallet";

interface BadgeProps {
  type: BadgeType;
  label?: string;
}

const DEFAULT_LABELS: Record<BadgeType, string> = {
  active:   "Active",
  inactive: "Inactive",
  pending:  "Pending",
  approved: "Approved",
  rejected: "Rejected",
  disputed: "Disputed",
  settled:  "Settled",
  cash:     "Cash",
  wallet:   "Wallet",
};

const TYPE_CLASSES: Record<BadgeType, string> = {
  active:   "bg-accent-greenDim text-accent-green",
  inactive: "bg-slate-700/50 text-slate-400",
  pending:  "bg-status-amberDim text-status-amber",
  approved: "bg-accent-greenDim text-accent-green",
  rejected: "bg-status-redDim text-status-red",
  disputed: "bg-status-redDim text-status-red",
  settled:  "bg-accent-blueDim text-accent-blue",
  cash:     "bg-slate-700 text-slate-300",
  wallet:   "bg-accent-blueDim text-accent-blue",
};

export default function Badge({ type, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_CLASSES[type]}`}
    >
      {label ?? DEFAULT_LABELS[type]}
    </span>
  );
}
