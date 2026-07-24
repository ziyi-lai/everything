import type { Capture } from "@/hooks/use-captures";

const MIN_AGE_DAYS = 3;

/** A stable per-day pseudo-random index, so the pick doesn't change on every render/refresh within the same day. */
function seededIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % length;
}

/**
 * The reward loop: capture is easy everywhere, but nothing brings you back
 * to re-read what you wrote. One old thought resurfaces per day — same
 * mechanic Flomo built its retention around.
 */
export function pickResurfaceCapture(captures: Capture[], today: string, nowMs: number): Capture | null {
  const cutoff = nowMs - MIN_AGE_DAYS * 86400000;
  const eligible = captures.filter((c) => c.created_at && new Date(c.created_at).getTime() < cutoff);
  if (eligible.length === 0) return null;
  return eligible[seededIndex(today, eligible.length)];
}
