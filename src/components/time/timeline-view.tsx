"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Capture } from "@/hooks/use-captures";
import {
  formatDay,
  formatDuration,
  isToday,
  parseDay,
  periodRange,
  startOfWeek,
  type PeriodMode,
} from "@/lib/period";

const HOUR_HEIGHT = 34;
const START_HOUR = 6; // days effectively start here; earlier entries clamp to the top
const HOURS = Array.from({ length: 24 - START_HOUR }, (_, i) => START_HOUR + i);
const SNAP_MINUTES = 15;
const MIN_CREATE_MINUTES = 15;
const DRAG_MIME = "text/everything-capture-id";
const DRAG_OFFSET_MIME = "text/everything-grab-offset-min";

export type Reschedule = (entryId: string, newStart: Date, newEnd: Date) => void;
export type CreateEntry = (start: Date, end: Date) => void;

type PositionedBlock = { entry: Capture; top: number; height: number; col: number; cols: number };

function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('[draggable="true"]');
}

/**
 * Packs same-day entries into side-by-side columns wherever they overlap in
 * time, so two concurrent sessions are both visible instead of one hiding
 * the other. Standard calendar-app interval packing: cluster mutually
 * overlapping entries, then greedily assign each to the first column whose
 * last occupant has already ended.
 */
function layoutDay(entries: Capture[], day: Date): PositionedBlock[] {
  const key = formatDay(day);
  const dayEntries = entries
    .filter((e) => e.start_time && formatDay(new Date(e.start_time)) === key)
    .map((entry) => {
      const start = minutesOf(new Date(entry.start_time!));
      const duration = (entry.duration_seconds ?? 60) / 60;
      return { entry, start, end: start + duration };
    })
    .sort((a, b) => a.start - b.start);

  const clusters: (typeof dayEntries)[] = [];
  let current: typeof dayEntries = [];
  let clusterEnd = -Infinity;
  for (const e of dayEntries) {
    if (current.length && e.start >= clusterEnd) {
      clusters.push(current);
      current = [];
      clusterEnd = -Infinity;
    }
    current.push(e);
    clusterEnd = Math.max(clusterEnd, e.end);
  }
  if (current.length) clusters.push(current);

  const positioned: PositionedBlock[] = [];
  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const columnOf = new Map<string, number>();
    for (const e of cluster) {
      let col = columnEnds.findIndex((end) => end <= e.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(e.end);
      } else {
        columnEnds[col] = e.end;
      }
      columnOf.set(e.entry.id, col);
    }
    const cols = columnEnds.length;
    for (const e of cluster) {
      positioned.push({
        entry: e.entry,
        top: Math.max(0, ((e.start - START_HOUR * 60) / 60) * HOUR_HEIGHT),
        height: Math.max(5, ((e.end - e.start) / 60) * HOUR_HEIGHT),
        col: columnOf.get(e.entry.id)!,
        cols,
      });
    }
  }
  return positioned;
}

/** Drop position -> a start time snapped to a 15-minute grid, duration preserved. */
function resolveDrop(clientY: number, trackTop: number, day: Date, durationSeconds: number) {
  const offsetY = clientY - trackTop;
  const rawMinutes = START_HOUR * 60 + (offsetY / HOUR_HEIGHT) * 60;
  const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES;
  const clamped = Math.min(Math.max(snapped, 0), 24 * 60 - 1);
  const newStart = new Date(day);
  newStart.setHours(0, clamped, 0, 0);
  const newEnd = new Date(newStart.getTime() + durationSeconds * 1000);
  return { newStart, newEnd };
}

function minutesFromClientY(clientY: number, trackTop: number): number {
  const offsetY = clientY - trackTop;
  const raw = START_HOUR * 60 + (offsetY / HOUR_HEIGHT) * 60;
  const snapped = Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(Math.max(snapped, 0), 24 * 60);
}

