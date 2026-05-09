"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Home, Clock, BarChart3, User, Plus, Fuel, Receipt, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home",      icon: Home,     label: "Home",      urdu: "ہوم"       },
  { href: "/my-day",    icon: Clock,    label: "My Day",    urdu: "میرا دن"   },
  { href: "/my-stats",  icon: BarChart3,label: "Stats",     urdu: "اعداد"     },
  { href: "/earnings",  icon: BarChart3,label: "Earnings",  urdu: "کمائی"     },
  { href: "/profile",   icon: User,     label: "Profile",   urdu: "پروفائل"   },
];

const QUICK_ACTIONS = [
  { href: "/add-ride",    icon: Plus,    label: "Add Ride",    color: "text-accent-blue"  },
  { href: "/add-fuel",    icon: Fuel,    label: "Add Fuel",    color: "text-status-amber" },
  { href: "/add-expense", icon: Receipt, label: "Add Expense", color: "text-slate-600"    },
];

export default function DriverSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 z-40">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0">
          <Image src="/sawari-app.png" alt="Sawari Book" width={36} height={36} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">Sawari Book</p>
          <p className="text-[10px] text-slate-400" dir="rtl">سواری بُک</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">Quick Add</p>
        <div className="flex flex-col gap-1">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Icon size={16} className={`shrink-0 ${color}`} />
              <span className={`text-sm font-medium ${color}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto border-t border-slate-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2 mt-2">Navigation</p>
        {NAV_ITEMS.map(({ href, icon: Icon, label, urdu }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all",
                isActive
                  ? "bg-accent-blueDim text-accent-blue font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon size={18} className="shrink-0" />
              <div>
                <p className="text-sm leading-tight">{label}</p>
                <p className="text-[9px] opacity-50 font-[system-ui]" dir="rtl">{urdu}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-accent-blueDim flex items-center justify-center shrink-0 overflow-hidden">
            {user?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-accent-blue">{user?.name?.[0] ?? "D"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name ?? "Driver"}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.phone ?? ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-status-red transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

    </aside>
  );
}
