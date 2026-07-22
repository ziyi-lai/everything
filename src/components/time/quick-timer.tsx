"use client";

import { useState } from "react";
import { Play, Square, Timer as TimerIcon, X, Bell, Link2 } from "lucide-react";
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
 * Always-on time-tracking control that lives in the sidebar, so a session can
 * be started from any page without navigating to /time first.
 */
export function QuickTimer() {
  const timer = useTimer();
  const { tasks } = useTasks();
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTask, setDraftTask] = useState<Task | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function startFromPanel() {
    timer.start({ description: draft || draftTask?.title || "", linkedTaskId: draftTask?.id ?? null });
    setDraft("");
    setDraftTask(null);
    setPickerOpen(false);
    setPanelOpen(false);
  }

  if (timer.running) {
    return (
      <div className="mb-4 flex flex-col gap-2 rounded-lg border border-accent px-3 py-3">
        <div className="flex items-center gap-2">
          <BlinkingDot />
          <span className="font-mono text-body tabular-nums text-hero">
            {formatElapsed(timer.elapsed)}
          </span>
        </div>

        <p className="label truncate !text-muted">{timer.description || "UNTITLED SESSION"}</p>

        {timer.reminderMinutes && (
          <p className="label !text-faint">
            <Bell size={10} strokeWidth={1.5} className="mr-1 inline" />
            EVERY {timer.reminderMinutes}M
          </p>
        )}

        <button
          type="button"
          onClick={() => void timer.stop()}
          className="label mt-1 flex h-9 items-center justify-center gap-2 rounded-full bg-accent text-hero transition-mech hover:opacity-90"
        >
          <Square size={10} strokeWidth={0} fill="currentColor" />
          STOP
        </button>
      </div>
    );
  }

  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="label mb-4 flex items-center justify-between rounded-lg border border-border-visible px-3 py-2 text-muted transition-mech hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <TimerIcon size={14} strokeWidth={1.5} />
          QUICK TIMER
        </span>
        <Play size={11} strokeWidth={0} fill="currentColor" />
      </button>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border-visible px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="label">NEW SESSION</span>
        <button
          type="button"
          aria-label="Close quick timer"
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
              onClick={() => timer.setReminderMinutes(o.value)}
              className={`label rounded-full border px-2 py-1 transition-mech ${
                timer.reminderMinutes === o.value
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
