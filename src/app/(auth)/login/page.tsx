"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, language, setLanguage } = useAuthStore();

  const [credential, setCredential] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);

  const canSubmit = credential.trim().length >= 6 && password.length >= 1;

  async function handleLogin() {
    if (!canSubmit) return;
    setLoading(true);
    const result = await login(credential.trim(), password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error ?? "Login failed");
      return;
    }
    // Read role directly from result — store may not have flushed yet
    const role = result.role ?? useAuthStore.getState().user?.role;
    router.replace(role === "owner" ? "/dashboard" : "/home");
  }

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
          <Image src="/sawari-app.png" alt="Sawari Book" width={64} height={64} className="w-full h-full object-cover" priority />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Sawari Book</h1>
          <p className="text-slate-500 text-sm mt-0.5" dir="rtl">سواری بُک</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-1" dir="rtl">لاگ ان کریں</p>
      </div>

      {/* Credential */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-1.5">Phone or Email</p>
        <input
          type="text"
          inputMode="email"
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="03XX XXXXXXX or email@example.com"
          autoFocus
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-accent-green transition-colors shadow-sm"
        />
      </div>

      {/* Password */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-1.5">Password</p>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter your password"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-accent-green transition-colors shadow-sm"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">Enter your registered phone number or email and password.</p>
      </div>

      <Button variant="primary" fullWidth disabled={!canSubmit} loading={loading} onClick={handleLogin}>
        Login
      </Button>

      <p className="text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/register" className="text-accent-green font-semibold">
          Create account
        </Link>
      </p>

      {/* Language toggle */}
      <div className="flex items-center justify-center gap-2 pt-1">
        {(["en", "ur"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              language === lang
                ? "bg-accent-green text-white"
                : "bg-white text-slate-600 border border-slate-200 shadow-sm",
            ].join(" ")}
          >
            {lang === "en" ? "English" : "اردو"}
          </button>
        ))}
      </div>
    </div>
  );
}
