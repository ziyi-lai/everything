"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CornerDownLeft, Zap } from "lucide-react";
import { parseCapture } from "@/lib/nlp-parser";

function chipDate(due: Date): string {
  const date = due
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0;
  if (!hasTime) return date;
  const time = due
    .toLocaleTimeString("en-US", { hour: "numeric", minute: due.getMinutes() ? "2-digit" : undefined })
    .toUpperCase();
  return `${date} · ${time}`;
}

/**
 * The hero of the capture page — a dedicated surface, not a bare input.
 * Parses as you type: dates, #tags and @projects light up as chips before
 * anything is saved (same NLP as the task composer).
 */
export function CaptureBar({ onCapture }: { onCapture: (rawText: string) => Promise<void> | void }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parsed = useMemo(() => (value.trim() ? parseCapture(value) : null), [value]);

  async function save() {
    const text = value.trim();
    if (!text || saving) return;
    setSaving(true);
    setValue("");
    try {
      await onCapture(text);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1600);
    } finally {
      setSaving(false);
      textareaRef.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") setValue("");
  }

  return (
    <div className="dot-grid-subtle rounded-2xl border border-border bg-surface p-8 transition-mech focus-within:border-border-visible">
      <div className="flex items-baseline justify-between gap-4">
        <span className="label flex items-center gap-2">
          <Zap size={12} strokeWidth={1.5} />
          QUICK CAPTURE
        </span>
        <span className="label hidden !text-faint sm:block">#TAG · @PROJECT · DATES PARSED LIVE</span>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Type a thought, then press Enter…"
        rows={2}
        autoFocus
        className="mt-5 w-full resize-none bg-transparent font-sans text-display-md text-hero outline-none transition-mech placeholder:text-faint"
        style={{ letterSpacing: "-0.01em" }}
      />

      <div className="mt-4 flex min-h-7 items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {parsed?.due && (
            <span className="label rounded-full border border-hero px-2.5 py-1 !text-hero">
              📅 {chipDate(parsed.due)}
            </span>
          )}
          {parsed?.project && (
            <span className="label rounded-full border border-border-visible px-2.5 py-1 !text-interactive">
              @{parsed.project}
            </span>
          )}
          {parsed?.tags.map((t) => (
            <span key={t} className="label rounded-full border border-border-visible px-2.5 py-1 !text-interactive">
              #{t}
            </span>
          ))}
        </div>

        <span className="label flex shrink-0 items-center gap-3 !text-faint">
          {saving && "[SAVING...]"}
          {justSaved && !saving && <span className="!text-success">[SAVED TO INBOX]</span>}
          {!saving && !justSaved && (
            <>
              <CornerDownLeft size={11} strokeWidth={1.5} />
              SAVE
              <span className="text-border-visible">|</span>
              SHIFT+↵ NEWLINE
            </>
          )}
        </span>
      </div>
    </div>
  );
}
