"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";

function readFile(file: File): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(file);
  });
}

export default function RegisterOwnerPage() {
  const router   = useRouter();
  const register = useAuthStore((s) => s.register);

  const profileRef = useRef<HTMLInputElement>(null);

  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  const pwdMatch  = password === confirm;
  const canSubmit =
    name.trim().length >= 2 &&
    (phone.trim().length >= 10 || email.trim().includes("@")) &&
    password.length >= 6 &&
    pwdMatch;

  async function handleSubmit() {
    if (!canSubmit) return;
    if (!pwdMatch) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = register({
      name:     name.trim(),
      phone:    phone.trim(),
      email:    email.trim() || undefined,
      password,
      role:     "owner",
      photoUrl: profilePhoto ?? undefined,
    });
    setSaving(false);
    if (!result.ok) { toast.error(result.error!); return; }
    toast.success("Account created!");
    router.replace("/dashboard");
  }

  return (
    <div className="flex flex-col gap-5 w-full">

      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
            <Image src="/sawari-app.png" alt="Sawari Book" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Owner Registration</h2>
            <p className="text-xs text-slate-500" dir="rtl">مالک کا اکاؤنٹ بنائیں</p>
          </div>
        </div>
      </div>

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
            if (f) setProfilePhoto(await readFile(f));
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
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-accent-green rounded-full flex items-center justify-center shadow">
            <Camera size={12} className="text-white" />
          </div>
        </button>
        <p className="text-xs text-slate-500">Profile Photo <span className="text-slate-400">(optional)</span></p>
      </div>

      {/* Name */}
      <Field label="Full Name" labelUrdu="پورا نام">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Muhammad Ilyas" className="input-auth" />
      </Field>

      {/* Phone */}
      <Field label="Phone Number" labelUrdu="فون نمبر">
        <input type="tel" inputMode="numeric" value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="03XX XXXXXXX" className="input-auth" />
      </Field>

      {/* Email */}
      <Field label="Email" labelUrdu="ای میل" optional>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" className="input-auth" />
      </Field>

      {/* Password */}
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

      {/* Confirm */}
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
        <Button variant="primary" fullWidth disabled={!canSubmit} loading={saving} onClick={handleSubmit}>
          Create Owner Account
        </Button>
        <p className="text-center text-[11px] text-slate-500 mt-1.5" dir="rtl">اکاؤنٹ بنائیں</p>
      </div>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-green font-semibold">Login</Link>
      </p>
    </div>
  );
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
