import { NextRequest, NextResponse } from "next/server";
import { rides, expenses } from "@/app/api/_data/mockData";
import { verifyAuth, unauthorized } from "@/app/api/_lib/auth";

const TODAY = "2026-05-07";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) return unauthorized();

  // TODO: Connect to Prisma + MySQL here. Use aggregation queries for performance.

  const todayRides    = rides.filter((r) => r.rideTime.startsWith(TODAY));
  const monthRides    = rides.filter((r) => r.rideTime.startsWith("2026-05"));
  const approvedExp   = expenses.filter((e) => e.status === "approved" && e.date.startsWith("2026-05"));

  const totalRevenue   = monthRides.reduce((s, r) => s + r.fareAmount, 0);
  const totalExpenses  = approvedExp.reduce((s, e) => s + e.amount, 0);
  const netProfit      = totalRevenue - totalExpenses;

  // Last 7 days
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(TODAY + "T00:00:00.000Z");
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const revenue = rides
      .filter((r) => r.rideTime.startsWith(dateStr))
      .reduce((s, r) => s + r.fareAmount, 0);
    return { day: WEEK_DAYS[d.getUTCDay()], revenue };
  });

  return NextResponse.json({
    totalRides:    monthRides.length,
    todayRides:    todayRides.length,
    todayRevenue:  todayRides.reduce((s, r) => s + r.fareAmount, 0),
    totalRevenue,
    totalExpenses,
    netProfit,
    weeklyData,
  });
}
