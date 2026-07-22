"use client";

import { useState, type DragEvent } from "react";
import type { Task } from "@/hooks/use-tasks";
import type { Enums } from "@/lib/supabase/types";

type ColumnStatus = Enums<"task_status">;

const COLUMNS: { title: string; statuses: ColumnStatus[]; dropStatus: ColumnStatus }[] = [
  { title: "BACKLOG", statuses: ["backlog", "todo"], dropStatus: "todo" },
  { title: "IN PROGRESS", statuses: ["in_progress"], dropStatus: "in_progress" },
  { title: "DONE", statuses: ["done"], dropStatus: "done" },
];

export function BoardView({
  tasks,
  onMove,
  onOpenDetail,
}: {
  tasks: Task[];
  onMove: (task: Task, status: ColumnStatus) => void;
  onOpenDetail: (task: Task) => void;
}) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  function handleDrop(e: DragEvent, column: (typeof COLUMNS)[number]) {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/task-id");
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== column.dropStatus) onMove(task, column.dropStatus);
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {COLUMNS.map((column) => {
        const items = tasks.filter((t) => column.statuses.includes(t.status ?? "backlog"));
        return (
          <div
            key={column.title}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(column.title);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === column.title ? null : c))}
            onDrop={(e) => handleDrop(e, column)}
            className={`flex flex-col gap-2 rounded-2xl border p-3 transition-mech ${
              dragOverCol === column.title ? "border-border-visible bg-surface" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between px-1 py-1">
              <span className="label">{column.title}</span>
              <span className="label !text-faint">{items.length}</span>
            </div>

            <div className="flex min-h-16 flex-col gap-2">
              {items.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
                  onClick={() => onOpenDetail(task)}
                  className="cursor-grab rounded-lg border border-border bg-surface px-3 py-3 text-body-sm text-foreground transition-mech active:cursor-grabbing hover:border-border-visible"
                >
                  {task.title}
                  {task.tags && task.tags.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {task.tags.map((t) => (
                        <span key={t} className="label !text-interactive">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
