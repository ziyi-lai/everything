"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CornerDownLeft } from "lucide-react";
import { parseCapture } from "@/lib/nlp-parser";
import { VoiceRecordButton } from "@/components/capture/voice-record-button";

function chipDate(due: Date): string {
  const date = due.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0;
  if (!hasTime) return date;
  const time = due
    .toLocaleTimeString("en-US", { hour: "numeric", minute: due.getMinutes() ? "2-digit" : undefined })
    .toUpperCase();
  return `${date} · ${time}`;
}

/**
 * A single-line pill by default — grows only as far as the content needs,
 * instead of permanently reserving a hero block's worth of vertical space.
 */
export function QuickAdd({
  onCapture,
  onVoiceCapture,
}: {
  onCapture: (rawText: string) => Promise<void> | void;
  onVoiceCapture: (audioPath: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parsed = useMemo(() => (value.trim() ? parseCapture(value) : null), [value]);
  const expanded = focused || value.length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  async function save() {
    const text = value.trim();
    if (!text || saving) return;
    setSaving(true);
    setValue("");
    try {
      await onCapture(text);
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
    if (e.key === "Escape") {
      setValue("");
      textareaRef.current?.blur();
    }
  }

  return (
    <div
      className={`rounded-2xl border transition-mech ${
        expanded ? "border-border-visible bg-surface px-5 py-4" : "border-border bg-surface px-5 py-3"
      }`}
    >
      <div className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Capture a thought…"
          rows={1}
          className="w-full flex-1 resize-none overflow-hidden bg-transparent text-body text-foreground outline-none transition-mech placeholder:text-faint"
        />
        <VoiceRecordButton onRecorded={onVoiceCapture} />
      </div>

      {expanded && (parsed?.due || parsed?.project || (parsed?.tags.length ?? 0) > 0 || true) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
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
          <span className="label flex shrink-0 items-center gap-1.5 !text-faint">
            <CornerDownLeft size={11} strokeWidth={1.5} />
            {saving ? "SAVING…" : "SAVE"}
          </span>
        </div>
      )}
    </div>
  );
}
