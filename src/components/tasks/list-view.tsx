"use client";

import { useMemo, useState } from "react";
import { StatusIcon } from "@/components/tasks/status-icon";
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

export function ListView({ tasks, onToggleStatus, onOpenDetail }: {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onOpenDetail: (task: Task) => void;
}) {
  const [domain, setDomain] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [tag, setTag] = useState<string | null>(null);

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
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority ?? "medium"] ?? 2) - (order[b.priority ?? "medium"] ?? 2);
      });
  }, [tasks, domain, priority, tag]);

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
              <span
                className={`flex-1 text-body transition-mech ${
                  task.status === "done" ? "text-faint line-through" : "text-foreground"
                }`}
              >
                {task.title}
              </span>
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
