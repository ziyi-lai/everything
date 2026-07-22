"use client";

import type { MouseEvent } from "react";
import type { Enums } from "@/lib/supabase/types";

export function StatusIcon({
  status,
  onClick,
}: {
  status: Enums<"task_status">;
  onClick?: () => void;
}) {
  // stopPropagation so toggling status inside a clickable row doesn't also
  // trigger the row's own click (which opens the task detail modal)
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onClick?.();
  }

  if (status === "done") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-hero transition-mech"
        aria-label="Completed — click to reopen"
      >
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
          <path d="M2 6l2.5 2.5L10 3" stroke="var(--black)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  if (status === "in_progress") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="relative flex h-4 w-4 shrink-0 items-center justify-center"
        aria-label="In progress — click to mark done"
      >
        <span className="absolute h-4 w-4 animate-ping rounded-full bg-hero opacity-40" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-hero" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="h-4 w-4 shrink-0 rounded-full border border-border-visible transition-mech hover:border-foreground"
      aria-label="Not started — click to start"
    />
  );
}
