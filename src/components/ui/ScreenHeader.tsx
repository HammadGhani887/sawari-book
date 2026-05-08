"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ScreenHeaderProps {
  title: string;
  titleUrdu?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function ScreenHeader({
  title,
  titleUrdu,
  showBack = false,
  rightAction,
}: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-brand-bg/80 backdrop-blur-md border-b border-slate-200/30">
      {/* Left: back button */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-elevated text-slate-700 hover:text-slate-900 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        )}
      </div>

      {/* Center: title */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
          {title}
        </h1>
        {titleUrdu && (
          <span
            className="text-xs text-slate-500 leading-tight font-[system-ui]"
            dir="rtl"
          >
            {titleUrdu}
          </span>
        )}
      </div>

      {/* Right: action slot */}
      <div className="w-10 flex justify-end">
        {rightAction ?? null}
      </div>
    </header>
  );
}
