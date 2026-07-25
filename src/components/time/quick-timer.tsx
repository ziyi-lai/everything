"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Play, Pause, Square, Timer as TimerIcon, X, Bell, Link2, Plus, SlidersHorizontal } from "lucide-react";
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

const POSITION_KEY = "everything-timer-dock-position";
const OPACITY_KEY = "everything-timer-dock-opacity";
const DRAG_THRESHOLD_PX = 5;

type Position = { right: number; bottom: number };

/**
 * Floating time-tracking control. Collapsed to a single icon when idle; each
 * running/paused session gets its own pill, so several timers can run in
 * parallel without blocking each other. Draggable to reposition, with an
 * adjustable opacity so it can sit unobtrusively over whatever's underneath.
 */
export function TimerDock() {
  const timer = useTimer();
  const { tasks } = useTasks();
  const [panelOpen, setPanelOpen] = useState(false);
  const [opacityPanelOpen, setOpacityPanelOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTask, setDraftTask] = useState<Task | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftReminder, setDraftReminder] = useState<ReminderMinutes>(null);

  const [position, setPosition] = useState<Position>({ right: 24, bottom: 24 });
  const [opacity, setOpacity] = useState(1);
  const dragRef = useRef<{ startX: number; startY: number; origin: Position; moved: boolean } | null>(null);

  // deferred via setTimeout rather than called synchronously in the effect body
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const posRaw = localStorage.getItem(POSITION_KEY);
        if (posRaw) setPosition(JSON.parse(posRaw));
        const opRaw = localStorage.getItem(OPACITY_KEY);
        if (opRaw) setOpacity(Number(opRaw));
      } catch {
        // preferences just won't persist
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function persistPosition(next: Position) {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(next));
    } catch {
      // preference just won't persist
    }
  }

  function persistOpacity(next: number) {
    try {
      localStorage.setItem(OPACITY_KEY, String(next));
    } catch {
      // preference just won't persist
    }
  }

  function onDragPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: position, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onDragPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const state = dragRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    state.moved = true;
    // the dock is anchored via right/bottom, so moving the pointer right
    // shrinks the right offset and moving it down shrinks the bottom offset
    setPosition({
      right: Math.max(8, state.origin.right - dx),
      bottom: Math.max(8, state.origin.bottom - dy),
    });
  }

  function onDragPointerUp() {
    const state = dragRef.current;
    dragRef.current = null;
    if (state?.moved) {
      persistPosition(position);
      return; // a drag doesn't also toggle the panel
    }
    setPanelOpen((o) => !o);
  }

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
    <div
      className="fixed z-40 flex flex-col items-end gap-2 transition-mech"
      style={{ right: position.right, bottom: position.bottom, opacity }}
    >
      {timer.sessions.map((s) => (
        <div
          key={s.id}
          className={`flex items-center gap-2 rounded-full border bg-surface py-2 pl-3 pr-2 transition-mech ${
            s.status === "paused" ? "border-border-visible" : "border-accent"
          }`}
        >
          {s.status === "running" ? <BlinkingDot /> : <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-faint" />}
          <span className="font-mono text-body-sm tabular-nums text-hero">{formatElapsed(s.elapsed)}</span>
          <TimerTitle title={s.description || "UNTITLED"} scrolling={s.status === "running"} />
          {s.reminderMinutes && <Bell size={11} strokeWidth={1.5} className="shrink-0 text-faint" />}
          <button
            type="button"
            aria-label={s.status === "running" ? "Pause timer" : "Resume timer"}
            onClick={() => (s.status === "running" ? void timer.pause(s.id) : timer.resume(s.id))}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted transition-mech hover:bg-surface-raised hover:text-foreground"
          >
            {s.status === "running" ? (
              <Pause size={11} strokeWidth={1.5} />
            ) : (
              <Play size={10} strokeWidth={0} fill="currentColor" />
            )}
          </button>
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

      {opacityPanelOpen && (
        <div className="flex w-56 items-center gap-3 rounded-2xl border border-border-visible bg-surface p-4 transition-mech">
          <span className="label !text-faint">DIM</span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => {
              const value = Number(e.target.value);
              setOpacity(value);
              persistOpacity(value);
            }}
            className="flex-1"
          />
          <span className="label !text-faint">{Math.round(opacity * 100)}%</span>
        </div>
      )}

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

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Adjust dock transparency"
          onClick={() => setOpacityPanelOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border-visible bg-surface text-faint transition-mech hover:text-foreground"
        >
          <SlidersHorizontal size={13} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          aria-label={timer.sessions.length > 0 ? "Start another timer" : "Start a timer"}
          className="flex h-12 w-12 cursor-grab items-center justify-center rounded-full border border-border-visible bg-surface text-muted transition-mech hover:text-foreground active:cursor-grabbing"
        >
          {timer.sessions.length > 0 ? (
            <Plus size={18} strokeWidth={1.5} />
          ) : (
            <TimerIcon size={18} strokeWidth={1.5} />
          )}
        </button>
      </div>
    </div>
  );
}

const MARQUEE_THRESHOLD = 18; // roughly how many Space Mono label chars fit in 140px

/** Fixed-width title slot so every pill is the same length regardless of
 * title text — a long, running title scrolls instead of stretching the pill. */
function TimerTitle({ title, scrolling }: { title: string; scrolling: boolean }) {
  const needsScroll = scrolling && title.length > MARQUEE_THRESHOLD;

  return (
    <span className="block w-[140px] shrink-0 overflow-hidden">
      {needsScroll ? (
        <span className="timer-marquee flex w-max gap-10 whitespace-nowrap">
          <span className="label !text-muted">{title}</span>
          <span className="label !text-muted">{title}</span>
        </span>
      ) : (
        <span className="label block truncate !text-muted">{title}</span>
      )}
    </span>
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
