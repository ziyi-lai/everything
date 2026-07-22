import { todayString } from "@/lib/date";

export type PeriodMode = "DAY" | "WEEK" | "MONTH";

/** Local-midnight Date for a YYYY-MM-DD string (avoids the UTC-parse trap). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDay(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Monday-first week start. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Inclusive start, exclusive end — the range the given anchor+mode covers. */
export function periodRange(anchor: string, mode: PeriodMode): { start: Date; end: Date } {
  const date = parseDay(anchor);
  if (mode === "DAY") {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  if (mode === "WEEK") {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }
  const start = startOfMonth(date);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return { start, end };
}

export function shiftPeriod(anchor: string, mode: PeriodMode, delta: number): string {
  const date = parseDay(anchor);
  if (mode === "DAY") date.setDate(date.getDate() + delta);
  else if (mode === "WEEK") date.setDate(date.getDate() + delta * 7);
  else date.setMonth(date.getMonth() + delta);
  return formatDay(date);
}

export function periodLabel(anchor: string, mode: PeriodMode): string {
  const { start, end } = periodRange(anchor, mode);
  if (mode === "DAY") {
    return start
      .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
      .toUpperCase();
  }
  if (mode === "WEEK") {
    const last = new Date(end);
    last.setDate(last.getDate() - 1);
    const sameMonth = start.getMonth() === last.getMonth();
    const left = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const right = last.toLocaleDateString("en-US", sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" });
    return `${left} – ${right}`.toUpperCase();
  }
  return start.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

export function isToday(date: Date): boolean {
  return formatDay(date) === todayString();
}

export function formatDuration(seconds: number): string {
  // sub-minute sessions read as "0m" if rounded, which looks like a bug
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