export function TimelineView({
  entries,
  anchor,
  mode,
  onSelect,
  onReschedule,
  onCreate,
}: {
  entries: Capture[];
  anchor: string;
  mode: PeriodMode;
  onSelect: (entry: Capture) => void;
  onReschedule: Reschedule;
  onCreate: CreateEntry;
}) {
  const { start, end } = periodRange(anchor, mode);

  const inPeriod = useMemo(
    () =>
      entries.filter((e) => {
        if (!e.start_time) return false;
        const t = new Date(e.start_time).getTime();
        return t >= start.getTime() && t < end.getTime();
      }),
    [entries, start, end]
  );

  if (mode === "MONTH") {
    return <MonthGrid entries={inPeriod} anchor={anchor} onSelect={onSelect} onReschedule={onReschedule} onCreate={onCreate} />;
  }
  if (mode === "WEEK") {
    return <WeekGrid entries={inPeriod} anchor={anchor} onSelect={onSelect} onReschedule={onReschedule} onCreate={onCreate} />;
  }
  return <DayColumn entries={inPeriod} day={parseDay(anchor)} onSelect={onSelect} onReschedule={onReschedule} onCreate={onCreate} showAxis />;
}

function DayColumn({
  entries,
  day,
  onSelect,
  onReschedule,
  onCreate,
  showAxis,
}: {
  entries: Capture[];
  day: Date;
  onSelect: (entry: Capture) => void;
  onReschedule: Reschedule;
  onCreate: CreateEntry;
  showAxis?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [draft, setDraft] = useState<{ startMin: number; endMin: number } | null>(null);
  const draftRef = useRef(draft);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragOriginRef = useRef(0);
  const blocks = layoutDay(entries, day);
  const totalHeight = HOURS.length * HOUR_HEIGHT;

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // window-level listeners while a create-drag is in flight, so the gesture
  // keeps tracking even if the cursor leaves the track bounds
  useEffect(() => {
    if (!draft) return;
    function move(e: PointerEvent) {
      const trackTop = trackRef.current!.getBoundingClientRect().top;
      const minute = minutesFromClientY(e.clientY, trackTop);
      setDraft((d) => (d ? { startMin: Math.min(dragOriginRef.current, minute), endMin: Math.max(dragOriginRef.current, minute) } : d));
    }
    // onCreate is a side effect, so it must run here rather than inside the
    // setDraft updater above — React Strict Mode double-invokes state
    // updaters to check purity, which was firing onCreate twice per drag
    function up() {
      const d = draftRef.current;
      setDraft(null);
      if (d && d.endMin - d.startMin >= MIN_CREATE_MINUTES) {
        const newStart = new Date(day);
        newStart.setHours(0, d.startMin, 0, 0);
        const newEnd = new Date(day);
        newEnd.setHours(0, d.endMin, 0, 0);
        onCreate(newStart, newEnd);
      }
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- day/onCreate are stable enough for the lifetime of one drag
  }, [!!draft]);

  function startCreate(e: ReactPointerEvent<HTMLDivElement>) {
    if (isInteractiveTarget(e.target)) return; // let the existing block's own drag/click win
    const trackTop = e.currentTarget.getBoundingClientRect().top;
    const minute = minutesFromClientY(e.clientY, trackTop);
    dragOriginRef.current = minute;
    setDraft({ startMin: minute, endMin: minute + MIN_CREATE_MINUTES });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData(DRAG_MIME);
    const dragged = entries.find((en) => en.id === id);
    if (!dragged) return;
    // drop position is where the cursor is, not where the block's top edge
    // is — subtract back the offset grabbed at drag-start so the block
    // doesn't jump to align its grabbed point with the cursor
    const grabOffsetMinutes = Number(e.dataTransfer.getData(DRAG_OFFSET_MIME) || 0);
    const track = e.currentTarget.getBoundingClientRect();
    const adjustedClientY = e.clientY - (grabOffsetMinutes / 60) * HOUR_HEIGHT;
    const { newStart, newEnd } = resolveDrop(adjustedClientY, track.top, day, dragged.duration_seconds ?? 60);
    onReschedule(dragged.id, newStart, newEnd);
  }

  return (
    <div className="flex gap-3" style={{ height: totalHeight }}>
      {showAxis && (
        <div className="flex w-12 shrink-0 flex-col">
          {HOURS.map((h) => (
            <div key={h} className="label !text-faint" style={{ height: HOUR_HEIGHT }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
      )}

      <div
        ref={trackRef}
        onPointerDown={startCreate}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex-1 border-l transition-mech ${dragOver ? "border-hero bg-surface" : "border-border"}`}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 w-full border-t border-border"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
          />
        ))}

        {draft && (
          <div
            className="pointer-events-none absolute left-1 right-1 rounded-md border border-hero bg-accent-subtle"
            style={{
              top: Math.max(0, ((draft.startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT),
              height: ((draft.endMin - draft.startMin) / 60) * HOUR_HEIGHT,
            }}
          >
            <span className="label px-2 py-1 !text-hero">
              {formatDuration((draft.endMin - draft.startMin) * 60)}
            </span>
          </div>
        )}

        {blocks.map(({ entry, top, height, col, cols }) => (
          <button
            key={entry.id}
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_MIME, entry.id);
              const blockTop = e.currentTarget.getBoundingClientRect().top;
              const grabOffsetMinutes = ((e.clientY - blockTop) / HOUR_HEIGHT) * 60;
              e.dataTransfer.setData(DRAG_OFFSET_MIME, String(grabOffsetMinutes));
              e.dataTransfer.effectAllowed = "move";
            }}
            onClick={() => onSelect(entry)}
            title={`${entry.parsed_title ?? entry.raw_text} · ${formatDuration(entry.duration_seconds ?? 0)}`}
            className="absolute flex cursor-grab items-center overflow-hidden rounded-md bg-hero px-2 text-left transition-mech hover:opacity-80 active:cursor-grabbing"
            style={{
              top,
              height,
              left: `calc(${(col / cols) * 100}% + 2px)`,
              width: `calc(${100 / cols}% - 4px)`,
            }}
          >
            <span className="truncate font-mono text-caption text-black">
              {entry.parsed_title ?? entry.raw_text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WeekGrid({
  entries,
  anchor,
  onSelect,
  onReschedule,
  onCreate,
}: {
  entries: Capture[];
  anchor: string;
  onSelect: (entry: Capture) => void;
  onReschedule: Reschedule;
  onCreate: CreateEntry;
}) {
  const weekStart = startOfWeek(parseDay(anchor));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="flex gap-3">
      <div className="flex w-12 shrink-0 flex-col pt-7">
        {HOURS.map((h) => (
          <div key={h} className="label !text-faint" style={{ height: HOUR_HEIGHT }}>
            {String(h).padStart(2, "0")}
          </div>
        ))}
      </div>

      {days.map((day) => {
        const dayTotal = entries
          .filter((e) => e.start_time && formatDay(new Date(e.start_time)) === formatDay(day))
          .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);

        return (
          <div key={day.toISOString()} className="flex min-w-0 flex-1 flex-col">
            <div className="mb-1 flex items-baseline justify-between gap-1">
              <span className={`label ${isToday(day) ? "!text-hero" : ""}`}>
                {day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}{" "}
                {day.getDate()}
              </span>
              {dayTotal > 0 && <span className="label !text-faint">{formatDuration(dayTotal)}</span>}
            </div>
            <DayColumn entries={entries} day={day} onSelect={onSelect} onReschedule={onReschedule} onCreate={onCreate} />
          </div>
        );
      })}
    </div>
  );
}

const DEFAULT_CREATE_HOUR = 9; // month view has no time axis, so a drag needs a sensible default

function MonthGrid({
  entries,
  anchor,
  onSelect,
  onReschedule,
  onCreate,
}: {
  entries: Capture[];
  anchor: string;
  onSelect: (entry: Capture) => void;
  onReschedule: Reschedule;
  onCreate: CreateEntry;
}) {
  const { start, end } = periodRange(anchor, "MONTH");
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectRange, setSelectRange] = useState<{ from: string; to: string } | null>(null);
  const selectRangeRef = useRef(selectRange);
  useEffect(() => {
    selectRangeRef.current = selectRange;
  }, [selectRange]);

  const totals = new Map<string, { seconds: number; items: Capture[] }>();
  for (const e of entries) {
    if (!e.start_time) continue;
    const key = formatDay(new Date(e.start_time));
    const bucket = totals.get(key) ?? { seconds: 0, items: [] };
    bucket.seconds += e.duration_seconds ?? 0;
    bucket.items.push(e);
    totals.set(key, bucket);
  }

  // pad so the 1st lands on the right weekday (Monday-first)
  const leadingBlanks = (start.getDay() + 6) % 7;
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000);
  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: dayCount }, (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1)),
  ];

  useEffect(() => {
    if (!selectRange) return;
    function up() {
      const range = selectRangeRef.current;
      setSelectRange(null);
      if (!range) return;
      const [fromKey, toKey] = [range.from, range.to].sort();
      const startDay = parseDay(fromKey);
      const endDay = parseDay(toKey);
      const newStart = new Date(startDay);
      newStart.setHours(DEFAULT_CREATE_HOUR, 0, 0, 0);
      const newEnd = new Date(endDay);
      newEnd.setHours(fromKey === toKey ? DEFAULT_CREATE_HOUR + 1 : DEFAULT_CREATE_HOUR, 0, 0, 0);
      onCreate(newStart, newEnd);
    }
    window.addEventListener("pointerup", up, { once: true });
    return () => window.removeEventListener("pointerup", up);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCreate is stable enough for the lifetime of one drag
  }, [!!selectRange]);

  function handleDrop(e: DragEvent<HTMLDivElement>, day: Date) {
    e.preventDefault();
    setDragOverDay(null);
    const id = e.dataTransfer.getData(DRAG_MIME);
    const dragged = entries.find((en) => en.id === id);
    if (!dragged || !dragged.start_time) return;

    // month drag only moves the day — the time-of-day and duration carry over unchanged
    const oldStart = new Date(dragged.start_time);
    const newStart = new Date(day);
    newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), oldStart.getSeconds(), 0);
    const newEnd = new Date(newStart.getTime() + (dragged.duration_seconds ?? 60) * 1000);
    onReschedule(dragged.id, newStart, newEnd);
  }

  return (
    <div className="relative flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-2">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
          <span key={d} className="label !text-faint">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;
          const key = formatDay(day);
          const bucket = totals.get(key);
          const isDragOver = dragOverDay === key;
          const isSelected =
            !!selectRange &&
            key >= [selectRange.from, selectRange.to].sort()[0] &&
            key <= [selectRange.from, selectRange.to].sort()[1];
          const visible = bucket?.items.slice(0, 3) ?? [];
          const overflow = bucket ? bucket.items.length - visible.length : 0;

          return (
            <div
              key={key}
              onPointerDown={(e) => {
                if (isInteractiveTarget(e.target)) return;
                setSelectRange({ from: key, to: key });
              }}
              onPointerEnter={() => {
                if (selectRangeRef.current) setSelectRange((r) => (r ? { ...r, to: key } : r));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDay(key);
              }}
              onDragLeave={() => setDragOverDay((cur) => (cur === key ? null : cur))}
              onDrop={(e) => handleDrop(e, day)}
              className={`flex min-h-28 flex-col gap-1.5 rounded-lg border p-2 transition-mech ${
                isToday(day) ? "border-accent" : isDragOver || isSelected ? "border-hero" : "border-border"
              } ${bucket || isDragOver || isSelected ? "bg-surface" : ""}`}
            >
              <span className={`label ${bucket ? "!text-hero" : "!text-faint"}`}>{day.getDate()}</span>

              {visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_MIME, item.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onSelect(item)}
                  title={item.parsed_title ?? item.raw_text}
                  className="flex cursor-grab items-center justify-between gap-1 truncate rounded bg-hero px-1.5 py-0.5 text-left font-mono text-[10px] leading-tight text-black transition-mech hover:opacity-80 active:cursor-grabbing"
                >
                  <span className="truncate">{item.parsed_title ?? item.raw_text}</span>
                  <span className="shrink-0 opacity-70">{formatDuration(item.duration_seconds ?? 0)}</span>
                </button>
              ))}
              {overflow > 0 && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setExpandedDay(key)}
                  className="label text-left !text-faint transition-mech hover:!text-foreground"
                >
                  +{overflow} MORE
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Dialog.Root open={!!expandedDay} onOpenChange={(open) => !open && setExpandedDay(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.8)" }} />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-visible bg-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="label">{expandedDay ?? ""}</Dialog.Title>
              <Dialog.Close aria-label="Close" className="text-faint transition-mech hover:text-foreground">
                <X size={18} strokeWidth={1.5} />
              </Dialog.Close>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              {(expandedDay ? (totals.get(expandedDay)?.items ?? []) : []).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setExpandedDay(null);
                  }}
                  className="flex items-center justify-between gap-2 truncate rounded-lg bg-hero px-3 py-2 text-left font-mono text-caption text-black transition-mech hover:opacity-80"
                >
                  <span className="truncate">{item.parsed_title ?? item.raw_text}</span>
                  <span className="shrink-0 opacity-70">{formatDuration(item.duration_seconds ?? 0)}</span>
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
