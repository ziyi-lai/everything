"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim().replace(/^#/, "");
    if (value && !tags.includes(value)) onChange([...tags, value]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-0 border-b border-border-visible py-2 transition-mech focus-within:border-foreground">
      {tags.map((t) => (
        <span
          key={t}
          className="label flex items-center gap-1 rounded-full border border-border-visible px-2.5 py-1 !text-interactive"
        >
          #{t}
          <button
            type="button"
            aria-label={`Remove tag ${t}`}
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="transition-mech hover:!text-accent"
          >
            <X size={11} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? "Add tags…" : ""}
        className="min-w-[80px] flex-1 bg-transparent font-mono text-body-sm text-foreground outline-none placeholder:text-faint"
      />
    </div>
  );
}
