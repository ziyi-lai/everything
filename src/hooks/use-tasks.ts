"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/types";

export type Task = Tables<"tasks">;

// Every page mounts its own useTasks() with its own local state. A mutation
// in one (e.g. creating a task on /tasks) used to be invisible to another
// (e.g. the timer dock's task-link picker) until a full page reload. This
// event lets every mounted instance know to refetch, regardless of which
// instance made the change.
const TASKS_CHANGED_EVENT = "everything:tasks-changed";

function broadcastTasksChanged() {
  window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT));
}

export function useTasks(filter?: { status?: string; view?: "today" }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const statusFilter = filter?.status;
  const viewFilter = filter?.view;

  async function refetch() {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (viewFilter) params.set("view", viewFilter);
    const res = await fetch(`/api/tasks?${params.toString()}`);
    const data = await res.json();
    setTasks(data.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // deferred via setTimeout rather than called synchronously in the effect body
    const id = setTimeout(() => {
      setLoading(true);
      refetch();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only, refetch closes over current filter each render
  }, [statusFilter, viewFilter]);

  useEffect(() => {
    window.addEventListener(TASKS_CHANGED_EVENT, refetch);
    return () => window.removeEventListener(TASKS_CHANGED_EVENT, refetch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- primitives only, refetch closes over current filter each render
  }, [statusFilter, viewFilter]);

  async function createTask(input: { title: string } & Record<string, unknown>) {
    const res = await fetch("/api/tasks", { method: "POST", body: JSON.stringify(input) });
    const data = await res.json();
    // merge the created row locally instead of a full refetch — halves the
    // round trips on every mutation, which was the main source of lag
    if (data.task) setTasks((prev) => [data.task as Task, ...prev]);
    broadcastTasksChanged();
    return data.task as Task;
  }

  async function updateTask(id: string, patch: Record<string, unknown>) {
    // optimistic — the board/today views re-render instantly instead of
    // waiting a round trip for a drag-drop or checkbox toggle to "stick"
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    const data = await res.json();
    if (data.task) setTasks((prev) => prev.map((t) => (t.id === id ? (data.task as Task) : t)));
    broadcastTasksChanged();
    return data.task as Task;
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    broadcastTasksChanged();
  }

  return { tasks, loading, refetch, createTask, updateTask, deleteTask };
}
