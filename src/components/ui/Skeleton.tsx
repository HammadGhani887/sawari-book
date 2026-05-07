"use client";

interface SkeletonTextProps {
  width?: string;
  className?: string;
}

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div
      className={`rounded-2xl h-24 bg-brand-surface animate-pulse ${className}`}
    />
  );
}

export function SkeletonText({ width = "100%", className = "" }: SkeletonTextProps) {
  return (
    <div
      className={`rounded h-4 bg-brand-surface animate-pulse ${className}`}
      style={{ width }}
    />
  );
}

export function SkeletonCircle({ size = 40, className = "" }: SkeletonCircleProps) {
  return (
    <div
      className={`rounded-full bg-brand-surface animate-pulse shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonKPIGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-brand-surface rounded-2xl p-3 flex items-center gap-3 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-brand-elevated shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 rounded bg-brand-elevated w-20" />
            <div className="h-3 rounded bg-brand-elevated w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-brand-surface rounded-2xl divide-y divide-slate-700/30 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-brand-elevated shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded bg-brand-elevated w-3/4" />
            <div className="h-3 rounded bg-brand-elevated w-1/2" />
          </div>
          <div className="h-4 rounded bg-brand-elevated w-16" />
        </div>
      ))}
    </div>
  );
}
