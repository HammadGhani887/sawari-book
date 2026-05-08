import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  const base =
    "bg-brand-surface border border-slate-200/30 rounded-2xl p-4";
  const interactive = onClick
    ? "cursor-pointer hover:border-slate-600 active:scale-[0.98] transition-all"
    : "";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${interactive} w-full text-left ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${base} ${className}`}>
      {children}
    </div>
  );
}
