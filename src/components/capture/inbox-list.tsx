"use client";

import { useState } from "react";
import { CheckSquare, Archive, Trash2, Link2 } from "lucide-react";
import type { Capture } from "@/hooks/use-captures";
import type { Task } from "@/hooks/use-tasks";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskLinkPicker } from "@/components/shared/task-link-picker";

export function InboxList({
  captures,
  tasks,
  showProcessed,
  onShowProcessedChange,
  onConvert,
  onLink,
  onArchive,
  onDelete,
}: {
  captures: Capture[];
  tasks: Task[];
  showProcessed: boolean;
  onShowProcessedChange: (value: boolean) => void;
  onConvert: (capture: Capture) => void;
  onLink: (capture: Capture, task: Task) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const pending = captures.filter((c) => !c.processed).length;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <span className="label">
        INBOX
        {pending > 0 && <span className="ml-2 !text-hero">{pending} TO TRIAGE</span>}
      </span>
      <div className="flex items-center gap-1 rounded-full border border-border-visible p-1">
        {[
          { label: "TO TRIAGE", value: false },
          { label: "ALL", value: true },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onShowProcessedChange(o.value)}
            className={`label rounded-full px-4 py-1.5 transition-mech ${
              showProcessed === o.value ? "bg-hero !text-black" : "!text-muted hover:!text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (captures.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <EmptyState
          headline={showProcessed ? "No notes captured yet" : "Inbox zero"}
          description={
            showProcessed
              ? "Type in the box above and press Enter to capture your first note."
              : "Everything captured has been triaged. Switch to ALL to see processed notes."
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {header}

      <div className="flex flex-col">
        {captures.map((c) => (
          <div
            key={c.id}
            className="group -mx-3 rounded-lg border-b border-border px-3 py-4 transition-mech hover:bg-surface"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-body ${
                    c.processed ? "text-muted" : "text-foreground"
                  }`}
                >
                  {c.parsed_title || c.raw_text}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <span className="label !text-faint">
                    {new Date(c.created_at ?? "").toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {c.parsed_due && (
                    <span className="label !text-warning">
                      📅{" "}
                      {new Date(c.parsed_due).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  {c.parsed_tags?.map((t) => (
                    <span key={t} className="label !text-interactive">
                      #{t}
                    </span>
                  ))}
                  {c.processed && <span className="label !text-success">[TRIAGED]</span>}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-mech group-hover:opacity-100">
                {!c.processed && (
                  <IconButton label="Convert to task" onClick={() => onConvert(c)}>
                    <CheckSquare size={16} strokeWidth={1.5} />
                  </IconButton>
                )}
                <IconButton
                  label="Link to existing task"
                  onClick={() => setLinkingId((cur) => (cur === c.id ? null : c.id))}
                >
                  <Link2 size={16} strokeWidth={1.5} />
                </IconButton>
                {!c.processed && (
                  <IconButton label="Archive" onClick={() => onArchive(c.id)}>
                    <Archive size={16} strokeWidth={1.5} />
                  </IconButton>
                )}
                <IconButton label="Delete" onClick={() => onDelete(c.id)} destructive>
                  <Trash2 size={16} strokeWidth={1.5} />
                </IconButton>
              </div>
            </div>

            {linkingId === c.id && (
              <div className="mt-3">
                <TaskLinkPicker
                  tasks={tasks}
                  onCancel={() => setLinkingId(null)}
                  onSelect={(task) => {
                    onLink(c, task);
                    setLinkingId(null);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-mech hover:bg-surface-raised ${
        destructive ? "hover:!text-accent" : "hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
