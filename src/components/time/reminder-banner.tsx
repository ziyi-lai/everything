"use client";

import { X } from "lucide-react";
import { useTimer } from "@/components/time/timer-provider";
import { BlinkingDot } from "@/components/time/quick-timer";

/**
 * In-app reminder. Always shown (the OS Notification is best-effort — it
 * needs permission and is invisible when the tab is focused anyway).
 * Inline status bar rather than a toast library, per the design system.
 */
export function ReminderBanner() {
  const { activeReminder, dismissReminder, description } = useTimer();
  if (activeReminder === null) return null;

  return (
    <div className="fixed left-1/2 top-6 z-[60] flex -translate-x-1/2 items-center gap-4 rounded-full border border-accent bg-surface px-5 py-3 transition-mech">
      <BlinkingDot />
      <span className="label !text-hero">{activeReminder} MIN ELAPSED</span>
      <span className="label max-w-[220px] truncate !text-muted">
        {description || "TIMER STILL RUNNING"}
      </span>
      <button
        type="button"
        aria-label="Dismiss reminder"
        onClick={dismissReminder}
        className="text-faint transition-mech hover:text-foreground"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
