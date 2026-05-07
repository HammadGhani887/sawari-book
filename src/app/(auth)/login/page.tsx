"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/lib/store/authStore";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, language, setLanguage } = useAuthStore();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown when OTP step activates
  useEffect(() => {
    if (step !== "otp") return;
    setCountdown(30);
    setCanResend(false);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  function handleSendOtp() {
    setOtp(["", "", "", "", "", ""]);
    setStep("otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }

  function handleOtpChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = otp.map((d, i) => (i === index ? digit : d));
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) submitOtp(next.join(""));
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function submitOtp(code: string) {
    setVerifying(true);
    try {
      await login(phone, code);
      router.replace("/role-select");
    } finally {
      setVerifying(false);
    }
  }

  function handleResend() {
    setOtp(["", "", "", "", "", ""]);
    setCountdown(30);
    setCanResend(false);
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  const otpComplete = otp.every((d) => d !== "");
  const maskedPhone = `+92 ${phone.slice(0, 3)} ${phone.slice(3)}`.trim();

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="w-16 h-16 rounded-2xl bg-accent-greenDim flex items-center justify-center">
          <span className="text-4xl">🚗</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Sawari Book</h1>
          <p className="text-slate-400 text-sm mt-0.5" dir="rtl">سواری بُک</p>
        </div>
      </div>

      {step === "phone" ? (
        <>
          <div>
            <h2 className="text-xl font-bold text-white">Enter Your Phone Number</h2>
            <p className="text-sm text-slate-500 mt-1">اپنا فون نمبر درج کریں</p>
          </div>

          {/* Phone row */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700 focus-within:border-accent-green transition-colors">
            <div className="flex items-center justify-center px-4 bg-brand-elevated text-slate-300 text-sm font-medium shrink-0 select-none">
              +92
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="3XX XXXXXXX"
              autoFocus
              className="flex-1 bg-brand-surface text-white px-4 py-3.5 text-sm placeholder:text-slate-600 outline-none"
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            disabled={phone.length !== 10}
            loading={isLoading}
            onClick={handleSendOtp}
          >
            Send OTP
          </Button>

          {/* Language toggle */}
          <div className="flex items-center justify-center gap-2">
            {(["en", "ur"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={[
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  language === lang
                    ? "bg-accent-green text-white"
                    : "bg-brand-surface text-slate-400 border border-slate-700",
                ].join(" ")}
              >
                {lang === "en" ? "English" : "اردو"}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600">
            By continuing, you agree to our Terms
          </p>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-bold text-white">Verify Your Number</h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter the 6-digit code sent to{" "}
              <span className="text-white font-medium">{maskedPhone}</span>
            </p>
          </div>

          {/* OTP boxes */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={[
                  "w-12 h-12 rounded-lg text-center text-xl font-bold text-white",
                  "bg-brand-surface border transition-colors outline-none",
                  digit ? "border-accent-green" : "border-slate-700",
                  "focus:border-accent-green",
                ].join(" ")}
              />
            ))}
          </div>

          <Button
            variant="primary"
            fullWidth
            disabled={!otpComplete}
            loading={verifying}
            onClick={() => submitOtp(otp.join(""))}
          >
            Verify
          </Button>

          <div className="flex flex-col items-center gap-2">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-accent-green font-medium"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-sm text-slate-500">
                Resend in <span className="tabular-nums">{countdown}s</span>
              </p>
            )}
            <button
              onClick={() => setStep("phone")}
              className="text-xs text-slate-600 underline underline-offset-2"
            >
              Change number
            </button>
          </div>
        </>
      )}
    </div>
  );
}
