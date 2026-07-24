"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { StatusIcon } from "@/components/tasks/status-icon";
import { EditableTitle } from "@/components/tasks/editable-title";
import { EmptyState } from "@/components/shared/empty-state";
import { extractTags } from "@/lib/nlp-parser";
import type { Task } from "@/hooks/use-tasks";

export function TodayView({
  tasks,
  onToggleStatus,
  onCreate,
  onOpenDetail,
  onRename,
}: {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onCreate: (input: { title: string; tags: string[] }) => void;
  onOpenDetail: (task: Task) => void;
  onRename: (task: Task, title: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [newTitle, setNewTitle] = useState("");

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0)),
    [tasks]
  );

  function onListKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // typing in the "add task" input (or any field) shouldn't also drive the
    // roving selection — Space was toggling whatever row was selected while
    // the user was mid-typing a new task title
    const target = e.target as HTMLElement;
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
    if (typing) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => Math.min(i + 1, sorted.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => Math.max(i - 1, 0));
    }
    if (e.key === " " && sorted[selected]) {
      e.preventDefault();
      onToggleStatus(sorted[selected]);
    }
    if (e.key === "Enter" && sorted[selected]) {
      onOpenDetail(sorted[selected]);
    }
  }

  function submitNewTask() {
    const { title, tags } = extractTags(newTitle);
    if (!title) return;
    onCreate({ title, tags });
    setNewTitle("");
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState headline="Nothing due today" description="Add something below, or enjoy the quiet." />
        <AddTaskRow value={newTitle} onChange={setNewTitle} onSubmit={submitNewTask} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" tabIndex={0} onKeyDown={onListKeyDown}>
      {sorted.map((task, i) => (
        <div
          key={task.id}
          onClick={() => {
            setSelected(i);
            onOpenDetail(task);
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border-b border-border px-2 py-3 transition-mech ${
            i === selected ? "bg-surface" : ""
          }`}
        >
          <StatusIcon status={task.status ?? "todo"} onClick={() => onToggleStatus(task)} />
          <EditableTitle
            title={task.title}
            done={task.status === "done"}
            onSave={(value) => onRename(task, value)}
          />
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

      <AddTaskRow value={newTitle} onChange={setNewTitle} onSubmit={submitNewTask} />
    </div>
  );
}

function AddTaskRow({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <span className="text-faint">+</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder="Add task… (#tag to tag it)"
        className="flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-faint"
      />
    </div>
  );
}
