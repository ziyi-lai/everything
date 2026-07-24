"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2 } from "lucide-react";
import { TagInput } from "@/components/tasks/tag-input";
import { PrioritySlider } from "@/components/tasks/priority-slider";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import type { Task } from "@/hooks/use-tasks";
import type { Enums } from "@/lib/supabase/types";

const STATUSES: Enums<"task_status">[] = ["backlog", "todo", "in_progress", "done", "cancelled"];
const DOMAINS: Enums<"task_domain">[] = ["coding", "research", "writing", "life", "health", "finance", "other"];

export function TaskDetail({
  task,
  onOpenChange,
  onSave,
  onDelete,
}: {
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  // lazy initializers, not an effect — the parent remounts this component
  // (via `key={task.id}`) whenever a different task opens, so this only
  // needs to seed state once per task rather than re-sync on every render
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [saved, setSaved] = useState(false);

  if (!task) return null;

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function save(patch: Record<string, unknown>) {
    onSave(task!.id, patch);
    flashSaved();
  }

  return (
    <Dialog.Root open={!!task} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 transition-mech" style={{ background: "rgba(0,0,0,0.8)" }} />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-visible bg-surface p-6 transition-mech">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title asChild>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() => title.trim() && title !== task.title && save({ title: title.trim() })}
                className="flex-1 bg-transparent text-heading text-hero outline-none"
              />
            </Dialog.Title>
            <Dialog.Close aria-label="Close" className="text-faint transition-mech hover:text-foreground">
              <X size={18} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (task.description ?? "") && save({ description: description || null })}
            placeholder="Add a description…"
            rows={2}
            className="mt-4 w-full resize-y bg-transparent text-body-sm text-muted outline-none placeholder:text-faint"
            style={{ minHeight: "3rem" }}
          />

          <div className="mt-6 flex flex-col gap-5">
            <Field label="STATUS">
              <select
                value={task.status ?? "todo"}
                onChange={(e) => save({ status: e.target.value })}
                className="label rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-surface text-foreground">
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </Field>

            <div>
              <span className="label mb-2 block !text-muted">PRIORITY</span>
              <PrioritySlider value={task.priority ?? "medium"} onChange={(p) => save({ priority: p })} />
            </div>

            <Field label="DOMAIN">
              <select
                value={task.domain ?? "other"}
                onChange={(e) => save({ domain: e.target.value })}
                className="label rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d} className="bg-surface text-foreground">
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="DUE DATE">
              <input
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => save({ due_date: e.target.value || null })}
                className="label rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
              />
            </Field>

            <Field label="TAGS">
              <TagInput tags={task.tags ?? []} onChange={(tags) => save({ tags })} />
            </Field>

            <TaskAttachments taskId={task.id} />
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <span className="label !text-faint">{saved ? "[SAVED]" : " "}</span>
            <button
              type="button"
              onClick={() => {
                onDelete(task.id);
                onOpenChange(false);
              }}
              className="label flex items-center gap-1.5 text-faint transition-mech hover:!text-accent"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              DELETE
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="label !text-muted">{label}</span>
      {children}
    </div>
  );
}
