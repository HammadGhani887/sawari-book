"use client";

import toast from "react-hot-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { ScreenHeader, Card, Badge, Button } from "@/components/ui";

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {included
        ? <CheckCircle2 size={14} className="text-accent-green shrink-0" />
        : <XCircle     size={14} className="text-slate-600   shrink-0" />
      }
      <span className={`text-xs ${included ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
    </div>
  );
}

function BillingRow({ month, amount }: { month: string; amount: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <p className="text-sm text-white">{month}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white tabular-nums">{amount}</span>
        <span className="text-xs text-accent-green font-medium">Paid ✓</span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col min-h-full">
      <ScreenHeader title="Subscription" titleUrdu="سبسکرپشن" showBack />

      <div className="flex flex-col gap-4 px-4 pt-4 pb-10">

        {/* Current plan */}
        <Card className="border-accent-green/50">
          <div className="flex items-center justify-between mb-3">
            <Badge type="active" label="Pro Plan — Active" />
            <button
              type="button"
              onClick={() => toast("Cancel subscription — contact support")}
              className="text-xs text-status-red"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-slate-300">₨799/month · Up to 3 vehicles</p>
          <p className="text-xs text-slate-500 mt-1">Renews 6 June 2026</p>
        </Card>

        {/* Plan cards — horizontal scroll */}
        <div className="flex overflow-x-auto gap-4 pb-2 snap-x no-scrollbar">

          {/* Free */}
          <div className="min-w-[260px] snap-center bg-brand-surface border border-slate-700 rounded-2xl p-4 shrink-0">
            <p className="text-base font-bold text-white mb-0.5">Free</p>
            <p className="text-2xl font-bold text-white mb-3">₨0 <span className="text-sm font-normal text-slate-400">forever</span></p>
            <FeatureRow label="1 vehicle"         included />
            <FeatureRow label="1 driver"           included />
            <FeatureRow label="Basic dashboard"    included />
            <FeatureRow label="PDF exports"        included={false} />
            <FeatureRow label="Anomaly alerts"     included={false} />
            <button
              type="button"
              onClick={() => toast("Downgrade to Free — contact support")}
              className="mt-4 w-full py-2 rounded-xl border border-slate-600 text-xs font-semibold text-slate-300"
            >
              Downgrade
            </button>
          </div>

          {/* Pro (current) */}
          <div className="min-w-[260px] snap-center bg-gradient-to-b from-accent-greenDim to-brand-surface border border-accent-green rounded-2xl p-4 shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-base font-bold text-white">Pro</p>
              <Badge type="active" label="Current Plan" />
            </div>
            <p className="text-2xl font-bold text-white mb-3">₨799 <span className="text-sm font-normal text-slate-400">/mo</span></p>
            <FeatureRow label="Up to 3 vehicles"  included />
            <FeatureRow label="Up to 3 drivers"   included />
            <FeatureRow label="Full dashboard"    included />
            <FeatureRow label="PDF exports"       included />
            <FeatureRow label="Anomaly alerts"    included />
          </div>

          {/* Fleet */}
          <div className="min-w-[260px] snap-center bg-brand-surface border border-accent-blue rounded-2xl p-4 shrink-0">
            <p className="text-base font-bold text-white mb-0.5">Fleet</p>
            <p className="text-2xl font-bold text-white mb-3">₨1,999 <span className="text-sm font-normal text-slate-400">/mo</span></p>
            <FeatureRow label="Up to 10 vehicles" included />
            <FeatureRow label="Unlimited drivers"  included />
            <FeatureRow label="Full dashboard"     included />
            <FeatureRow label="PDF exports"        included />
            <FeatureRow label="Anomaly alerts"     included />
            <Button
              variant="primary"
              fullWidth
              onClick={() => toast("Fleet upgrade coming soon")}
            >
              Upgrade
            </Button>
          </div>

        </div>

        {/* Annual banner */}
        <div className="bg-status-amberDim border border-status-amber/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-status-amber mb-0.5">
            Save 17%! ₨6,990/year instead of ₨9,588
          </p>
          <p className="text-xs text-slate-400 mb-3">Pay once, save ₨2,598 annually</p>
          <Button variant="outline" fullWidth onClick={() => toast("Annual switch coming soon")}>
            Switch to Annual
          </Button>
        </div>

        {/* Payment method */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Payment Method</p>
            <button
              type="button"
              onClick={() => toast("Change payment method coming soon")}
              className="text-xs font-medium text-accent-green"
            >
              Change
            </button>
          </div>
          <p className="text-sm text-slate-300 mb-3">JazzCash ****1234</p>
          <div className="flex gap-3">
            {["JazzCash", "Easypaisa", "Card"].map((method) => (
              <div
                key={method}
                className="px-3 py-1.5 rounded-lg bg-brand-elevated text-xs text-slate-400 font-medium"
              >
                {method}
              </div>
            ))}
          </div>
        </Card>

        {/* Billing history */}
        <div>
          <p className="text-base font-bold text-white mb-3">Billing History</p>
          <Card>
            <BillingRow month="May 2026"      amount="₨799" />
            <BillingRow month="April 2026"    amount="₨799" />
            <BillingRow month="March 2026"    amount="₨799" />
          </Card>
        </div>

      </div>
    </div>
  );
}
