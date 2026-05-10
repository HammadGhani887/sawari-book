"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Car, User } from "lucide-react";
import { Button } from "@/components/ui";

interface InviteData {
  token:       string;
  ownerName:   string;
  vehicleName: string;
  vehicleId:   string;
  ownerId:     string;
  expiresAt:   string;
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();

  const [invite,  setInvite]  = useState<InviteData | null>(null);
  const [status,  setStatus]  = useState<"loading" | "valid" | "invalid" | "used" | "expired">("loading");

  useEffect(() => {
    fetch(`/api/invites/${params.token}`)
      .then((r) => {
        if (r.status === 409) { setStatus("used");    return null; }
        if (r.status === 410) { setStatus("expired"); return null; }
        if (!r.ok)            { setStatus("invalid"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) { setInvite(data); setStatus("valid"); }
      })
      .catch(() => setStatus("invalid"));
  }, [params.token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500">Checking invite...</p>
      </div>
    );
  }

  if (status === "used") {
    return (
      <div className="flex flex-col gap-4 w-full items-center py-8">
        <span className="text-5xl">✅</span>
        <p className="text-slate-900 font-semibold text-center">This invite has already been used.</p>
        <Link href="/login" className="text-accent-green font-semibold text-sm">Login to your account</Link>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col gap-4 w-full items-center py-8">
        <span className="text-5xl">⏰</span>
        <p className="text-slate-900 font-semibold text-center">This invite link has expired.</p>
        <p className="text-sm text-slate-500 text-center">Ask your owner to send a new invite.</p>
        <Link href="/login" className="text-accent-green font-semibold text-sm">Go to Login</Link>
      </div>
    );
  }

  if (status === "invalid" || !invite) {
    return (
      <div className="flex flex-col gap-4 w-full items-center py-8">
        <span className="text-5xl">❌</span>
        <p className="text-slate-900 font-semibold text-center">This invite link is invalid or has expired.</p>
        <Link href="/login" className="text-accent-green font-semibold text-sm">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">

      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
          <Image src="/sawari-app.png" alt="Sawari Book" width={64} height={64} className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">You&apos;ve Been Invited!</h1>
          <p className="text-slate-500 text-sm mt-0.5" dir="rtl">آپ کو دعوت دی گئی ہے</p>
        </div>
      </div>

      {/* Invite details */}
      <div className="bg-brand-surface rounded-2xl p-4 flex flex-col gap-3 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-greenDim flex items-center justify-center shrink-0">
            <User size={16} className="text-accent-green" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Invited by</p>
            <p className="text-sm font-semibold text-slate-900">{invite.ownerName}</p>
          </div>
        </div>
        <div className="h-px bg-slate-200" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-blueDim flex items-center justify-center shrink-0">
            <Car size={16} className="text-accent-blue" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Vehicle</p>
            <p className="text-sm font-semibold text-slate-900">{invite.vehicleName}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center">
        Register as a driver to get linked to this vehicle and start tracking your rides.
      </p>

      <Button
        variant="driver"
        fullWidth
        onClick={() => router.push(`/register/driver?token=${params.token}`)}
      >
        Register as Driver
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-blue font-semibold">Login</Link>
      </p>
    </div>
  );
}
