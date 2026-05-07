"use client";

import { usePathname } from "next/navigation";
import { Home, Clock, BarChart3, User } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";

const NAV_ITEMS = [
  { href: "/home",     icon: <Home size={22} />,       label: "Home"    },
  { href: "/my-day",   icon: <Clock size={22} />,      label: "My Day"  },
  { href: "/my-stats", icon: <BarChart3 size={22} />,  label: "Stats"   },
  { href: "/profile",  icon: <User size={22} />,       label: "Profile" },
];

export default function DriverBottomNav() {
  const pathname = usePathname();

  const items = NAV_ITEMS.map((item) => ({
    ...item,
    active: pathname.startsWith(item.href),
  }));

  return <BottomNav items={items} accentColor="blue" />;
}
