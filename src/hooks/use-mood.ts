"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/types";

export type MoodEntry = Tables<"mood_entries">;

export const MOOD_EMOJI: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const MOOD_CHANGED_EVENT = "everything:mood-changed";

export function useMoodEntries(range?: { from?: string; to?: string }) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const from = range?.from;
  const to = range?.to;

  async function refetch() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/mood?${params.toString()}`);
    const data = await res.json();
    setEntries(data.entries ?? []);
  }

  useEffect(() => {
    const id = setTimeout(refetch, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only, refetch closes over current range each render
  }, [from, to]);

  useEffect(() => {
    window.addEventListener(MOOD_CHANGED_EVENT, refetch);
    return () => window.removeEventListener(MOOD_CHANGED_EVENT, refetch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only, refetch closes over current range each render
  }, [from, to]);

  return { entries, refetch };
}

export function broadcastMoodChanged() {
  window.dispatchEvent(new CustomEvent(MOOD_CHANGED_EVENT));
}

/** First mood entry logged within [start, end) — used to surface "what mood
 * was logged during this session" on a time block without merging the two
 * data models together. */
export function findMoodInRange(moods: MoodEntry[], start: string | null, end: string | null): MoodEntry | null {
  if (!start) return null;
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : startMs;
  return moods.find((m) => {
    const t = new Date(m.recorded_at).getTime();
    return t >= startMs && t <= endMs;
  }) ?? null;
}
