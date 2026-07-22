"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/types";

export type Capture = Tables<"captures">;

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

  async function createCapture(input: { raw_text: string } & Record<string, unknown>) {
    const res = await fetch("/api/captures", { method: "POST", body: JSON.stringify(input) });
    const data = await res.json();
    await refetch();
    return data.capture as Capture;
  }

  async function updateCapture(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/captures/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    const data = await res.json();
    await refetch();
    return data.capture as Capture;
  }

  async function deleteCapture(id: string) {
    await fetch(`/api/captures/${id}`, { method: "DELETE" });
    await refetch();
  }

  return { captures, loading, refetch, createCapture, updateCapture, deleteCapture };
}
