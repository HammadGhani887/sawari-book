"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Upload, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";
import { useDriverStore } from "@/lib/store/driverStore";

function fmtCnic(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return d.slice(0, 5) + "-" + d.slice(5);
  return d.slice(0, 5) + "-" + d.slice(5, 12) + "-" + d.slice(12);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(file);
  });
}

function Field({ label, labelUrdu, optional, children }: {
  label: string; labelUrdu: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500" dir="rtl">{labelUrdu}</p>
        {optional && <span className="text-xs text-slate-400 ml-auto">optional</span>}
      </div>
      {children}
    </div>
  );
}

function RegisterDriverForm() {
  const router    = useRouter();
  const params    = useSearchParams();
  const token     = params.get("token");

  const register  = useAuthStore((s) => s.register);
  const addDriver = useDriverStore((s) => s.addDriver);

  // Fetch invite from API if token present
  const [inviteData, setInviteData] = useState<{
    ownerName: string; vehicleName: string; vehicleId: string;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invites/${token}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setInviteData(data); })
      .catch(() => {});
  }, [token]);

  const profileRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [cnic,         setCnic]         = useState("");
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  const pwdMatch  = password === confirm;
  const canSubmit =
    name.trim().length >= 2 &&
    phone.trim().length >= 10 &&
    password.length >= 6 &&
    pwdMatch;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const result = await register({
      name:            name.trim(),
      phone:           phone.trim(),
      password,
      role:            "driver",
      cnic:            cnic || undefined,
      photoUrl:        profilePhoto ?? undefined,
      licenseImageUrl: licenseImage ?? undefined,
    });

    if (!result.ok) { toast.error(result.error!); setSaving(false); return; }

    const userId = useAuthStore.getState().user!.id;
    addDriver({
      userId,
      name:         name.trim(),
      phone:        phone.trim(),
      cnic:         cnic || undefined,
      isActive:     true,
      vehicleId:    inviteData?.vehicleId ?? null,
      salaryType:   "fixed",
      salaryAmount: 0,
      startDate:    new Date().toISOString().slice(0, 10),
    });

    // Mark invite as used in DB
    if (token && inviteData) {
      await fetch(`/api/invites/${token}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ usedBy: userId }),
      }).catch(() => {});
    }

    toast.success("Account created!");
    router.replace("/home");
  }

  return (
    <div className="flex flex-col gap-5 w-full">

      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
            <Image src="/sawari-app.png" alt="Sawari Book" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Driver Registration</h2>
            <p className="text-xs text-slate-500" dir="rtl">ڈرائیور کا اکاؤنٹ بنائیں</p>
          </div>
        </div>
      </div>

      {/* Invite banner */}
      {inviteData && (
        <div className="bg-accent-blueDim border border-accent-blue/40 rounded-xl p-3">
          <p className="text-xs text-slate-600">
            Invited by <span className="font-semibold text-slate-900">{inviteData.ownerName}</span>
          </p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{inviteData.vehicleName}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">You&apos;ll be linked to this vehicle after registration.</p>
        </div>
      )}

      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-2">
        <input
          ref={profileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setProfilePhoto(await readAsDataUrl(f));
          }}
        />
        <button
          onClick={() => profileRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          {profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera size={24} className="text-slate-400" />
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center shadow">
            <Camera size={12} className="text-white" />
          </div>
        </button>
        <p className="text-xs text-slate-500">Profile Photo <span className="text-slate-400">(optional)</span></p>
      </div>

      <Field label="Full Name" labelUrdu="پورا نام">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ahmed Khan" className="input-auth" />
      </Field>

      <Field label="Phone Number" labelUrdu="فون نمبر">
        <input type="tel" inputMode="numeric" value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="03XX XXXXXXX" className="input-auth" />
      </Field>

      <Field label="CNIC" labelUrdu="شناختی کارڈ" optional>
        <input type="text" inputMode="numeric" value={cnic}
          onChange={(e) => setCnic(fmtCnic(e.target.value))}
          placeholder="35201-1234567-1" className="input-auth tabular-nums" />
      </Field>

      {/* Driving License — saved separately, NOT used as avatar */}
      <Field label="Driving License Photo" labelUrdu="لائسنس کی تصویر" optional>
        <input
          ref={licenseRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setLicenseImage(await readAsDataUrl(f));
          }}
        />
        {licenseImage ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={licenseImage} alt="License" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
            <button onClick={() => licenseRef.current?.click()}
              className="absolute top-2 right-2 bg-white rounded-lg px-2.5 py-1 text-xs text-slate-700 border shadow-sm">
              Change
            </button>
          </div>
        ) : (
          <button onClick={() => licenseRef.current?.click()}
            className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-500 active:bg-brand-surface transition-colors">
            <Upload size={20} />
            <span className="text-xs font-medium">Tap to upload license photo</span>
          </button>
        )}
      </Field>

      <Field label="Password" labelUrdu="پاس ورڈ">
        <div className="relative">
          <input type={showPwd ? "text" : "password"} value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters" className="input-auth pr-11" />
          <button type="button" onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>

      <Field label="Confirm Password" labelUrdu="پاس ورڈ دوبارہ">
        <div className="relative">
          <input type={showPwd ? "text" : "password"} value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className={["input-auth pr-11", !pwdMatch && confirm ? "border-status-red" : ""].join(" ")} />
          <button type="button" onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {!pwdMatch && confirm && (
          <p className="text-xs text-status-red mt-1">Passwords don&apos;t match</p>
        )}
      </Field>

      <div className="pt-1">
        <Button variant="driver" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSubmit}>
          Create Driver Account
        </Button>
        <p className="text-center text-[11px] text-slate-500 mt-1.5" dir="rtl">اکاؤنٹ بنائیں</p>
      </div>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-blue font-semibold">Login</Link>
      </p>
    </div>
  );
}

export default function RegisterDriverPage() {
  return (
    <Suspense>
      <RegisterDriverForm />
    </Suspense>
  );
}
