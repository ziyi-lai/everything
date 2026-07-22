"use client";

import { useRouter } from "next/navigation";
import { TimerProvider } from "@/components/time/timer-provider";
import { ReminderBanner } from "@/components/time/reminder-banner";

/**
 * Client boundary that owns the app-wide timer. Lives in the dashboard
 * layout so a running session survives navigation between domains.
 */
export function TimerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function saveEntry(entry: {
    description: string;
    startTime: Date;
    endTime: Date;
    durationSeconds: number;
    linkedTaskId: string | null;
  }) {
    const res = await fetch("/api/captures", {
      method: "POST",
      body: JSON.stringify({
        raw_text: entry.description,
        is_timer: true,
        start_time: entry.startTime.toISOString(),
        end_time: entry.endTime.toISOString(),
        duration_seconds: entry.durationSeconds,
      }),
    });
    const data = await res.json();

    if (entry.linkedTaskId && data.capture?.id) {
      await fetch(`/api/captures/${data.capture.id}`, {
        method: "PATCH",
        body: JSON.stringify({ converted_to_task_id: entry.linkedTaskId }),
      });
    }

    // the timeline/analytics on whatever page is open should pick this up
    router.refresh();
    window.dispatchEvent(new CustomEvent("everything:capture-saved"));
    return data.capture;
  }

  return (
    <TimerProvider onSave={saveEntry}>
      <ReminderBanner />
      {children}
    </TimerProvider>
  );
}
