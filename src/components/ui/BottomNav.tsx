"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
  active: boolean;
}

interface BottomNavProps {
  items: NavItem[];
  accentColor?: "green" | "blue";
}

export default function BottomNav({ items, accentColor = "green" }: BottomNavProps) {
  const activeTextClass =
    accentColor === "blue" ? "text-accent-blue" : "text-accent-green";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-brand-surface border-t border-slate-200/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex flex-col items-center justify-center gap-1",
              "flex-1 h-full px-1 select-none",
              "transition-colors duration-150",
              item.active ? activeTextClass : "text-slate-500",
            ].join(" ")}
          >
            <span className={`transition-transform ${item.active ? "scale-110" : "scale-100"}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-semibold leading-none ${item.active ? "" : "font-medium"}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
