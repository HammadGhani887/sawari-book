"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronRight } from "lucide-react";
import { ScreenHeader, Card, Badge } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";
import { useVehicleSettingsStore } from "@/lib/store/vehicleSettingsStore";
import { useFuelStore } from "@/lib/store/fuelStore";

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label, labelUrdu }: { label: string; labelUrdu: string }) {
  return (
    <div className="flex items-baseline justify-between mt-6 mb-2">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-700 font-[system-ui]" dir="rtl">{labelUrdu}</p>
    </div>
  );
}

function SettingRow({ label, right, onClick }: {
  label: string;
  right: React.ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <p className="text-sm text-white">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-slate-400">{right}</div>
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left active:opacity-70 transition-opacity">
        {inner}
      </button>
    );
  }
  return inner;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "relative w-10 h-6 rounded-full transition-colors duration-200",
        on ? "bg-accent-green" : "bg-slate-600",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
          on ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router   = useRouter();
  const logout   = useAuthStore((s) => s.logout);
  const user     = useAuthStore((s) => s.user);

  const fuelLogs       = useFuelStore((s) => s.fuelLogs);
  const fuelAvg        = useVehicleSettingsStore((s) => s.fuelAverageKmL);
  const petrolPrice    = useVehicleSettingsStore((s) => s.petrolPricePkrL);
  const autoAverage    = useVehicleSettingsStore((s) => s.autoAverage);
  const setFuelAvg     = useVehicleSettingsStore((s) => s.setFuelAverage);
  const setPetrolPrice = useVehicleSettingsStore((s) => s.setPetrolPrice);
  const setAutoAvg     = useVehicleSettingsStore((s) => s.setAutoAverage);
  const getEffective   = useVehicleSettingsStore((s) => s.getEffectiveAverage);
  const effectiveAvg   = getEffective(fuelLogs);

  const [language,      setLanguage]      = useState<"English" | "اردو">("English");
  const [notifRide,     setNotifRide]     = useState(true);
  const [notifExpense,  setNotifExpense]  = useState(true);
  const [notifSummary,  setNotifSummary]  = useState(true);
  const [notifAnomaly,  setNotifAnomaly]  = useState(true);
  const [fuelAvgInput,  setFuelAvgInput]  = useState(String(fuelAvg));
  const [priceInput,    setPriceInput]    = useState(String(petrolPrice));

  function handleLogout() {
    if (!window.confirm("Are you sure you want to logout?")) return;
    logout();
    router.replace("/login");
  }

  function handleDeleteAccount() {
    toast("Account deletion — contact support");
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Settings" titleUrdu="ترتیبات" />

      <div className="px-4 pt-4 pb-10">

        {/* Profile card */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
              <span className="text-xl text-slate-300 font-semibold">
                {user?.name?.[0] ?? "M"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white">{user?.name ?? "Muhammad Ilyas"}</p>
              <p className="text-sm text-slate-400">{user?.phone ?? "03001234567"}</p>
            </div>
            <button
              type="button"
              onClick={() => toast("Profile edit coming soon")}
              className="text-sm font-medium text-accent-green"
            >
              Edit →
            </button>
          </div>
        </Card>

        {/* General */}
        <SectionHeader label="General" labelUrdu="عمومی" />
        <Card>
          <SettingRow
            label="Language"
            onClick={() => setLanguage((l) => l === "English" ? "اردو" : "English")}
            right={
              <>
                <span>{language}</span>
                <ChevronRight size={14} className="text-slate-600" />
              </>
            }
          />
          <SettingRow
            label="Currency"
            right={<span className="text-slate-500">PKR (₨)</span>}
          />
          <SettingRow
            label="Daily Target"
            onClick={() => toast("Daily target edit coming soon")}
            right={
              <>
                <span>₨5,000</span>
                <ChevronRight size={14} className="text-slate-600" />
              </>
            }
          />
        </Card>

        {/* Vehicle & Fuel */}
        <SectionHeader label="Vehicle & Fuel" labelUrdu="گاڑی اور تیل" />
        <Card>
          {/* Petrol price */}
          <div className="flex items-center justify-between py-3 border-b border-slate-800">
            <div>
              <p className="text-sm text-white">Petrol Price</p>
              <p className="text-[10px] text-slate-500 mt-0.5" dir="rtl">تیل کی قیمت فی لیٹر</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Rs</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={() => {
                  const v = Number(priceInput);
                  if (v > 0) { setPetrolPrice(v); toast.success("Petrol price saved"); }
                }}
                className="w-16 bg-brand-elevated text-white text-sm text-right rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-green tabular-nums"
              />
              <span className="text-xs text-slate-500">/L</span>
            </div>
          </div>

          {/* Auto-calculate toggle */}
          <SettingRow
            label="Auto-Calculate Average"
            right={<Toggle on={autoAverage} onToggle={() => setAutoAvg(!autoAverage)} />}
          />

          {/* Fuel average — manual or display */}
          <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
            <div>
              <p className="text-sm text-white">Fuel Average</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {autoAverage
                  ? `Auto: ${effectiveAvg} km/L from fill-up logs`
                  : "Set manually below"}
              </p>
            </div>
            {autoAverage ? (
              <span className="text-sm font-bold text-accent-green tabular-nums">{effectiveAvg} km/L</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={fuelAvgInput}
                  onChange={(e) => setFuelAvgInput(e.target.value)}
                  onBlur={() => {
                    const v = Number(fuelAvgInput);
                    if (v > 0) { setFuelAvg(v); toast.success("Fuel average saved"); }
                  }}
                  className="w-16 bg-brand-elevated text-white text-sm text-right rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-green tabular-nums"
                />
                <span className="text-xs text-slate-500">km/L</span>
              </div>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <SectionHeader label="Notifications" labelUrdu="اطلاعات" />
        <Card>
          <SettingRow
            label="New Ride Logged"
            right={<Toggle on={notifRide} onToggle={() => setNotifRide((o) => !o)} />}
          />
          <SettingRow
            label="Expense Pending"
            right={<Toggle on={notifExpense} onToggle={() => setNotifExpense((o) => !o)} />}
          />
          <SettingRow
            label="Daily Summary"
            right={<Toggle on={notifSummary} onToggle={() => setNotifSummary((o) => !o)} />}
          />
          <SettingRow
            label="Anomaly Alerts"
            right={<Toggle on={notifAnomaly} onToggle={() => setNotifAnomaly((o) => !o)} />}
          />
        </Card>

        {/* Subscription */}
        <SectionHeader label="Subscription" labelUrdu="سبسکرپشن" />
        <Card>
          <SettingRow
            label="Plan"
            onClick={() => router.push("/subscription")}
            right={
              <>
                <Badge type="active" label="Pro" />
                <span className="text-slate-400">₨799/month</span>
                <span className="text-accent-green text-sm font-medium">Manage →</span>
              </>
            }
          />
        </Card>

        {/* Support */}
        <SectionHeader label="Support" labelUrdu="مدد" />
        <Card>
          <SettingRow
            label="WhatsApp Support"
            onClick={() => toast("Opening WhatsApp...")}
            right={<ChevronRight size={14} className="text-slate-600" />}
          />
          <SettingRow
            label="Rate App"
            onClick={() => toast("Rate App coming soon")}
            right={<ChevronRight size={14} className="text-slate-600" />}
          />
          <SettingRow
            label="Share"
            onClick={() => toast("Share coming soon")}
            right={<ChevronRight size={14} className="text-slate-600" />}
          />
        </Card>

        {/* Account */}
        <SectionHeader label="Account" labelUrdu="اکاؤنٹ" />
        <Card>
          <SettingRow
            label="Terms of Service"
            onClick={() => toast("Terms coming soon")}
            right={<ChevronRight size={14} className="text-slate-600" />}
          />
          <SettingRow
            label="Privacy Policy"
            onClick={() => toast("Privacy coming soon")}
            right={<ChevronRight size={14} className="text-slate-600" />}
          />
          <SettingRow
            label="Delete Account"
            onClick={handleDeleteAccount}
            right={<ChevronRight size={14} className="text-slate-600" />}
          />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left py-3 border-b border-slate-800 last:border-0 active:opacity-70 transition-opacity"
          >
            <p className="text-sm text-status-red font-medium">Logout</p>
          </button>
        </Card>

      </div>
    </div>
  );
}
