import type { Enums } from "@/lib/supabase/types";

type TaskStatus = Enums<"task_status">;

const CYCLE: Record<TaskStatus, TaskStatus> = {
  backlog: "todo",
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  cancelled: "todo",
};

export function nextStatus(current: TaskStatus | null): TaskStatus {
  return CYCLE[current ?? "todo"];
}
