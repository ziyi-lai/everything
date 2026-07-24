"use client";

import { useMemo, useState } from "react";
import { StatusIcon } from "@/components/tasks/status-icon";
import { EditableTitle } from "@/components/tasks/editable-title";
import { EmptyState } from "@/components/shared/empty-state";
import type { Task } from "@/hooks/use-tasks";
import type { Enums } from "@/lib/supabase/types";

const DOMAINS: Enums<"task_domain">[] = ["coding", "research", "writing", "life", "health", "finance", "other"];
const PRIORITIES: Enums<"task_priority">[] = ["urgent", "high", "medium", "low"];

const PRIORITY_COLOR: Record<Enums<"task_priority">, string> = {
  urgent: "text-accent",
  high: "text-warning",
  medium: "text-muted",
  low: "text-faint",
};

const SORTS = ["priority", "due", "title", "created"] as const;
type SortBy = (typeof SORTS)[number];
const SORT_LABEL: Record<SortBy, string> = { priority: "PRIORITY", due: "DUE DATE", title: "TITLE", created: "CREATED" };
const PRIORITY_ORDER: Record<Enums<"task_priority">, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function ListView({ tasks, onToggleStatus, onOpenDetail, onRename }: {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
  onRename: (task: Task, title: string) => void;
}) {
  const [domain, setDomain] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("priority");

  const allTags = useMemo(
    () => [...new Set(tasks.flatMap((t) => t.tags ?? []))].sort(),
    [tasks]
  );

  const filtered = useMemo(() => {
    return tasks
      .filter((t) => domain === "all" || t.domain === domain)
      .filter((t) => priority === "all" || t.priority === priority)
      .filter((t) => !tag || t.tags?.includes(tag))
      .sort((a, b) => {
        if ((a.status === "done") !== (b.status === "done")) return a.status === "done" ? 1 : -1;
        if (sortBy === "priority") {
          return (PRIORITY_ORDER[a.priority ?? "medium"] ?? 2) - (PRIORITY_ORDER[b.priority ?? "medium"] ?? 2);
        }
        if (sortBy === "due") {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1; // no date sorts last
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        }
        if (sortBy === "title") return a.title.localeCompare(b.title);
        // created: newest first
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
  }, [tasks, domain, priority, tag, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="label rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
        >
          <option value="all" className="bg-surface text-foreground">
            ALL DOMAINS
          </option>
          {DOMAINS.map((d) => (
            <option key={d} value={d} className="bg-surface text-foreground">
              {d}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-full border border-border-visible p-1">
          <button
            type="button"
            onClick={() => setPriority("all")}
            className={`label rounded-full px-3 py-1.5 transition-mech ${
              priority === "all" ? "bg-hero !text-black" : "!text-muted hover:!text-foreground"
            }`}
          >
            ALL
          </button>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`label rounded-full px-3 py-1.5 transition-mech ${
                priority === p ? "bg-hero !text-black" : "!text-muted hover:!text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {allTags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTag((cur) => (cur === t ? null : t))}
            className={`label rounded-full border px-3 py-1.5 transition-mech ${
              tag === t ? "border-hero !text-hero" : "border-border-visible !text-muted hover:!text-foreground"
            }`}
          >
            #{t}
          </button>
        ))}

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          aria-label="Sort by"
          className="label ml-auto rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
        >
          {SORTS.map((s) => (
            <option key={s} value={s} className="bg-surface text-foreground">
              SORT: {SORT_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState headline="No tasks match" description="Try clearing a filter." />
      ) : (
        <div className="flex flex-col">
          {filtered.map((task) => (
            <div
              key={task.id}
              onClick={() => onOpenDetail(task)}
              className="flex cursor-pointer items-center gap-3 border-b border-border py-3 transition-mech hover:bg-surface"
            >
              <StatusIcon status={task.status ?? "todo"} onClick={() => onToggleStatus(task)} />
              <EditableTitle
                title={task.title}
                done={task.status === "done"}
                onSave={(value) => onRename(task, value)}
              />
              <span className="label !text-faint">{task.domain}</span>
              {task.priority && task.priority !== "medium" && (
                <span className={`label ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
              )}
              {task.tags?.map((t) => (
                <span key={t} className="label !text-interactive">
                  #{t}
                </span>
              ))}
              {task.due_date && (
                <span className="label !text-muted">
                  {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
