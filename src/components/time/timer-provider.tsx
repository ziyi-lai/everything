"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "everything-active-timers";

/** Minutes. null = no reminder. */
export type ReminderMinutes = number | null;

type PersistedSession = {
  id: string;
  startedAtMs: number;
  description: string;
  linkedTaskId: string | null;
  reminderMinutes: ReminderMinutes;
  dismissedReminders: number;
};

export type TimerSession = PersistedSession & {
  elapsed: number;
  /** Set when a reminder fires; cleared by dismissReminder(id). */
  activeReminder: number | null;
};

type TimerContextValue = {
  /** Every timer currently running, in parallel. */
  sessions: TimerSession[];
  start: (input?: { description?: string; linkedTaskId?: string | null; reminderMinutes?: ReminderMinutes }) => void;
  stop: (id: string) => Promise<void>;
  cancel: (id: string) => void;
  setDescription: (id: string, value: string) => void;
  setLinkedTaskId: (id: string, value: string | null) => void;
  setReminderMinutes: (id: string, value: ReminderMinutes) => void;
  dismissReminder: (id: string) => void;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside <TimerProvider>");
  return ctx;
}

function readPersisted(): PersistedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(sessions: PersistedSession[]) {
  try {
    if (sessions.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable — timers still work for this page view
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
  const [raw, setRaw] = useState<PersistedSession[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const notifiedRef = useRef(new Set<string>());

  // Restore any timers that were running before a refresh / route change.
  // Deferred with setTimeout so it isn't a synchronous setState in an effect.
  useEffect(() => {
    const id = setTimeout(() => setRaw(readPersisted()), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (raw.length === 0) return;
    const tick = () => setNow(Date.now());
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [raw.length]);

  const sessions: TimerSession[] = raw.map((s) => {
    const elapsed = Math.floor((now - s.startedAtMs) / 1000);
    const dueReminders = s.reminderMinutes ? Math.floor(elapsed / (s.reminderMinutes * 60)) : 0;
    const activeReminder =
      s.reminderMinutes && dueReminders > s.dismissedReminders ? dueReminders * s.reminderMinutes : null;
    return { ...s, elapsed, activeReminder };
  });

  // One OS notification per newly-crossed reminder interval, per session —
  // de-duped via a ref so re-renders don't re-fire the same notification.
  useEffect(() => {
    for (const s of sessions) {
      if (s.activeReminder === null) continue;
      const key = `${s.id}:${s.activeReminder}`;
      if (notifiedRef.current.has(key)) continue;
      notifiedRef.current.add(key);
      notify(s.activeReminder, s.description);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- de-duped via notifiedRef, not deps
  }, [sessions.map((s) => `${s.id}:${s.activeReminder}`).join(",")]);

  function update(id: string, patch: Partial<PersistedSession>) {
    setRaw((cur) => {
      const next = cur.map((s) => (s.id === id ? { ...s, ...patch } : s));
      persist(next);
      return next;
    });
  }

  function start(input?: { description?: string; linkedTaskId?: string | null; reminderMinutes?: ReminderMinutes }) {
    const session: PersistedSession = {
      id: crypto.randomUUID(),
      startedAtMs: Date.now(),
      description: input?.description ?? "",
      linkedTaskId: input?.linkedTaskId ?? null,
      reminderMinutes: input?.reminderMinutes ?? null,
      dismissedReminders: 0,
    };
    setRaw((cur) => {
      const next = [...cur, session];
      persist(next);
      return next;
    });
    requestNotificationPermission();
  }

  async function stop(id: string) {
    const s = raw.find((x) => x.id === id);
    if (!s) return;
    const endTime = new Date();
    const startTime = new Date(s.startedAtMs);
    const durationSeconds = Math.max(1, Math.round((endTime.getTime() - s.startedAtMs) / 1000));
    setRaw((cur) => {
      const next = cur.filter((x) => x.id !== id);
      persist(next);
      return next;
    });
    await onSave({
      description: s.description.trim() || "Untitled session",
      startTime,
      endTime,
      durationSeconds,
      linkedTaskId: s.linkedTaskId,
    });
  }

  function cancel(id: string) {
    setRaw((cur) => {
      const next = cur.filter((x) => x.id !== id);
      persist(next);
      return next;
    });
  }

  function dismissReminder(id: string) {
    const s = sessions.find((x) => x.id === id);
    if (!s || !s.reminderMinutes) return;
    update(id, { dismissedReminders: Math.floor(s.elapsed / (s.reminderMinutes * 60)) });
  }

  return (
    <TimerContext.Provider
      value={{
        sessions,
        start,
        stop,
        cancel,
        setDescription: (id, value) => update(id, { description: value }),
        setLinkedTaskId: (id, value) => update(id, { linkedTaskId: value }),
        setReminderMinutes: (id, value) => update(id, { reminderMinutes: value }),
        dismissReminder,
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

function notify(minutes: number, description: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(`${minutes} MIN ELAPSED`, {
      body: description.trim() || "Timer still running.",
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
