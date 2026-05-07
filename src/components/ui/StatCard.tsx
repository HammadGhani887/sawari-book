interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "green" | "blue" | "amber" | "red";
}

const accentMap = {
  green: "text-accent-green bg-accent-greenDim",
  blue: "text-accent-blue bg-accent-blueDim",
  amber: "text-status-amber bg-status-amberDim",
  red: "text-status-red bg-status-redDim",
};

export default function StatCard({ label, value, sub, accent = "green" }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`text-2xl font-bold ${accentMap[accent].split(" ")[0]}`}>{value}</span>
      {sub && <span className="text-slate-500 text-xs">{sub}</span>}
    </div>
  );
}
