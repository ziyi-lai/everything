"use client";

import { X } from "lucide-react";
import { useTimer } from "@/components/time/timer-provider";
import { BlinkingDot } from "@/components/time/quick-timer";

/**
 * In-app reminder. Always shown (the OS Notification is best-effort — it
 * needs permission and is invisible when the tab is focused anyway).
 * One banner per session whose reminder just fired, stacked.
 */
export function ReminderBanner() {
  const { sessions, dismissReminder } = useTimer();
  const due = sessions.filter((s) => s.activeReminder !== null);
  if (due.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-6 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {due.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4 rounded-full border border-accent bg-surface px-5 py-3 transition-mech"
        >
          <BlinkingDot />
          <span className="label !text-hero">{s.activeReminder} MIN ELAPSED</span>
          <span className="label max-w-[220px] truncate !text-muted">
            {s.description || "TIMER STILL RUNNING"}
          </span>
          <button
            type="button"
            aria-label="Dismiss reminder"
            onClick={() => dismissReminder(s.id)}
            className="text-faint transition-mech hover:text-foreground"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
