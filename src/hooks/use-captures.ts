"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/types";

export type Capture = Tables<"captures">;

// See use-tasks.ts for why this exists — independently-mounted useCaptures()
// instances (dashboard, capture page, resurface/heatmap) don't otherwise
// see each other's mutations without a full page reload.
const CAPTURES_CHANGED_EVENT = "everything:captures-changed";

function broadcastCapturesChanged() {
  window.dispatchEvent(new CustomEvent(CAPTURES_CHANGED_EVENT));
}

export function useCaptures(filter?: { processed?: boolean; is_timer?: boolean }) {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const processedFilter = filter?.processed;
  const isTimerFilter = filter?.is_timer;

  async function refetch() {
    const params = new URLSearchParams();
    if (processedFilter !== undefined) params.set("processed", String(processedFilter));
    if (isTimerFilter !== undefined) params.set("is_timer", String(isTimerFilter));
    const res = await fetch(`/api/captures?${params.toString()}`);
    const data = await res.json();
    setCaptures(data.captures ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // deferred via setTimeout rather than called synchronously in the effect body
    const id = setTimeout(() => {
      setLoading(true);
      refetch();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only, refetch closes over current filter each render
  }, [processedFilter, isTimerFilter]);

  useEffect(() => {
    window.addEventListener(CAPTURES_CHANGED_EVENT, refetch);
    return () => window.removeEventListener(CAPTURES_CHANGED_EVENT, refetch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only, refetch closes over current filter each render
  }, [processedFilter, isTimerFilter]);

  async function createCapture(input: { raw_text: string } & Record<string, unknown>) {
    const res = await fetch("/api/captures", { method: "POST", body: JSON.stringify(input) });
    const data = await res.json();
    // merge locally instead of a full refetch — halves the round trips on
    // every mutation, which was the main source of lag
    if (data.capture) setCaptures((prev) => [data.capture as Capture, ...prev]);
    broadcastCapturesChanged();
    return data.capture as Capture;
  }

  async function updateCapture(id: string, patch: Record<string, unknown>) {
    setCaptures((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const res = await fetch(`/api/captures/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    const data = await res.json();
    if (data.capture) setCaptures((prev) => prev.map((c) => (c.id === id ? (data.capture as Capture) : c)));
    broadcastCapturesChanged();
    return data.capture as Capture;
  }

  async function deleteCapture(id: string) {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/captures/${id}`, { method: "DELETE" });
    broadcastCapturesChanged();
  }

  return { captures, loading, refetch, createCapture, updateCapture, deleteCapture };
}
