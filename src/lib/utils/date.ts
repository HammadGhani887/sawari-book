import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfYear, isWithinInterval, parseISO } from "date-fns";

export type DateRangeType = "today" | "yesterday" | "week" | "month" | "year" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
  type: DateRangeType;
}

export function getRangeInterval(type: DateRangeType, customRange?: { start: string; end: string }): { start: Date; end: Date } {
  const now = new Date();
  
  switch (type) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfDay(now) };
    case "year":
      return { start: startOfYear(now), end: endOfDay(now) };
    case "custom":
      return customRange && customRange.start && customRange.end 
        ? { start: startOfDay(parseISO(customRange.start)), end: endOfDay(parseISO(customRange.end)) } 
        : { start: startOfDay(now), end: endOfDay(now) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

export function isDateInRange(date: string | Date, range: { start: Date; end: Date }): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return isWithinInterval(d, { start: range.start, end: range.end });
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
