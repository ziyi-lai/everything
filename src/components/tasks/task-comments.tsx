"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import type { Tables } from "@/lib/supabase/types";

type Comment = Tables<"task_comments">;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** A running log of progress notes on a task — each one timestamped by the DB, not the client. */
export function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function refetch() {
    const res = await fetch(`/api/tasks/${taskId}/comments`);
    const data = await res.json();
    setComments(data.comments ?? []);
  }

  useEffect(() => {
    // deferred via setTimeout rather than called synchronously in the effect body
    const id = setTimeout(refetch, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- taskId only
  }, [taskId]);

  async function post() {
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    setDraft("");
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ body }) });
      const data = await res.json();
      if (data.comment) setComments((prev) => [data.comment as Comment, ...prev]);
    } finally {
      setPosting(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      post();
    }
  }

  function startEditing(c: Comment) {
    setEditingId(c.id);
    setEditDraft(c.body);
  }

  async function commitEdit(c: Comment) {
    setEditingId(null);
    const trimmed = editDraft.trim();
    if (!trimmed || trimmed === c.body) return;
    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, body: trimmed } : x)));
    const res = await fetch(`/api/tasks/${taskId}/comments/${c.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body: trimmed }),
    });
    const data = await res.json();
    if (data.comment) setComments((prev) => prev.map((x) => (x.id === c.id ? (data.comment as Comment) : x)));
  }

  function onEditKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, c: Comment) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      setEditingId(null);
      setEditDraft(c.body);
    }
  }

  async function remove(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/tasks/${taskId}/comments/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="label !text-muted">PROGRESS</span>

      <div className="flex items-start gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Leave an update…"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border-visible bg-transparent px-3 py-2 text-body-sm text-foreground outline-none placeholder:text-faint"
        />
        <button
          type="button"
          aria-label="Post update"
          disabled={!draft.trim() || posting}
          onClick={post}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hero text-black transition-mech hover:opacity-90 disabled:opacity-40"
        >
          <MessageSquarePlus size={15} strokeWidth={1.5} />
        </button>
      </div>

      {comments.length > 0 && (
        <div className="flex flex-col gap-2">
          {comments.map((c) => (
            <div key={c.id} className="group rounded-lg border border-border px-3 py-2">
              {editingId === c.id ? (
                <textarea
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => commitEdit(c)}
                  onKeyDown={(e) => onEditKeyDown(e, c)}
                  rows={2}
                  className="w-full resize-y bg-transparent text-body-sm text-foreground outline-none"
                />
              ) : (
                <button type="button" onClick={() => startEditing(c)} className="w-full text-left">
                  <Markdown text={c.body} className="!text-body-sm" />
                </button>
              )}

              <div className="mt-1 flex items-center justify-between">
                <span className="label !text-faint">{formatTimestamp(c.created_at)}</span>
                <div className="flex items-center gap-1 opacity-0 transition-mech group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Edit update"
                    onClick={() => startEditing(c)}
                    className="flex h-6 w-6 items-center justify-center rounded text-faint transition-mech hover:text-foreground"
                  >
                    <Pencil size={11} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete update"
                    onClick={() => remove(c.id)}
                    className="flex h-6 w-6 items-center justify-center rounded text-faint transition-mech hover:!text-accent"
                  >
                    <Trash2 size={11} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
