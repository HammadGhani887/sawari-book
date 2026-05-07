"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Car, BarChart3, Settings } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";

const NAV_ITEMS = [
  { href: "/dashboard", icon: <LayoutDashboard size={22} />, label: "Dashboard" },
  { href: "/vehicles",  icon: <Car size={22} />,             label: "Vehicles"  },
  { href: "/reports",   icon: <BarChart3 size={22} />,       label: "Reports"   },
  { href: "/settings",  icon: <Settings size={22} />,        label: "Settings"  },
];

export default function OwnerBottomNav() {
  const pathname = usePathname();

  const items = NAV_ITEMS.map((item) => ({
    ...item,
    active: pathname.startsWith(item.href),
  }));

  return <BottomNav items={items} accentColor="green" />;
}
