// The whole app is built around "today" (Today view, daily notes, daily
// scores, month rollups). `toISOString().slice(0,10)` returns the *UTC* date,
// which is wrong for 8 hours of every day in UTC+8 — a task added at 1am
// local would land on yesterday. Everything here works in APP_TIMEZONE so
// the answer is the same on the client, on the server, and on Vercel (UTC).
export const APP_TIMEZONE = "Asia/Kuala_Lumpur";

// 'en-CA' formats as YYYY-MM-DD, which is exactly the shape Postgres DATE wants.
export function todayString(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

export function monthString(date: Date = new Date()): string {
  return todayString(date).slice(0, 7);
}

/**
 * ISO instant N hours ago. Lives here rather than inline in a component
 * because the React Compiler (correctly) rejects `Date.now()` during render.
 */
export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}
