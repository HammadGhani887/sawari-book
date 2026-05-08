"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 w-full">

      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
          <Image src="/sawari-app.png" alt="Sawari Book" width={64} height={64} className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 text-sm mt-0.5" dir="rtl">اکاؤنٹ بنائیں</p>
        </div>
      </div>

      <p className="text-slate-600 text-sm text-center">How will you use Sawari Book?</p>

      <div className="flex flex-col gap-3">
        {/* Owner */}
        <button
          onClick={() => router.push("/register/owner")}
          className="w-full text-left rounded-2xl p-5 border-2 border-slate-200 bg-brand-surface active:scale-[0.98] active:border-accent-green transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent-greenDim flex items-center justify-center text-3xl shrink-0">
              🏠
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">I&apos;m a Car Owner</p>
              <p className="text-sm text-slate-500 mt-0.5" dir="rtl">میں گاڑی کا مالک ہوں</p>
              <p className="text-xs text-slate-400 mt-1">Track rides, revenue & manage drivers</p>
            </div>
          </div>
        </button>

        {/* Driver */}
        <button
          onClick={() => router.push("/register/driver")}
          className="w-full text-left rounded-2xl p-5 border-2 border-slate-200 bg-brand-surface active:scale-[0.98] active:border-accent-blue transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent-blueDim flex items-center justify-center text-3xl shrink-0">
              🚘
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">I&apos;m a Driver</p>
              <p className="text-sm text-slate-500 mt-0.5" dir="rtl">میں ڈرائیور ہوں</p>
              <p className="text-xs text-slate-400 mt-1">Log rides, fuel & track earnings</p>
            </div>
          </div>
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-green font-semibold">
          Login
        </Link>
      </p>
    </div>
  );
}
