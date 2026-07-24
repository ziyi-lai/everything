"use client";

import { useState } from "react";
import { Play, Square, Timer as TimerIcon, X, Bell, Link2, Plus } from "lucide-react";
import { useTimer, formatElapsed, type ReminderMinutes } from "@/components/time/timer-provider";
import { TaskLinkPicker } from "@/components/shared/task-link-picker";
import { useTasks, type Task } from "@/hooks/use-tasks";

const REMINDER_OPTIONS: { label: string; value: ReminderMinutes }[] = [
  { label: "OFF", value: null },
  { label: "15M", value: 15 },
  { label: "25M", value: 25 },
  { label: "30M", value: 30 },
  { label: "60M", value: 60 },
];

/**
 * Floating time-tracking control, bottom-right on every page. Collapsed to a
 * single icon when idle; each running session gets its own pill, so several
 * timers can run in parallel (e.g. one per task) without blocking each other.
 */
export function TimerDock() {
  const timer = useTimer();
  const { tasks } = useTasks();
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTask, setDraftTask] = useState<Task | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftReminder, setDraftReminder] = useState<ReminderMinutes>(null);

  function startFromPanel() {
    timer.start({
      description: draft || draftTask?.title || "",
      linkedTaskId: draftTask?.id ?? null,
      reminderMinutes: draftReminder,
    });
    setDraft("");
    setDraftTask(null);
    setDraftReminder(null);
    setPickerOpen(false);
    setPanelOpen(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {timer.sessions.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-2 rounded-full border border-accent bg-surface py-2 pl-3 pr-2 transition-mech"
        >
          <BlinkingDot />
          <span className="font-mono text-body-sm tabular-nums text-hero">{formatElapsed(s.elapsed)}</span>
          <span className="label max-w-[140px] truncate !text-muted">{s.description || "UNTITLED"}</span>
          {s.reminderMinutes && <Bell size={11} strokeWidth={1.5} className="shrink-0 text-faint" />}
          <button
            type="button"
            aria-label="Stop timer"
            onClick={() => void timer.stop(s.id)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-hero transition-mech hover:opacity-90"
          >
            <Square size={9} strokeWidth={0} fill="currentColor" />
          </button>
        </div>
      ))}

      {panelOpen && (
        <div className="flex w-72 flex-col gap-3 rounded-2xl border border-border-visible bg-surface p-4 transition-mech">
          <div className="flex items-center justify-between">
            <span className="label">NEW SESSION</span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setPanelOpen(false)}
              className="text-faint transition-mech hover:text-foreground"
            >
              <X size={13} strokeWidth={1.5} />
            </button>
          </div>

          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startFromPanel()}
            placeholder="What are you working on?"
            className="border-0 border-b border-border-visible bg-transparent pb-1 text-body-sm text-foreground outline-none transition-mech focus:border-foreground placeholder:text-faint"
          />

          {draftTask ? (
            <div className="label flex items-center gap-1.5 !text-interactive">
              <Link2 size={11} strokeWidth={1.5} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{draftTask.title}</span>
              <button
                type="button"
                aria-label="Unlink task"
                onClick={() => setDraftTask(null)}
                className="shrink-0 transition-mech hover:!text-accent"
              >
                <X size={11} strokeWidth={2} />
              </button>
            </div>
          ) : pickerOpen ? (
            <TaskLinkPicker
              tasks={tasks}
              onCancel={() => setPickerOpen(false)}
              onSelect={(task) => {
                setDraftTask(task);
                setPickerOpen(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="label flex items-center gap-1.5 !text-faint transition-mech hover:!text-muted"
            >
              <Link2 size={11} strokeWidth={1.5} />
              LINK TO TASK
            </button>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="label !text-faint">REMIND ME EVERY</span>
            <div className="flex flex-wrap gap-1">
              {REMINDER_OPTIONS.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setDraftReminder(o.value)}
                  className={`label rounded-full border px-2 py-1 transition-mech ${
                    draftReminder === o.value
                      ? "border-hero !text-hero"
                      : "border-border-visible !text-muted hover:!text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startFromPanel}
            className="label flex h-9 items-center justify-center gap-2 rounded-full bg-hero text-black transition-mech hover:opacity-90"
          >
            <Play size={10} strokeWidth={0} fill="currentColor" />
            START
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-label={timer.sessions.length > 0 ? "Start another timer" : "Start a timer"}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border-visible bg-surface text-muted transition-mech hover:text-foreground"
      >
        {timer.sessions.length > 0 ? (
          <Plus size={18} strokeWidth={1.5} />
        ) : (
          <TimerIcon size={18} strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

export function BlinkingDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
    </span>
  );
}
