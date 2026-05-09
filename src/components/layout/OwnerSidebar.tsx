"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import {
  LayoutDashboard, Car, Users, BarChart3, Settings,
  Bell, LogOut, Calculator,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard",  urdu: "ڈیش بورڈ" },
  { href: "/vehicles",  icon: Car,             label: "Vehicles",   urdu: "گاڑیاں"   },
  { href: "/drivers",   icon: Users,           label: "Drivers",    urdu: "ڈرائیور"  },
  { href: "/rides",     icon: Car,             label: "All Rides",  urdu: "سواریاں"  },
  { href: "/expenses",  icon: Calculator,      label: "Expenses",   urdu: "اخراجات"  },
  { href: "/reports",   icon: BarChart3,       label: "Reports",    urdu: "رپورٹس"   },
  { href: "/settings",  icon: Settings,        label: "Settings",   urdu: "سیٹنگز"   },
];

export default function OwnerSidebar() {
  const pathname     = usePathname();
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const logout       = useAuthStore((s) => s.logout);
  const unreadCount  = useNotificationStore((s) => s.unreadCount)();

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

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, urdu }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all",
                isActive
                  ? "bg-accent-greenDim text-accent-green font-semibold"
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

      {/* Notifications + User */}
      <div className="px-3 py-4 border-t border-slate-100">
        <Link
          href="/notifications"
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors mb-1"
        >
          <div className="flex items-center gap-3">
            <Bell size={18} />
            <span className="text-sm">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-status-red rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-accent-greenDim flex items-center justify-center shrink-0 overflow-hidden">
            {user?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-accent-green">{user?.name?.[0] ?? "O"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name ?? "Owner"}</p>
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
