"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronRight, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { ScreenHeader, Card, Badge } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";

function SectionHeader({ label, labelUrdu }: { label: string; labelUrdu: string }) {
  return (
    <div className="flex items-baseline justify-between mt-6 mb-2">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-700 font-[system-ui]" dir="rtl">{labelUrdu}</p>
    </div>
  );
}

function SettingRow({ label, right, onClick }: {
  label: string; right: React.ReactNode; onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
      <p className="text-sm text-slate-900">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-slate-600">{right}</div>
    </div>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="w-full text-left active:opacity-70 transition-opacity">{inner}</button>
  ) : inner;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={["relative w-10 h-6 rounded-full transition-colors duration-200", on ? "bg-accent-green" : "bg-slate-300"].join(" ")}
    >
      <span className={["absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200", on ? "translate-x-5" : "translate-x-1"].join(" ")} />
    </button>
  );
}

export default function SettingsPage() {
  const router         = useRouter();
  const user           = useAuthStore((s) => s.user);
  const logout         = useAuthStore((s) => s.logout);
  const updateProfile  = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);

  const profileRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.photoUrl ?? null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput,  setNameInput]  = useState(user?.name  ?? "");
  const [phoneInput, setPhoneInput] = useState(user?.phone ?? "");
  const [emailInput, setEmailInput] = useState(user?.email ?? "");

  const [editingPwd, setEditingPwd] = useState(false);
  const [curPwd,     setCurPwd]     = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd,    setShowPwd]    = useState(false);

  const [notifRide,    setNotifRide]    = useState(true);
  const [notifExpense, setNotifExpense] = useState(true);
  const [notifSummary, setNotifSummary] = useState(true);
  const [notifAnomaly, setNotifAnomaly] = useState(true);
  const [notifSaved,   setNotifSaved]   = useState(false);

  function handleSaveProfile() {
    if (!nameInput.trim()) { toast.error("Name is required"); return; }
    updateProfile({ name: nameInput.trim(), phone: phoneInput.trim(), email: emailInput.trim() || undefined, photoUrl: profilePhoto ?? undefined });
    toast.success("Profile saved");
    setEditingProfile(false);
  }

  function handleChangePwd() {
    if (!curPwd || !newPwd) return;
    if (newPwd !== confirmPwd) { toast.error("Passwords don't match"); return; }
    if (newPwd.length < 6) { toast.error("Min 6 characters"); return; }
    const { ok, error } = changePassword(curPwd, newPwd);
    if (!ok) { toast.error(error!); return; }
    toast.success("Password changed");
    setCurPwd(""); setNewPwd(""); setConfirmPwd("");
    setEditingPwd(false);
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Settings" titleUrdu="ترتیبات" />

      <div className="px-4 pt-4 pb-10">

        {/* Profile card */}
        <Card>
          {editingProfile ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Edit Profile</p>

              {/* Profile photo */}
              <div className="flex flex-col items-center gap-2 mb-1">
                <input
                  ref={profileRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => setProfilePhoto(reader.result as string);
                    reader.readAsDataURL(f);
                  }}
                />
                <button
                  onClick={() => profileRef.current?.click()}
                  className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                  {profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-slate-400 font-semibold">{user?.name?.[0] ?? "M"}</span>
                  )}
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-accent-green rounded-full flex items-center justify-center shadow">
                    <Camera size={10} className="text-white" />
                  </div>
                </button>
                <p className="text-xs text-slate-400">Tap to change photo</p>
              </div>

              {[
                { label: "Name",  value: nameInput,  set: setNameInput,  type: "text"  },
                { label: "Phone", value: phoneInput, set: setPhoneInput, type: "tel"   },
                { label: "Email", value: emailInput, set: setEmailInput, type: "email" },
              ].map(({ label, value, set, type }) => (
                <div key={label}>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <input type={type} value={value} onChange={(e) => set(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-200 shadow-sm text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-accent-green" />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingProfile(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
                <button onClick={handleSaveProfile} className="flex-1 py-2 rounded-xl bg-accent-green text-white text-sm font-semibold">Save</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl text-slate-500 font-semibold">{user?.name?.[0] ?? "M"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-900">{user?.name ?? "—"}</p>
                <p className="text-sm text-slate-600">{user?.phone ?? "—"}</p>
                {user?.email && <p className="text-xs text-slate-500">{user.email}</p>}
              </div>
              <button type="button"
                onClick={() => { setNameInput(user?.name ?? ""); setPhoneInput(user?.phone ?? ""); setEmailInput(user?.email ?? ""); setProfilePhoto(user?.photoUrl ?? null); setEditingProfile(true); }}
                className="text-sm font-medium text-accent-green shrink-0">
                Edit →
              </button>
            </div>
          )}
        </Card>

        {/* Security / Password */}
        <SectionHeader label="Security" labelUrdu="سیکیورٹی" />
        <Card>
          {editingPwd ? (
            <div className="flex flex-col gap-3">
              {[
                { label: "Current Password", value: curPwd,     set: setCurPwd     },
                { label: "New Password",     value: newPwd,     set: setNewPwd     },
                { label: "Confirm Password", value: confirmPwd, set: setConfirmPwd },
              ].map(({ label, value, set }) => (
                <div key={label} className="relative">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <input type={showPwd ? "text" : "password"} value={value} onChange={(e) => set(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-200 shadow-sm text-sm rounded-xl px-3 py-2.5 pr-10 outline-none focus:ring-1 focus:ring-accent-green" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 bottom-2.5 text-slate-400">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingPwd(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
                <button onClick={handleChangePwd} className="flex-1 py-2 rounded-xl bg-accent-green text-white text-sm font-semibold">Change</button>
              </div>
            </div>
          ) : (
            <SettingRow label="Change Password" onClick={() => setEditingPwd(true)}
              right={<ChevronRight size={14} className="text-slate-600" />} />
          )}
        </Card>

        {/* Vehicles — fuel settings moved to each vehicle's detail page */}
        <SectionHeader label="Vehicles" labelUrdu="گاڑیاں" />
        <Card>
          <SettingRow
            label="Manage Vehicles & Fuel Settings"
            onClick={() => router.push("/vehicles")}
            right={
              <>
                <span className="text-xs text-slate-500">Fuel avg, price, tank per vehicle</span>
                <ChevronRight size={14} className="text-slate-600" />
              </>
            }
          />
        </Card>

        {/* Notifications */}
        <SectionHeader label="Notifications" labelUrdu="اطلاعات" />
        <Card>
          <SettingRow label="New Ride Logged"  right={<Toggle on={notifRide}    onToggle={() => { setNotifRide((o) => !o);    setNotifSaved(false); }} />} />
          <SettingRow label="Expense Pending"  right={<Toggle on={notifExpense} onToggle={() => { setNotifExpense((o) => !o); setNotifSaved(false); }} />} />
          <SettingRow label="Daily Summary"    right={<Toggle on={notifSummary} onToggle={() => { setNotifSummary((o) => !o); setNotifSaved(false); }} />} />
          <SettingRow label="Anomaly Alerts"   right={<Toggle on={notifAnomaly} onToggle={() => { setNotifAnomaly((o) => !o); setNotifSaved(false); }} />} />
          <div className="pt-3">
            {notifSaved ? (
              <div className="w-full py-2.5 rounded-xl bg-accent-greenDim border border-accent-green/30 text-center text-sm font-semibold text-accent-green">
                Saved ✓
              </div>
            ) : (
              <button
                onClick={() => { setNotifSaved(true); toast.success("Notification settings saved ✓"); }}
                className="w-full py-2.5 rounded-xl bg-accent-green text-white text-sm font-semibold active:opacity-80 transition-opacity"
              >
                Save Changes ✓
              </button>
            )}
          </div>
        </Card>

        {/* Subscription */}
        <SectionHeader label="Subscription" labelUrdu="سبسکرپشن" />
        <Card>
          <SettingRow label="Plan" onClick={() => router.push("/subscription")}
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
          <SettingRow label="WhatsApp Support" onClick={() => toast("Opening WhatsApp...")} right={<ChevronRight size={14} className="text-slate-600" />} />
          <SettingRow label="Rate App"         onClick={() => toast("Coming soon")}          right={<ChevronRight size={14} className="text-slate-600" />} />
        </Card>

        {/* Account */}
        <SectionHeader label="Account" labelUrdu="اکاؤنٹ" />
        <Card>
          <SettingRow label="Terms of Service" onClick={() => toast("Coming soon")} right={<ChevronRight size={14} className="text-slate-600" />} />
          <SettingRow label="Privacy Policy"   onClick={() => toast("Coming soon")} right={<ChevronRight size={14} className="text-slate-600" />} />
          <button type="button" onClick={handleLogout} className="w-full text-left py-3 active:opacity-70 transition-opacity">
            <p className="text-sm text-status-red font-medium">Logout</p>
          </button>
        </Card>

      </div>
    </div>
  );
}
