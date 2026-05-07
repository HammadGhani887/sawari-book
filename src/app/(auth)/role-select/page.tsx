"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";
import type { UserRole } from "@/lib/types";

interface RoleOption {
  role: UserRole;
  emoji: string;
  title: string;
  titleUrdu: string;
  description: string;
  accent: "green" | "blue";
}

const ROLES: RoleOption[] = [
  {
    role: "owner",
    emoji: "🚗",
    title: "I'm a Car Owner",
    titleUrdu: "میں گاڑی کا مالک ہوں",
    description: "Track rides, revenue, and manage drivers",
    accent: "green",
  },
  {
    role: "driver",
    emoji: "🚘",
    title: "I'm a Driver",
    titleUrdu: "میں ڈرائیور ہوں",
    description: "Log rides, fuel, and expenses",
    accent: "blue",
  },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const { setRole } = useAuthStore();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setRole(selected);
    router.replace(selected === "owner" ? "/dashboard" : "/home");
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 text-center mb-2">
        <h1 className="text-2xl font-bold text-white">Welcome to Sawari Book</h1>
        <p className="text-slate-400 text-sm" dir="rtl">سواری بُک میں خوش آمدید</p>
        <div className="mt-4">
          <p className="text-lg font-semibold text-white">How will you use this app?</p>
          <p className="text-sm text-slate-500 mt-0.5" dir="rtl">آپ یہ ایپ کیسے استعمال کریں گے؟</p>
        </div>
      </div>

      {/* Role cards */}
      <div className="flex flex-col gap-3">
        {ROLES.map(({ role, emoji, title, titleUrdu, description, accent }) => {
          const isSelected = selected === role;
          const selectedBorderColor = accent === "green" ? "border-accent-green" : "border-accent-blue";
          const selectedBg = accent === "green" ? "bg-accent-greenDim" : "bg-accent-blueDim";
          const dotColor = accent === "green" ? "bg-accent-green" : "bg-accent-blue";
          const ringColor = accent === "green" ? "border-accent-green" : "border-accent-blue";

          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelected(role)}
              className={[
                "w-full text-left rounded-2xl p-4 transition-all duration-150",
                "border border-slate-700 border-l-4",
                isSelected
                  ? `${selectedBorderColor} ${selectedBg}`
                  : "border-l-transparent bg-brand-surface active:scale-[0.98]",
              ].join(" ")}
            >
              <div className="flex items-start gap-4">
                <div
                  className={[
                    "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-3xl",
                    isSelected ? selectedBg : "bg-brand-elevated",
                  ].join(" ")}
                >
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">{title}</p>
                  <p className="text-sm text-slate-400 mt-0.5" dir="rtl">{titleUrdu}</p>
                  <p className="text-xs text-slate-500 mt-1.5">{description}</p>
                </div>
                {/* Radio indicator */}
                <div
                  className={[
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    isSelected ? ringColor : "border-slate-600",
                  ].join(" ")}
                >
                  {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        variant="primary"
        fullWidth
        disabled={!selected}
        loading={loading}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </div>
  );
}
