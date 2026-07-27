"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2, Link2 } from "lucide-react";
import type { Capture } from "@/hooks/use-captures";
import { useTasks } from "@/hooks/use-tasks";
import { MOOD_EMOJI, type MoodEntry } from "@/hooks/use-mood";
import { TaskLinkPicker } from "@/components/shared/task-link-picker";
import { formatDuration } from "@/lib/period";

/** <input type="datetime-local"> wants local wall-clock, not a UTC ISO string. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EntryDetail({
  entry,
  mood,
  onOpenChange,
  onSave,
  onDelete,
}: {
  entry: Capture | null;
  mood?: MoodEntry | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(entry?.parsed_title ?? entry?.raw_text ?? "");
  const [start, setStart] = useState(toLocalInput(entry?.start_time ?? null));
  const [end, setEnd] = useState(toLocalInput(entry?.end_time ?? null));
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(entry?.converted_to_task_id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { tasks } = useTasks();

  if (!entry) return null;

  const linkedTask = tasks.find((t) => t.id === linkedTaskId) ?? null;

  async function save() {
    if (!entry) return;
    setStatus("saving");
    setErrorMessage("");

    const startIso = start ? new Date(start).toISOString() : null;
    const endIso = end ? new Date(end).toISOString() : null;
    if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
      setStatus("error");
      setErrorMessage("End must be after start.");
      return;
    }

    const result = await onSave(entry.id, {
      raw_text: title.trim() || entry.raw_text,
      parsed_title: title.trim() || null,
      start_time: startIso,
      end_time: endIso,
      converted_to_task_id: linkedTaskId,
    });

    if (result === null) {
      setStatus("error");
      setErrorMessage("Could not save.");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <Dialog.Root open={!!entry} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.8)" }} />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-visible bg-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="label">TIME ENTRY</Dialog.Title>
            <Dialog.Close aria-label="Close" className="text-faint transition-mech hover:text-foreground">
              <X size={18} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What were you working on?"
            className="mt-3 w-full bg-transparent text-heading text-hero outline-none placeholder:text-faint"
          />

          <p className="mt-2 font-mono text-body-sm text-muted">
            {formatDuration(entry.duration_seconds ?? 0)}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <Field label="START">
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="label rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
              />
            </Field>
            <Field label="END">
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="label rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
              />
            </Field>
          </div>

          <div className="mt-4">
            {linkedTask ? (
              <div className="label flex items-center gap-1.5 !text-interactive">
                <Link2 size={11} strokeWidth={1.5} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{linkedTask.title}</span>
                <button
                  type="button"
                  aria-label="Unlink task"
                  onClick={() => setLinkedTaskId(null)}
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
                  setLinkedTaskId(task.id);
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
          </div>

          {mood && (
            <div className="mt-4 flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
              <span className="text-body">{MOOD_EMOJI[mood.score]}</span>
              <span className="label !text-faint">
                MOOD LOGGED {new Date(mood.recorded_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              {mood.note && <span className="min-w-0 flex-1 truncate text-body-sm text-muted">{mood.note}</span>}
            </div>
          )}

          {status === "error" && <p className="label mt-4 !text-accent">[ERROR] {errorMessage}</p>}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                onDelete(entry.id);
                onOpenChange(false);
              }}
              className="label flex items-center gap-1.5 text-faint transition-mech hover:!text-accent"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              DELETE
            </button>

            <div className="flex items-center gap-3">
              {status === "saved" && <span className="label !text-success">[SAVED]</span>}
              <button
                type="button"
                onClick={save}
                disabled={status === "saving"}
                className="label h-9 rounded-full bg-hero px-5 text-black transition-mech hover:opacity-90 disabled:opacity-40"
              >
                {status === "saving" ? "[SAVING...]" : "SAVE"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}
