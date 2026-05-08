"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronRight, MessageCircle, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { Card, ScreenHeader } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";
import { useDriverStore, useCurrentDriver } from "@/lib/store/driverStore";
import { useVehicleStore } from "@/lib/store/vehicleStore";
import { useFuelStore } from "@/lib/store/fuelStore";
import { formatCurrency } from "@/lib/utils/format";
import Link from "next/link";

function formatCnic(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return d.slice(0, 5) + "-" + d.slice(5);
  return d.slice(0, 5) + "-" + d.slice(5, 12) + "-" + d.slice(12);
}

export default function DriverProfilePage() {
  const router         = useRouter();
  const user           = useAuthStore((s) => s.user);
  const { logout }     = useAuthStore();
  const updateProfile  = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);

  const driver        = useCurrentDriver();
  const updateDriver  = useDriverStore((s) => s.updateDriver);
  const vehicles      = useVehicleStore((s) => s.vehicles);
  const updateVehicle = useVehicleStore((s) => s.updateVehicle);
  const getEffective  = useVehicleStore((s) => s.getEffectiveAverage);
  const fuelLogs      = useFuelStore((s) => s.fuelLogs);

  const vehicleId    = driver?.vehicleId ?? "";
  const vehicle      = vehicles.find((v) => v.id === vehicleId);
  const effectiveAvg = getEffective(vehicleId, fuelLogs);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput,    setNameInput]    = useState(user?.name  ?? "");
  const [phoneInput,   setPhoneInput]   = useState(user?.phone ?? "");
  const [cnicInput,    setCnicInput]    = useState(driver?.cnic ?? user?.cnic ?? "");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.photoUrl ?? null);
  const [licenseImage, setLicenseImage] = useState<string | null>(user?.licenseImageUrl ?? null);
  const profileRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  // Fuel settings edit state (reads from vehicle)
  const [priceInput,   setPriceInput]   = useState(String(vehicle?.petrolPricePkrL ?? 280));
  const [avgInput,     setAvgInput]     = useState(String(vehicle?.fuelAverageKmL  ?? 12));

  // Password state
  const [editingPwd, setEditingPwd] = useState(false);
  const [curPwd,     setCurPwd]     = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd,    setShowPwd]    = useState(false);

  const [notificationsOn, setNotificationsOn] = useState(true);

  // Sync when user/driver/vehicle loads from Zustand
  useEffect(() => {
    setNameInput(user?.name ?? "");
    setPhoneInput(user?.phone ?? "");
    setCnicInput(driver?.cnic ?? user?.cnic ?? "");
    setProfilePhoto(user?.photoUrl ?? null);
    setLicenseImage(user?.licenseImageUrl ?? null);
  }, [user?.name, user?.phone, user?.cnic, user?.photoUrl, user?.licenseImageUrl, driver?.cnic]);

  useEffect(() => {
    setPriceInput(String(vehicle?.petrolPricePkrL ?? 280));
    setAvgInput(String(vehicle?.fuelAverageKmL ?? 12));
  }, [vehicle?.petrolPricePkrL, vehicle?.fuelAverageKmL]);

  function handleLicense(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLicenseImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleProfilePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSaveProfile() {
    if (!nameInput.trim()) { toast.error("Name is required"); return; }
    updateProfile({ name: nameInput.trim(), phone: phoneInput.trim(), cnic: cnicInput || undefined, photoUrl: profilePhoto ?? undefined, licenseImageUrl: licenseImage ?? undefined });
    if (driver) updateDriver(driver.id, { name: nameInput.trim(), phone: phoneInput.trim(), cnic: cnicInput || undefined });
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
    setCurPwd(""); setNewPwd(""); setConfirmPwd(""); setEditingPwd(false);
  }

  function handleLogout() {
    if (!window.confirm("Are you sure you want to logout?")) return;
    logout();
    router.push("/login");
  }

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "D";

  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Profile" titleUrdu="پروفائل" />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

        {/* ── Identity card ── */}
        <Card>
          {editingProfile ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Edit Profile</p>

              {/* Profile photo upload */}
              <div className="flex flex-col items-center gap-2 mb-1">
                <input
                  ref={profileRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleProfilePhoto}
                />
                <button
                  onClick={() => profileRef.current?.click()}
                  className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                  {profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-400">{initials}</span>
                  )}
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-accent-blue rounded-full flex items-center justify-center shadow">
                    <Upload size={10} className="text-white" />
                  </div>
                </button>
                <p className="text-xs text-slate-400">Tap to change photo</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Full Name</p>
                <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-accent-blue" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Phone</p>
                <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-accent-blue" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">CNIC <span className="text-slate-400">(optional)</span></p>
                <input type="text" inputMode="numeric" value={cnicInput}
                  onChange={(e) => setCnicInput(formatCnic(e.target.value))}
                  placeholder="35201-1234567-1"
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-accent-blue tabular-nums" />
              </div>

              {/* Driving License — separate from profile photo */}
              <div>
                <p className="text-xs text-slate-500 mb-1">Driving License Photo <span className="text-slate-400">(optional)</span></p>
                <input ref={licenseRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleLicense} />
                {licenseImage ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={licenseImage} alt="License" className="w-full h-32 object-cover rounded-xl border border-slate-200" />
                    <button onClick={() => licenseRef.current?.click()} className="absolute top-2 right-2 bg-white rounded-lg px-2.5 py-1 text-xs text-slate-700 border border-slate-200 shadow-sm">Change</button>
                  </div>
                ) : (
                  <button onClick={() => licenseRef.current?.click()}
                    className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-500 active:bg-slate-50">
                    <Upload size={16} /><span className="text-xs">Upload license photo</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingProfile(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
                <button onClick={handleSaveProfile} className="flex-1 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold">Save</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-3">
                {/* Avatar — uses photoUrl, NOT licenseImageUrl */}
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-500">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold text-slate-900">{user?.name ?? "—"}</p>
                  <p className="text-sm text-slate-500">{user?.phone ?? "—"}</p>
                  {user?.cnic && <p className="text-xs text-slate-400 font-mono mt-0.5">{user.cnic}</p>}
                </div>
                <button
                  onClick={() => {
                    setNameInput(user?.name ?? "");
                    setPhoneInput(user?.phone ?? "");
                    setCnicInput(driver?.cnic ?? user?.cnic ?? "");
                    setProfilePhoto(user?.photoUrl ?? null);
                    setLicenseImage(user?.licenseImageUrl ?? null);
                    setEditingProfile(true);
                  }}
                  className="text-sm font-medium text-accent-blue shrink-0">
                  Edit →
                </button>
              </div>
              {/* License shown separately */}
              {user?.licenseImageUrl && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Driving License</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.licenseImageUrl} alt="License" className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                </div>
              )}
            </>
          )}
        </Card>

        {/* ── Assigned vehicle ── */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Assigned Vehicle</p>
          {driver?.vehicleId && vehicle ? (
            <>
              <p className="text-base font-semibold text-slate-900">{vehicle.makeModel}</p>
              <p className="text-sm text-slate-500 mt-0.5">{vehicle.plateNumber}</p>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">My Salary</p>
                <p className="text-lg font-bold text-accent-blue">
                  {driver.salaryType === "fixed"
                    ? formatCurrency(driver.salaryAmount) + "/month"
                    : `${driver.salaryAmount}% of revenue`}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-1">Since {driver.startDate}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No vehicle assigned. Ask your owner to share an invite link.</p>
          )}
        </Card>

        {/* ── Fuel settings (from vehicle — shared with owner) ── */}
        {vehicleId && vehicle && (
          <Card>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vehicle & Fuel ⛽</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Updates here are visible to your owner too.</p>
            </div>

            {/* Petrol price */}
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div>
                <p className="text-sm text-slate-900">Petrol Price</p>
                <p className="text-[10px] text-slate-500" dir="rtl">تیل کی قیمت فی لیٹر</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Rs</span>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-16 bg-white border border-slate-200 text-slate-900 text-sm text-right rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-blue tabular-nums"
                />
                <span className="text-xs text-slate-500">/L</span>
              </div>
            </div>

            {/* Fuel average */}
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div>
                <p className="text-sm text-slate-900">Fuel Average</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Auto: {effectiveAvg} km/L (from fill-ups)
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={avgInput}
                  onChange={(e) => setAvgInput(e.target.value)}
                  className="w-16 bg-white border border-slate-200 text-slate-900 text-sm text-right rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-accent-blue tabular-nums"
                />
                <span className="text-xs text-slate-500">km/L</span>
              </div>
            </div>

            {/* Tank capacity — read only from vehicle */}
            {vehicle.tankCapacityLitres && (
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <p className="text-sm text-slate-900">Tank Capacity</p>
                <p className="text-sm font-semibold text-slate-900">{vehicle.tankCapacityLitres} L</p>
              </div>
            )}

            {/* Save button */}
            <button
              onClick={() => {
                const price = Number(priceInput);
                const avg   = Number(avgInput);
                if (price <= 0 || avg <= 0) { toast.error("Enter valid price and average"); return; }
                updateVehicle(vehicleId, { petrolPricePkrL: price, fuelAverageKmL: avg });
                toast.success("Fuel settings saved ✓ Owner can see this");
              }}
              className="w-full mt-3 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold active:opacity-80 transition-opacity"
            >
              Save Changes ✓
            </button>
          </Card>
        )}

        {/* ── Earnings ── */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Earnings</p>
          <Link href="/earnings" className="text-sm text-accent-blue font-medium">View earnings history →</Link>
        </Card>

        {/* ── Security ── */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Security</p>
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
                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl px-3 py-2.5 pr-10 outline-none focus:ring-1 focus:ring-accent-blue" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 bottom-2.5 text-slate-400">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingPwd(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
                <button onClick={handleChangePwd} className="flex-1 py-2 rounded-xl bg-accent-blue text-white text-sm font-semibold">Change</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditingPwd(true)} className="flex items-center justify-between w-full py-1 active:opacity-70">
              <span className="text-sm text-slate-900">Change Password</span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          )}
        </Card>

        {/* ── Settings list ── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm text-slate-900">Notifications</span>
            <button onClick={() => setNotificationsOn((v) => !v)}
              className={["relative w-12 h-6 rounded-full transition-colors duration-200", notificationsOn ? "bg-accent-blue" : "bg-slate-300"].join(" ")}>
              <div className={["absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", notificationsOn ? "translate-x-7" : "translate-x-1"].join(" ")} />
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm text-slate-900">App Version</span>
            <span className="text-sm text-slate-500">1.0.0</span>
          </div>
          <button className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-100 active:bg-slate-50 transition-colors">
            <span className="text-sm text-slate-900">Terms of Service</span>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
          <button className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-100 active:bg-slate-50 transition-colors">
            <span className="text-sm text-slate-900">Contact Support</span>
            <MessageCircle size={16} style={{ color: "#25D366" }} />
          </button>
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 active:bg-slate-50 transition-colors">
            <span className="text-sm font-semibold text-status-red">Logout</span>
          </button>
        </div>

      </div>
    </div>
  );
}
