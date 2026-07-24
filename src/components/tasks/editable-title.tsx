"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";

/** Click a task's title to rename it inline, without opening the full detail modal. */
export function EditableTitle({
  title,
  done,
  onSave,
}: {
  title: string;
  done?: boolean;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  function commit() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) onSave(trimmed);
    else setValue(title);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setValue(title);
      setEditing(false);
    }
  }

  function startEditing(e: MouseEvent) {
    e.stopPropagation(); // don't also trigger the row's click-to-open-detail
    setValue(title);
    setEditing(true);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="flex-1 bg-transparent text-body text-foreground outline-none"
      />
    );
  }

  return (
    <span
      onClick={startEditing}
      className={`flex-1 text-body transition-mech ${done ? "text-faint line-through" : "text-foreground"}`}
    >
      {title}
    </span>
  );
}
