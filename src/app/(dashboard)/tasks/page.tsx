"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { TodayView } from "@/components/tasks/today-view";
import { BoardView } from "@/components/tasks/board-view";
import { ListView } from "@/components/tasks/list-view";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskComposer } from "@/components/tasks/task-composer";
import { nextStatus } from "@/lib/task-status";
import { todayString } from "@/lib/date";
import type { Enums } from "@/lib/supabase/types";

const TABS = ["TODAY", "LIST", "BOARD"] as const;
type Tab = (typeof TABS)[number];

export default function TasksPage() {
  const [tab, setTab] = useState<Tab>("TODAY");
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const { tasks, loading, updateTask, createTask, deleteTask } = useTasks();

  // N opens the composer from anywhere on the page (unless typing in a field)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      if (e.key.toLowerCase() === "n" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setComposerOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const todayTasks = useMemo(() => {
    const today = todayString();
    // due today or overdue — a task merely marked high-priority with a due
    // date next week doesn't belong in "Today"
    return tasks.filter((t) => {
      if (t.status !== "todo" && t.status !== "in_progress") return false;
      return !!t.due_date && t.due_date <= today;
    });
  }, [tasks]);

  const boardTasks = useMemo(() => tasks.filter((t) => t.status !== "cancelled"), [tasks]);
  const listTasks = useMemo(() => tasks.filter((t) => t.status !== "cancelled"), [tasks]);
  const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;

  function handleToggleStatus(task: Task) {
    updateTask(task.id, { status: nextStatus(task.status) });
  }

  function handleMove(task: Task, status: Enums<"task_status">) {
    updateTask(task.id, { status });
  }

  function handleQuickAdd(input: { title: string; tags: string[] }) {
    // quick-add lives inside the Today view — an item typed here is implicitly "for today"
    createTask({ title: input.title, tags: input.tags, due_date: todayString() });
  }

  function handleRename(task: Task, title: string) {
    updateTask(task.id, { title });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="label">TASKS</p>
          <h1 className="font-display text-display-md text-hero mt-1">
            {tab === "TODAY" ? "TODAY" : tab === "LIST" ? "ALL TASKS" : "BOARD"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border-visible p-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`label rounded-full px-4 py-2 transition-mech ${
                  tab === t ? "bg-hero !text-black" : "!text-muted hover:!text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            title="New task (N)"
            className="label flex h-11 items-center gap-2 rounded-full bg-hero px-5 text-black transition-mech hover:opacity-90"
          >
            <Plus size={14} strokeWidth={2} />
            NEW TASK
          </button>
        </div>
      </header>

      {loading ? (
        <p className="label !text-faint">LOADING…</p>
      ) : (
        <>
          {tab === "TODAY" && (
            <TodayView
              tasks={todayTasks}
              onToggleStatus={handleToggleStatus}
              onCreate={handleQuickAdd}
              onOpenDetail={(t) => setDetailTaskId(t.id)}
              onRename={handleRename}
            />
          )}

          {tab === "LIST" && (
            <ListView
              tasks={listTasks}
              onToggleStatus={handleToggleStatus}
              onOpenDetail={(t) => setDetailTaskId(t.id)}
              onRename={handleRename}
            />
          )}

          {tab === "BOARD" && (
            <BoardView tasks={boardTasks} onMove={handleMove} onOpenDetail={(t) => setDetailTaskId(t.id)} />
          )}
        </>
      )}

      <TaskComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onCreate={(input) => createTask(input)}
      />

      <TaskDetail
        key={detailTask?.id ?? "empty"}
        task={detailTask}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
        onSave={(id, patch) => updateTask(id, patch)}
        onDelete={(id) => deleteTask(id)}
      />
    </div>
  );
}
