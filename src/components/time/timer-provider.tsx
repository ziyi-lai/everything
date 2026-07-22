"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "everything-active-timer";
const REMINDER_KEY = "everything-timer-reminder";

/** Minutes. null = no reminder. */
export type ReminderMinutes = number | null;

type PersistedTimer = {
  startedAtMs: number;
  description: string;
  linkedTaskId: string | null;
};

type TimerContextValue = {
  running: boolean;
  elapsed: number;
  description: string;
  linkedTaskId: string | null;
  reminderMinutes: ReminderMinutes;
  /** How many reminder intervals have already elapsed this session. */
  remindersFired: number;
  /** Set when a reminder fires; cleared by dismiss(). */
  activeReminder: number | null;
  start: (input?: { description?: string; linkedTaskId?: string | null }) => void;
  stop: () => Promise<void>;
  cancel: () => void;
  setDescription: (value: string) => void;
  setLinkedTaskId: (value: string | null) => void;
  setReminderMinutes: (value: ReminderMinutes) => void;
  dismissReminder: () => void;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside <TimerProvider>");
  return ctx;
}

function readPersisted(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedTimer) : null;
  } catch {
    return null;
  }
}

function readReminder(): ReminderMinutes {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw === null || raw === "null") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function TimerProvider({
  children,
  onSave,
}: {
  children: React.ReactNode;
  onSave: (entry: {
    description: string;
    startTime: Date;
    endTime: Date;
    durationSeconds: number;
    linkedTaskId: string | null;
  }) => Promise<unknown>;
}) {
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [description, setDescriptionState] = useState("");
  const [linkedTaskId, setLinkedTaskIdState] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [reminderMinutes, setReminderMinutesState] = useState<ReminderMinutes>(null);
  // Reminders are derived from elapsed time rather than tracked as their own
  // state — the only thing worth storing is how many the user has dismissed.
  const [dismissedReminders, setDismissedReminders] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Restore a timer that was running before a refresh / route change.
  // Deferred with setTimeout so it isn't a synchronous setState in an effect.
  useEffect(() => {
    const id = setTimeout(() => {
      const persisted = readPersisted();
      if (persisted) {
        setStartedAtMs(persisted.startedAtMs);
        setDescriptionState(persisted.description);
        setLinkedTaskIdState(persisted.linkedTaskId);
        // reminders that passed while the tab was away shouldn't all pop at once
        const mins = readReminder();
        if (mins) {
          const elapsedMin = (Date.now() - persisted.startedAtMs) / 60000;
          setDismissedReminders(Math.floor(elapsedMin / mins));
        }
      }
      setReminderMinutesState(readReminder());
      setHydrated(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const running = startedAtMs !== null;

  useEffect(() => {
    if (!running) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAtMs!) / 1000));
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [running, startedAtMs]);

  // How many whole reminder intervals have elapsed, and whether one is
  // outstanding. Both fall straight out of `elapsed` — no bookkeeping.
  const dueReminders = running && reminderMinutes ? Math.floor(elapsed / (reminderMinutes * 60)) : 0;
  const activeReminder =
    reminderMinutes && dueReminders > dismissedReminders ? dueReminders * reminderMinutes : null;

  // One OS notification per newly-crossed interval: the dep list means this
  // runs exactly once each time `dueReminders` increments. `notify` reads the
  // description from storage rather than taking it as a dep, which would
  // re-fire the notification on every keystroke.
  useEffect(() => {
    if (dueReminders === 0 || !reminderMinutes) return;
    notify(dueReminders * reminderMinutes);
  }, [dueReminders, reminderMinutes]);

  function persist(next: PersistedTimer | null) {
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — timer still works for this page view
    }
  }

  function start(input?: { description?: string; linkedTaskId?: string | null }) {
    const now = Date.now();
    const nextDescription = input?.description ?? description;
    const nextTask = input?.linkedTaskId !== undefined ? input.linkedTaskId : linkedTaskId;
    setStartedAtMs(now);
    setDescriptionState(nextDescription);
    setLinkedTaskIdState(nextTask);
    setElapsed(0);
    setDismissedReminders(0);
    persist({ startedAtMs: now, description: nextDescription, linkedTaskId: nextTask });
    requestNotificationPermission();
  }

  function reset() {
    setStartedAtMs(null);
    setElapsed(0);
    setDescriptionState("");
    setLinkedTaskIdState(null);
    setDismissedReminders(0);
    persist(null);
  }

  async function stop() {
    if (startedAtMs === null) return;
    const endTime = new Date();
    const startTime = new Date(startedAtMs);
    const durationSeconds = Math.max(1, Math.round((endTime.getTime() - startedAtMs) / 1000));
    const payload = {
      description: description.trim() || "Untitled session",
      startTime,
      endTime,
      durationSeconds,
      linkedTaskId,
    };
    reset();
    await onSave(payload);
  }

  function setReminderMinutes(value: ReminderMinutes) {
    setReminderMinutesState(value);
    try {
      localStorage.setItem(REMINDER_KEY, value === null ? "null" : String(value));
    } catch {
      // preference just won't persist
    }
  }

  function setDescription(value: string) {
    setDescriptionState(value);
    if (startedAtMs !== null) persist({ startedAtMs, description: value, linkedTaskId });
  }

  function setLinkedTaskId(value: string | null) {
    setLinkedTaskIdState(value);
    if (startedAtMs !== null) persist({ startedAtMs, description, linkedTaskId: value });
  }

  return (
    <TimerContext.Provider
      value={{
        running: hydrated && running,
        elapsed,
        description,
        linkedTaskId,
        reminderMinutes,
        remindersFired: dueReminders,
        activeReminder,
        start,
        stop,
        cancel: reset,
        setDescription,
        setLinkedTaskId,
        setReminderMinutes,
        dismissReminder: () => setDismissedReminders(dueReminders),
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

function requestNotificationPermission() {
  // Called from the START click, which is the user gesture browsers require.
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") void Notification.requestPermission();
}

function notify(minutes: number) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(`${minutes} MIN ELAPSED`, {
      body: readPersisted()?.description?.trim() || "Timer still running.",
      tag: "everything-timer",
    });
  } catch {
    // some browsers throw on constructing Notification outside a SW; the
    // in-app banner still shows either way
  }
}

export function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
