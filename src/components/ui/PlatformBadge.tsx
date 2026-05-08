import { PLATFORM_MAP } from "@/lib/constants/platforms";
import type { PlatformId } from "@/lib/types";

interface PlatformBadgeProps {
  platform: PlatformId;
}

export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  const p = PLATFORM_MAP[platform];
  if (!p) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/50 bg-brand-elevated px-2.5 py-1 text-xs font-medium text-slate-900">
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: p.color }}
      />
      {p.name}
    </span>
  );
}
