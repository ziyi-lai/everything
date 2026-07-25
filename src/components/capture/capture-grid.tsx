"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { CheckSquare, Archive, Trash2, Link2, Sparkles, Pencil } from "lucide-react";
import type { Capture } from "@/hooks/use-captures";
import type { Task } from "@/hooks/use-tasks";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskLinkPicker } from "@/components/shared/task-link-picker";
import { Markdown } from "@/components/shared/markdown";
import { createClient } from "@/lib/supabase/client";

/** A wall of sticky notes — masonry via CSS columns, no library needed. */
export function CaptureGrid({
  captures,
  tasks,
  resurfaceCapture,
  justCapturedId,
  onConvert,
  onLink,
  onArchive,
  onDelete,
  onEdit,
}: {
  captures: Capture[];
  tasks: Task[];
  resurfaceCapture: Capture | null;
  justCapturedId: string | null;
  onConvert: (capture: Capture) => void;
  onLink: (capture: Capture, task: Task) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (capture: Capture, text: string) => void;
}) {
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");

  function startEditing(c: Capture) {
    setEditingId(c.id);
    setDraftText(c.parsed_title || c.raw_text);
  }

  function commitEdit(c: Capture) {
    setEditingId(null);
    const trimmed = draftText.trim();
    if (trimmed && trimmed !== (c.parsed_title || c.raw_text)) onEdit(c, trimmed);
  }

  function onEditKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, c: Capture) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setEditingId(null);
      setDraftText(c.parsed_title || c.raw_text);
    }
  }

  // the resurfaced note might be outside the current triage filter (usually
  // already processed) — pin it into the wall anyway rather than duplicate
  // the "review an old thought" feature as a separate block
  const alreadyShown = resurfaceCapture && captures.some((c) => c.id === resurfaceCapture.id);
  const items = resurfaceCapture && !alreadyShown ? [resurfaceCapture, ...captures] : captures;

  if (items.length === 0) {
    return (
      <EmptyState
        headline="Inbox zero"
        description="Type a thought above and press Enter — it lands here as a card."
      />
    );
  }

  return (
    <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
      {items.map((c) => {
        const isResurfaced = c.id === resurfaceCapture?.id;
        return (
          <div
            key={c.id}
            className={`group mb-3 flex break-inside-avoid flex-col gap-3 rounded-2xl border px-4 py-4 transition-mech ${
              isResurfaced ? "border-hero" : c.processed ? "border-border" : "border-border-visible"
            } ${c.id === justCapturedId ? "capture-pop" : ""}`}
          >
            {isResurfaced && (
              <span className="label flex items-center gap-1.5 !text-hero">
                <Sparkles size={11} strokeWidth={1.5} />
                FROM THE ARCHIVE
              </span>
            )}

            {editingId === c.id ? (
              <textarea
                autoFocus
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={() => commitEdit(c)}
                onKeyDown={(e) => onEditKeyDown(e, c)}
                rows={3}
                className="w-full resize-y bg-transparent text-body text-foreground outline-none"
              />
            ) : (
              <Markdown text={c.parsed_title || c.raw_text} className={c.processed ? "!text-muted" : ""} />
            )}

            {c.audio_path && <VoiceCapturePlayer path={c.audio_path} />}

            <div className="flex flex-wrap items-center gap-2">
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
                  📅 {new Date(c.parsed_due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
              {c.parsed_tags?.map((t) => (
                <span key={t} className="label !text-interactive">
                  #{t}
                </span>
              ))}
              {c.processed && <span className="label !text-success">[TRIAGED]</span>}
            </div>

            <div className="flex items-center gap-1 border-t border-border pt-2 opacity-0 transition-mech group-hover:opacity-100">
              <IconButton label="Edit" onClick={() => startEditing(c)}>
                <Pencil size={15} strokeWidth={1.5} />
              </IconButton>
              {!c.processed && (
                <IconButton label="Convert to task" onClick={() => onConvert(c)}>
                  <CheckSquare size={15} strokeWidth={1.5} />
                </IconButton>
              )}
              <IconButton
                label="Link to existing task"
                onClick={() => setLinkingId((cur) => (cur === c.id ? null : c.id))}
              >
                <Link2 size={15} strokeWidth={1.5} />
              </IconButton>
              {!c.processed && (
                <IconButton label="Archive" onClick={() => onArchive(c.id)}>
                  <Archive size={15} strokeWidth={1.5} />
                </IconButton>
              )}
              <IconButton label="Delete" onClick={() => onDelete(c.id)} destructive>
                <Trash2 size={15} strokeWidth={1.5} />
              </IconButton>
            </div>

            {linkingId === c.id && (
              <TaskLinkPicker
                tasks={tasks}
                onCancel={() => setLinkingId(null)}
                onSelect={(task) => {
                  onLink(c, task);
                  setLinkingId(null);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function VoiceCapturePlayer({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // deferred via setTimeout rather than called synchronously in the effect body
    const id = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.storage.from("voice-captures").createSignedUrl(path, 3600);
      setUrl(data?.signedUrl ?? null);
    }, 0);
    return () => clearTimeout(id);
  }, [path]);

  if (!url) return null;
  return <audio controls src={url} className="h-8 w-full" />;
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
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-mech hover:bg-surface-raised ${
        destructive ? "hover:!text-accent" : "hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
