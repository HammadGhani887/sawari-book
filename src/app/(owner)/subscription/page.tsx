"use client";

import { ScreenHeader, Card } from "@/components/ui";
import { CheckCircle2, MessageCircle } from "lucide-react";

const FEATURES = [
  { label: "Unlimited vehicles",          included: true  },
  { label: "Unlimited drivers",           included: true  },
  { label: "Ride & expense tracking",     included: true  },
  { label: "Monthly settlement + PDF",    included: true  },
  { label: "Revenue anomaly alerts",      included: true  },
  { label: "Daily target tracking",       included: true  },
  { label: "Offline ride logging",        included: true  },
  { label: "WhatsApp report sharing",     included: true  },
  { label: "Multi-device sync (backend)", included: false },
  { label: "Push notifications",          included: false },
];

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Subscription" titleUrdu="سبسکرپشن" showBack />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-10">

        {/* Current status */}
        <div className="bg-accent-greenDim border border-accent-green/30 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-green mb-1">Current Plan</p>
          <p className="text-3xl font-bold text-slate-900">Free Beta</p>
          <p className="text-sm text-slate-600 mt-1">All features unlocked during beta testing</p>
          <p className="text-xs text-slate-500 mt-0.5" dir="rtl">بیٹا ٹیسٹنگ کے دوران تمام فیچرز مفت</p>
        </div>

        {/* Features list */}
        <Card>
          <p className="text-sm font-semibold text-slate-900 mb-3">What&apos;s Included</p>
          <div className="flex flex-col gap-2">
            {FEATURES.map(({ label, included }) => (
              <div key={label} className="flex items-center gap-2.5">
                <CheckCircle2
                  size={15}
                  className={included ? "text-accent-green shrink-0" : "text-slate-300 shrink-0"}
                />
                <span className={`text-sm ${included ? "text-slate-800" : "text-slate-400"}`}>
                  {label}
                  {!included && <span className="text-[10px] text-slate-400 ml-1">(coming soon)</span>}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Coming soon pricing */}
        <Card>
          <p className="text-sm font-semibold text-slate-900 mb-1">Pricing (After Beta)</p>
          <p className="text-xs text-slate-500 mb-3">Pricing will be announced after beta testing is complete.</p>
          <div className="flex flex-col gap-2">
            {[
              { plan: "Basic",  price: "₨499/month",  desc: "1-2 vehicles" },
              { plan: "Pro",    price: "₨999/month",  desc: "Up to 5 vehicles" },
              { plan: "Fleet",  price: "₨1,999/month", desc: "Unlimited vehicles" },
            ].map(({ plan, price, desc }) => (
              <div key={plan} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{plan}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <p className="text-sm font-bold text-accent-green">{price}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact */}
        <a
          href="https://wa.me/923001234567?text=Hi%2C%20I%27m%20using%20Sawari%20Book%20and%20want%20to%20know%20about%20subscription"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 text-sm font-semibold active:opacity-70 transition-opacity"
        >
          <MessageCircle size={18} style={{ color: "#25D366" }} />
          Contact us on WhatsApp
        </a>

      </div>
    </div>
  );
}
