"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";

// ── Mobile splash (< 768px) ───────────────────────────────────────────────────
function MobileSplash() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => {
      if (isAuthenticated && user) {
        router.replace(user.role === "owner" ? "/dashboard" : "/home");
      } else {
        router.replace("/login");
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-6">
      <div className="w-28 h-28 rounded-[2rem] overflow-hidden animate-scaleIn shadow-2xl border border-white/10 bg-white p-1">
        <Image 
          src="/sawari-app.png" 
          alt="Sawari Book" 
          width={112} 
          height={112} 
          className="w-full h-full object-cover rounded-[1.8rem]" 
          priority 
        />
      </div>
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <h1 className="text-4xl font-bold text-white tracking-tight">Sawari Book</h1>
        <p className="text-accent-green text-sm font-medium mt-2 tracking-widest uppercase" dir="rtl">سواری بُک</p>
      </div>
    </div>
  );
}

// ── Desktop landing page (≥ 768px) ───────────────────────────────────────────
function DesktopLanding() {
  const FEATURES = [
    { icon: "🚗", title: "Ride Tracking",       desc: "Log every ride with platform, fare, distance and boost cost. See per-ride profit instantly." },
    { icon: "⛽", title: "Fuel Management",      desc: "Track fuel fill-ups, auto-calculate litres from price, and monitor km/L average per vehicle." },
    { icon: "🧾", title: "Expense Approval",     desc: "Drivers submit expenses, owners approve or reject. Only approved costs affect profit." },
    { icon: "💰", title: "Monthly Settlement",   desc: "Calculate monthly profit: revenue minus fuel, expenses, platform commission, and driver salary." },
    { icon: "📊", title: "Reports & Analytics",  desc: "Daily revenue charts, platform split, expense breakdown, and custom date range reports." },
    { icon: "📱", title: "Works Offline",         desc: "Add rides, fuel, and expenses even without internet. Data syncs automatically when online." },
    { icon: "🔔", title: "Real-time Alerts",     desc: "Owner gets notified when driver submits expense or logs a ride. Revenue anomaly detection." },
    { icon: "🚀", title: "Boost Tracking",       desc: "Track inDrive/Yango boost costs per ride for accurate net profit calculation." },
  ];

  const STATS = [
    { value: "2 Roles",    label: "Owner & Driver" },
    { value: "100%",       label: "Free Beta"      },
    { value: "Offline",    label: "PWA Support"    },
    { value: "Pakistan",   label: "Made for PK"    },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm">
              <Image src="/sawari-app.png" alt="Sawari Book" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold text-slate-900">Sawari Book</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-xl bg-accent-green text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent-greenDim border border-accent-green/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs font-semibold text-accent-green">Free Beta — All Features Unlocked</span>
          </div>

          <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-4">
            Track Every Ride.<br />
            <span className="text-accent-green">Know Your Profit.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-3">
            Pakistan ka pehla ride-hailing revenue tracker for car owners and drivers.
          </p>
          <p className="text-base text-slate-500 mb-10" dir="rtl">
            پاکستان کا پہلا رائیڈ ہیلنگ ریونیو ٹریکر
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register"
              className="px-8 py-4 rounded-2xl bg-accent-green text-white text-base font-bold hover:opacity-90 transition-opacity shadow-lg shadow-green-500/20">
              Start Free — Owner
            </Link>
            <Link href="/register"
              className="px-8 py-4 rounded-2xl bg-accent-blue text-white text-base font-bold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
              Join as Driver
            </Link>
          </div>

          <p className="text-xs text-slate-400 mt-4">No credit card required · Install on Android & iOS</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything You Need</h2>
            <p className="text-slate-500">Built specifically for Pakistan&apos;s ride-hailing market</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-slate-50 rounded-2xl p-5 hover:bg-slate-100 transition-colors">
                <span className="text-3xl leading-none">{icon}</span>
                <h3 className="text-sm font-bold text-slate-900 mt-3 mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {[
              { step: "1", title: "Owner registers",  desc: "Add your vehicles with fuel settings, salary structure, and daily targets." },
              { step: "2", title: "Invite your driver", desc: "Share an invite link. Driver registers and gets linked to your vehicle automatically." },
              { step: "3", title: "Track everything",  desc: "Driver logs rides, fuel, expenses. Owner sees real-time profit and monthly settlement." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent-green text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Supports All Major Platforms</h2>
          <div className="flex items-center justify-center gap-6 mt-6">
            {[
              { name: "inDrive",  color: "#2DB543" },
              { name: "Yango",    color: "#FFC107" },
              { name: "Private",  color: "#3B82F6" },
              { name: "Other",    color: "#64748B" },
            ].map(({ name, color }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-slate-700">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to track your profit?</h2>
          <p className="text-slate-400 mb-8">Free during beta. Install on your phone like a native app.</p>
          <Link href="/register"
            className="inline-block px-10 py-4 rounded-2xl bg-accent-green text-white text-base font-bold hover:opacity-90 transition-opacity">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src="/sawari-app.png" alt="Sawari Book" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Sawari Book</span>
          </div>
          <p className="text-xs text-slate-400">Made for Pakistan 🇵🇰 · سواری بُک</p>
        </div>
      </footer>

    </div>
  );
}

// ── Root page — detect device ─────────────────────────────────────────────────
export default function RootPage() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Avoid flash — wait for client
  if (isMobile === null) return null;

  return isMobile ? <MobileSplash /> : <DesktopLanding />;
}
