"use client";

import { useState } from "react";
import { CaptureBar } from "@/components/capture/capture-bar";
import { InboxList } from "@/components/capture/inbox-list";
import { useCaptures, type Capture } from "@/hooks/use-captures";
import { useTasks, type Task } from "@/hooks/use-tasks";

export default function CapturePage() {
  const [showProcessed, setShowProcessed] = useState(false);

  // is_timer:false — timer sessions are their own module (/time); this page
  // is only ever about thoughts you typed
  const inbox = useCaptures(showProcessed ? { is_timer: false } : { processed: false, is_timer: false });
  const { tasks, createTask } = useTasks();

  async function handleCapture(rawText: string) {
    await inbox.createCapture({ raw_text: rawText });
  }

  async function handleConvert(capture: Capture) {
    const task = await createTask({
      title: capture.parsed_title || capture.raw_text,
      due_date: capture.parsed_due ? capture.parsed_due.slice(0, 10) : null,
      tags: capture.parsed_tags ?? [],
      status: "backlog",
    });
    await inbox.updateCapture(capture.id, { processed: true, converted_to_task_id: task.id });
  }

  async function handleLink(capture: Capture, task: Task) {
    await inbox.updateCapture(capture.id, { processed: true, converted_to_task_id: task.id });
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="label">ZERO-FRICTION NOTES</p>
        <h1 className="font-display text-display-md text-hero mt-1">CAPTURE</h1>
      </div>

      <CaptureBar onCapture={handleCapture} />

      <InboxList
        captures={inbox.captures}
        tasks={tasks}
        showProcessed={showProcessed}
        onShowProcessedChange={setShowProcessed}
        onConvert={handleConvert}
        onLink={handleLink}
        onArchive={(id) => inbox.updateCapture(id, { processed: true })}
        onDelete={(id) => inbox.deleteCapture(id)}
      />
    </div>
  );
}
