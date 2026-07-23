"use client";

import { useRef, useState } from "react";
import type { Enums } from "@/lib/supabase/types";

type Priority = Enums<"task_priority">;

// left-to-right = calm-to-urgent, like a signal-strength meter — the bars
// step up in height so severity is legible even with color turned off
const LEVELS: { value: Priority; label: string; height: number; color: string }[] = [
  { value: "low", label: "LOW", height: 10, color: "var(--text-secondary)" },
  { value: "medium", label: "MEDIUM", height: 16, color: "var(--text-display)" },
  { value: "high", label: "HIGH", height: 22, color: "var(--warning)" },
  { value: "urgent", label: "URGENT", height: 28, color: "var(--accent)" },
];

export function PrioritySlider({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const currentIndex = LEVELS.findIndex((l) => l.value === value);
  const current = LEVELS[currentIndex];

  function indexFromClientX(clientX: number): number {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.min(LEVELS.length - 1, Math.floor(ratio * LEVELS.length));
  }

  function commitFromClientX(clientX: number) {
    const next = LEVELS[indexFromClientX(clientX)];
    if (next.value !== value) onChange(next.value);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    commitFromClientX(e.clientX);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    commitFromClientX(e.clientX);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" && currentIndex < LEVELS.length - 1) {
      e.preventDefault();
      onChange(LEVELS[currentIndex + 1].value);
    }
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      e.preventDefault();
      onChange(LEVELS[currentIndex - 1].value);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Priority"
        aria-valuemin={0}
        aria-valuemax={LEVELS.length - 1}
        aria-valuenow={currentIndex}
        aria-valuetext={current.label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onKeyDown={onKeyDown}
        className="flex h-8 cursor-pointer items-end gap-1.5 rounded-lg px-1 outline-none focus-visible:ring-1 focus-visible:ring-border-visible"
      >
        {LEVELS.map((level, i) => {
          const filled = i <= currentIndex;
          const isActive = i === currentIndex;
          return (
            <span
              key={level.value}
              className={`block flex-1 rounded-[2px] transition-mech ${
                dragging ? "duration-[80ms]" : ""
              } ${isActive ? "opacity-100" : filled ? "opacity-80" : "opacity-100"}`}
              style={{
                height: level.height,
                background: filled ? level.color : "var(--border)",
                outline: isActive ? `1px solid ${level.color}` : "none",
                outlineOffset: 2,
              }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 px-1">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full transition-mech"
          style={{ background: current.color }}
        />
        <span className="label transition-mech" style={{ color: current.color }}>
          {current.label} PRIORITY
        </span>
      </div>
    </div>
  );
}
