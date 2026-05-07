"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, MessageCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, ScreenHeader } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";
import { useVehicleSettingsStore } from "@/lib/store/vehicleSettingsStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import Link from "next/link";

export default function DriverProfilePage() {
  const router = useRouter();
  const { logout, setLanguage, user } = useAuthStore();
  const fuelLogs       = useFuelStore((s) => s.fuelLogs);
  const fuelAvg        = useVehicleSettingsStore((s) => s.fuelAverageKmL);
  const petrolPrice    = useVehicleSettingsStore((s) => s.petrolPricePkrL);
  const autoAverage    = useVehicleSettingsStore((s) => s.autoAverage);
  const setFuelAvg     = useVehicleSettingsStore((s) => s.setFuelAverage);
  const setPetrolPrice = useVehicleSettingsStore((s) => s.setPetrolPrice);
  const setAutoAvg     = useVehicleSettingsStore((s) => s.setAutoAverage);
  const getEffective   = useVehicleSettingsStore((s) => s.getEffectiveAverage);
  const effectiveAvg   = getEffective(fuelLogs);

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [fuelAvgInput,    setFuelAvgInput]    = useState(String(fuelAvg));
  const [priceInput,      setPriceInput]      = useState(String(petrolPrice));

  const language = user?.language ?? "en";

  function toggleLanguage() {
    setLanguage(language === "en" ? "ur" : "en");
  }

  function handleLogout() {
    if (!window.confirm("Are you sure you want to logout?")) return;
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Profile" titleUrdu="پروفائل" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
        {/* Profile identity card */}
        <Card>
          <div className="w-20 h-20 rounded-full bg-slate-600 mx-auto mb-3 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-300">AK</span>
          </div>
          <p className="text-xl font-bold text-white text-center">Ahmed Khan</p>
          <p className="text-sm text-slate-400 text-center mt-0.5">+92 301 123 4567</p>
          <p className="text-xs text-slate-500 text-center mt-0.5 font-mono tracking-wide">
            352**-*****67-1
          </p>
        </Card>

        {/* Assigned vehicle */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Assigned Vehicle
          </p>
          <p className="text-base font-semibold text-white">Suzuki Alto · LEA-1234</p>
          <p className="text-sm text-slate-400 mt-1">Owner: Muhammad Ilyas</p>
          <p className="text-xs text-slate-500 mt-0.5">Since 15 Jan 2026</p>
        </Card>

        {/* Salary */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Salary
          </p>
          <p className="text-base font-semibold text-accent-blue">
            Fixed Monthly · ₨25,000/month
          </p>
          <Link
            href="/earnings"
            className="text-xs text-slate-500 mt-1.5 block hover:text-slate-400 transition-colors"
          >
            View earnings history →
          </Link>
        </Card>

        {/* Fuel settings */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Vehicle & Fuel ⛽</p>

          {/* Petrol price */}
          <div className="flex items-center justify-between py-2.5 border-b border-slate-800">
            <div>
              <p className="text-sm text-white">Petrol Price</p>
              <p className="text-[10px] text-slate-500" dir="rtl">تیل کی قیمت فی لیٹر</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Rs</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={() => {
                  const v = Number(priceInput);
                  if (v > 0) { setPetrolPrice(v); toast.success("Saved"); }
                }}
                className="w-16 bg-brand-elevated text-white text-sm text-right rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-blue tabular-nums"
              />
              <span className="text-xs text-slate-500">/L</span>
            </div>
          </div>

          {/* Auto toggle */}
          <div className="flex items-center justify-between py-2.5 border-b border-slate-800">
            <p className="text-sm text-white">Auto-Calculate Average</p>
            <button
              onClick={() => setAutoAvg(!autoAverage)}
              className={["relative w-10 h-6 rounded-full transition-colors", autoAverage ? "bg-accent-blue" : "bg-slate-600"].join(" ")}
            >
              <span className={["absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform", autoAverage ? "translate-x-5" : "translate-x-1"].join(" ")} />
            </button>
          </div>

          {/* Average display/edit */}
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm text-white">Fuel Average</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {autoAverage ? `${effectiveAvg} km/L (auto from logs)` : "Manual setting"}
              </p>
            </div>
            {autoAverage ? (
              <span className="text-sm font-bold text-accent-blue tabular-nums">{effectiveAvg} km/L</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={fuelAvgInput}
                  onChange={(e) => setFuelAvgInput(e.target.value)}
                  onBlur={() => {
                    const v = Number(fuelAvgInput);
                    if (v > 0) { setFuelAvg(v); toast.success("Saved"); }
                  }}
                  className="w-16 bg-brand-elevated text-white text-sm text-right rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-blue tabular-nums"
                />
                <span className="text-xs text-slate-500">km/L</span>
              </div>
            )}
          </div>
        </Card>

        {/* Settings list */}
        <div className="bg-brand-surface border border-slate-700/30 rounded-2xl overflow-hidden">
          {/* Language */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm text-slate-300">Language</span>
            <button
              onClick={toggleLanguage}
              className="text-sm font-medium text-accent-blue"
            >
              {language === "en" ? "English" : "اردو"}
            </button>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm text-slate-300">Notifications</span>
            <button
              onClick={() => setNotificationsOn((v) => !v)}
              className={[
                "relative w-12 h-6 rounded-full transition-colors duration-200",
                notificationsOn ? "bg-accent-blue" : "bg-slate-600",
              ].join(" ")}
            >
              <div
                className={[
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  notificationsOn ? "translate-x-7" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </div>

          {/* App version */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm text-slate-300">App Version</span>
            <span className="text-sm text-slate-500">1.0.0</span>
          </div>

          {/* Terms of service */}
          <button className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-800 active:bg-brand-elevated transition-colors">
            <span className="text-sm text-slate-300">Terms of Service</span>
            <ChevronRight size={16} className="text-slate-500" />
          </button>

          {/* Contact support */}
          <button className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-800 active:bg-brand-elevated transition-colors">
            <span className="text-sm text-slate-300">Contact Support</span>
            <MessageCircle size={16} style={{ color: "#25D366" }} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 active:bg-brand-elevated transition-colors"
          >
            <span className="text-sm font-semibold text-status-red">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
