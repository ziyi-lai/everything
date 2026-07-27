"use client";

import { useState } from "react";
import { ChevronRight, Play } from "lucide-react";
import { StatusIcon } from "@/components/tasks/status-icon";
import { TaskDetail } from "@/components/tasks/task-detail";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useTimer } from "@/components/time/timer-provider";
import { todayString } from "@/lib/date";
import { nextStatus } from "@/lib/task-status";
import type { Enums } from "@/lib/supabase/types";
import { TASK_DRAG_MIME } from "./timeline-view";

const PRIORITY_COLOR: Record<Enums<"task_priority">, string> = {
  urgent: "text-accent",
  high: "text-warning",
  medium: "text-muted",
  low: "text-faint",
};

const SCHEDULE_GROUPS = ["OVERDUE", "TODAY", "UPCOMING", "NO DATE"] as const;
type ScheduleGroup = (typeof SCHEDULE_GROUPS)[number];
const GROUP_COLOR: Record<ScheduleGroup, string> = {
  OVERDUE: "!text-accent",
  TODAY: "!text-hero",
  UPCOMING: "!text-muted",
  "NO DATE": "!text-faint",
};

function scheduleGroup(task: Task, today: string): ScheduleGroup {
  if (!task.due_date) return "NO DATE";
  if (task.due_date < today) return "OVERDUE";
  if (task.due_date === today) return "TODAY";
  return "UPCOMING";
}

/** Sidebar of open tasks — drag one onto the timeline to plan a session for
 * it, hit start to begin timing it right away, or click to edit it in place.
 * Collapsible (slides shut) so it doesn't permanently eat width from the
 * timeline. */
export function TaskDragPanel() {
  const { tasks, updateTask, deleteTask } = useTasks();
  const timer = useTimer();
  const [collapsed, setCollapsed] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const open = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const today = todayString();
  const grouped = SCHEDULE_GROUPS.map((group) => ({
    group,
    tasks: open
      .filter((t) => scheduleGroup(t, today) === group)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
  })).filter((g) => g.tasks.length > 0);

  return (
    <div className="flex shrink-0 items-start gap-0">
      <button
        type="button"
        aria-label={collapsed ? "Show tasks panel" : "Collapse tasks panel"}
        onClick={() => setCollapsed((c) => !c)}
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-visible text-faint transition-mech hover:border-border hover:text-foreground"
      >
        <ChevronRight size={12} strokeWidth={1.5} className={`transition-mech duration-300 ${collapsed ? "" : "rotate-180"}`} />
      </button>

      <div className="overflow-hidden transition-[width] duration-300 ease-out" style={{ width: collapsed ? 0 : 256 }}>
        <div className="flex w-64 flex-col gap-3 pl-4">
          <span className="label !text-faint">DRAG TO SCHEDULE</span>

          <div className="flex flex-col gap-4">
            {grouped.map(({ group, tasks: groupTasks }) => (
              <div key={group} className="flex flex-col gap-1.5">
                <span className={`label ${GROUP_COLOR[group]}`}>
                  {group} · {groupTasks.length}
                </span>
                {groupTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(TASK_DRAG_MIME, task.id);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => setDetailTask(task)}
                    title={task.title}
                    className="flex cursor-pointer flex-col gap-1 rounded-md border border-border px-2 py-1.5 text-left transition-mech hover:border-border-visible"
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        status={task.status ?? "todo"}
                        onClick={() => updateTask(task.id, { status: nextStatus(task.status) })}
                      />
                      <span className="min-w-0 flex-1 truncate font-mono text-caption text-foreground">{task.title}</span>
                      <button
                        type="button"
                        aria-label={`Start timer for ${task.title}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          timer.start({ description: task.title, linkedTaskId: task.id });
                        }}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-faint transition-mech hover:bg-surface-raised hover:text-hero"
                      >
                        <Play size={9} strokeWidth={0} fill="currentColor" />
                      </button>
                    </div>

                    {(task.priority || task.domain || task.due_date || task.estimated_minutes) && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-6">
                        {task.priority && task.priority !== "medium" && (
                          <span className={`label ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                        )}
                        {task.domain && <span className="label !text-faint">{task.domain}</span>}
                        {task.due_date && (
                          <span className="label !text-muted">
                            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {task.estimated_minutes && <span className="label !text-muted">{task.estimated_minutes}m</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <TaskDetail
        key={detailTask?.id ?? "empty"}
        task={detailTask}
        onOpenChange={(o) => !o && setDetailTask(null)}
        onSave={(id, patch) => updateTask(id, patch)}
        onDelete={(id) => {
          deleteTask(id);
          setDetailTask(null);
        }}
      />
    </div>
  );
}
