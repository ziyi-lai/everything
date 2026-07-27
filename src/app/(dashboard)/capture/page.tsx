"use client";

import { useMemo, useState } from "react";
import { QuickAdd } from "@/components/capture/quick-add";
import { CaptureGrid } from "@/components/capture/capture-grid";
import { CaptureHeatmap } from "@/components/capture/capture-heatmap";
import { useCaptures, type Capture } from "@/hooks/use-captures";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { todayString } from "@/lib/date";
import { pickResurfaceCapture } from "@/lib/resurface";
import { uploadAttachment } from "@/lib/attachments";

const FILTERS = [
  { label: "TO TRIAGE", value: false },
  { label: "ALL", value: true },
] as const;

export default function CapturePage() {
  const [showProcessed, setShowProcessed] = useState(false);
  const [justCapturedId, setJustCapturedId] = useState<string | null>(null);

  // is_timer:false — timer sessions are their own module (/time); this page
  // is only ever about thoughts you typed
  const inbox = useCaptures(showProcessed ? { is_timer: false } : { processed: false, is_timer: false });
  // the streak/heatmap/resurface need the full history regardless of the
  // triage filter above, so they get their own unfiltered fetch
  const allCaptures = useCaptures({ is_timer: false });
  const { tasks, createTask } = useTasks();

  const today = todayString();
  const resurfaceCapture = useMemo(
    () => pickResurfaceCapture(allCaptures.captures, today, new Date().getTime()),
    [allCaptures.captures, today]
  );
  const pending = inbox.captures.filter((c) => !c.processed).length;

  async function handleCapture(rawText: string, file?: File) {
    const created = await inbox.createCapture({ raw_text: rawText });
    if (created?.id) {
      setJustCapturedId(created.id);
      setTimeout(() => setJustCapturedId(null), 900);
      if (file) {
        await uploadAttachment({
          bucket: "capture-attachments",
          apiBase: `/api/captures/${created.id}/attachments`,
          folder: created.id,
          file,
        });
      }
    }
    allCaptures.refetch();
  }

  async function handleVoiceCapture(audioPath: string) {
    const created = await inbox.createCapture({
      raw_text: "🎙️ Voice memo",
      source: "voice",
      audio_path: audioPath,
    });
    if (created?.id) {
      setJustCapturedId(created.id);
      setTimeout(() => setJustCapturedId(null), 900);
    }
    allCaptures.refetch();
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

  async function handleEdit(capture: Capture, text: string) {
    await inbox.updateCapture(capture.id, { raw_text: text, parsed_title: null });
  }

  // delete is the only inbox action that can change the streak/heatmap/resurface pool
  async function handleDelete(id: string) {
    await inbox.deleteCapture(id);
    allCaptures.refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-hero" style={{ letterSpacing: "-0.02em" }}>
            CAPTURE
          </h1>
        </div>
        <CaptureHeatmap captures={allCaptures.captures} />
      </header>

      <QuickAdd onCapture={handleCapture} onVoiceCapture={handleVoiceCapture} />

      <div className="flex items-center justify-between gap-4">
        <span className="label">
          INBOX
          {pending > 0 && <span className="ml-2 !text-hero">{pending} TO TRIAGE</span>}
        </span>
        <div className="flex items-center gap-1 rounded-full border border-border-visible p-1">
          {FILTERS.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setShowProcessed(o.value)}
              className={`label rounded-full px-4 py-1.5 transition-mech ${
                showProcessed === o.value ? "bg-hero !text-black" : "!text-muted hover:!text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {inbox.loading ? (
        <p className="label !text-faint">LOADING…</p>
      ) : (
        <CaptureGrid
          captures={inbox.captures}
          tasks={tasks}
          resurfaceCapture={resurfaceCapture}
          justCapturedId={justCapturedId}
          onConvert={handleConvert}
          onLink={handleLink}
          onArchive={(id) => inbox.updateCapture(id, { processed: true })}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onPin={(capture) => inbox.updateCapture(capture.id, { pinned: !capture.pinned })}
        />
      )}
    </div>
  );
}
