"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Task } from "@/hooks/use-tasks";

export function TaskLinkPicker({
  tasks,
  onSelect,
  onCancel,
}: {
  tasks: Task[];
  onSelect: (task: Task) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done" && t.status !== "cancelled"),
    [tasks]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q ? openTasks.filter((t) => t.title.toLowerCase().includes(q)) : openTasks;
    return pool.slice(0, 6);
  }, [openTasks, query]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-visible bg-surface-raised p-3">
      <div className="flex items-center gap-2">
        <Search size={14} strokeWidth={1.5} className="text-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search open tasks…"
          className="flex-1 bg-transparent font-mono text-body-sm text-foreground outline-none placeholder:text-faint"
        />
        <button type="button" aria-label="Cancel" onClick={onCancel} className="text-faint transition-mech hover:text-foreground">
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {results.length === 0 ? (
        <p className="label px-1 py-2 !text-faint">NO OPEN TASKS FOUND</p>
      ) : (
        <div className="flex flex-col">
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              className="truncate rounded-lg px-2 py-2 text-left text-body-sm text-foreground transition-mech hover:bg-surface"
            >
              {t.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
