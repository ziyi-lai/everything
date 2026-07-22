"use client";

import { useMemo } from "react";
import type { Capture } from "@/hooks/use-captures";
import { EmptyState } from "@/components/shared/empty-state";
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

type Positioned = { entry: Capture; top: number; height: number };

function layoutDay(entries: Capture[], day: Date): Positioned[] {
  const key = formatDay(day);
  return entries
    .filter((e) => e.start_time && formatDay(new Date(e.start_time)) === key)
    .map((entry) => {
      const start = new Date(entry.start_time!);
      const minutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
      const durationMinutes = (entry.duration_seconds ?? 60) / 60;
      return {
        entry,
        top: Math.max(0, (minutes / 60) * HOUR_HEIGHT),
        height: Math.max(5, (durationMinutes / 60) * HOUR_HEIGHT),
      };
    });
}

export function TimelineView({
  entries,
  anchor,
  mode,
  onSelect,
}: {
  entries: Capture[];
  anchor: string;
  mode: PeriodMode;
  onSelect: (entry: Capture) => void;
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

  if (inPeriod.length === 0) {
    return (
      <EmptyState
        headline="No time entries in this period"
        description="Start the quick timer in the sidebar to track a session."
      />
    );
  }

  if (mode === "MONTH") return <MonthGrid entries={inPeriod} anchor={anchor} onSelect={onSelect} />;
  if (mode === "WEEK") return <WeekGrid entries={inPeriod} anchor={anchor} onSelect={onSelect} />;
  return <DayColumn entries={inPeriod} day={parseDay(anchor)} onSelect={onSelect} showAxis />;
}

function DayColumn({
  entries,
  day,
  onSelect,
  showAxis,
}: {
  entries: Capture[];
  day: Date;
  onSelect: (entry: Capture) => void;
  showAxis?: boolean;
}) {
  const blocks = layoutDay(entries, day);
  const totalHeight = HOURS.length * HOUR_HEIGHT;

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

      <div className="relative flex-1 border-l border-border">
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 w-full border-t border-border"
            style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
          />
        ))}

        {blocks.map(({ entry, top, height }) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry)}
            title={`${entry.parsed_title ?? entry.raw_text} · ${formatDuration(entry.duration_seconds ?? 0)}`}
            className="absolute left-1 right-1 flex items-center overflow-hidden rounded-md bg-hero px-2 text-left transition-mech hover:opacity-80"
            style={{ top, height }}
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
}: {
  entries: Capture[];
  anchor: string;
  onSelect: (entry: Capture) => void;
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
            <DayColumn entries={entries} day={day} onSelect={onSelect} />
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({
  entries,
  anchor,
  onSelect,
}: {
  entries: Capture[];
  anchor: string;
  onSelect: (entry: Capture) => void;
}) {
  const { start, end } = periodRange(anchor, "MONTH");

  const totals = new Map<string, { seconds: number; items: Capture[] }>();
  for (const e of entries) {
    if (!e.start_time) continue;
    const key = formatDay(new Date(e.start_time));
    const bucket = totals.get(key) ?? { seconds: 0, items: [] };
    bucket.seconds += e.duration_seconds ?? 0;
    bucket.items.push(e);
    totals.set(key, bucket);
  }

  const maxSeconds = Math.max(1, ...[...totals.values()].map((v) => v.seconds));

  // pad so the 1st lands on the right weekday (Monday-first)
  const leadingBlanks = (start.getDay() + 6) % 7;
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000);
  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: dayCount }, (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1)),
  ];

  return (
    <div className="flex flex-col gap-3">
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
          // proportional bar rather than a heat fill — a filled cell would
          // collide with the text colour at high intensity in one mode or
          // the other, and a bar reads as an instrument gauge anyway
          const fillPercent = bucket ? Math.max(8, (bucket.seconds / maxSeconds) * 100) : 0;

          return (
            <button
              key={key}
              type="button"
              disabled={!bucket}
              onClick={() => bucket && onSelect(bucket.items[0])}
              className={`flex aspect-square flex-col justify-between rounded-lg border p-2 text-left transition-mech ${
                isToday(day) ? "border-accent" : "border-border"
              } ${bucket ? "bg-surface hover:border-border-visible" : "cursor-default"}`}
            >
              <span className={`label ${bucket ? "!text-hero" : "!text-faint"}`}>{day.getDate()}</span>
              {bucket && (
                <span className="flex flex-col gap-1">
                  <span className="label !text-muted">{formatDuration(bucket.seconds)}</span>
                  <span className="h-1 w-full bg-border">
                    <span className="block h-full bg-hero" style={{ width: `${fillPercent}%` }} />
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
