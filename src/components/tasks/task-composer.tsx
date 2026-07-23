"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, CornerDownLeft, Calendar, Layers } from "lucide-react";
import { parseCapture } from "@/lib/nlp-parser";
import { todayString } from "@/lib/date";
import { parseDay, formatDay } from "@/lib/period";
import { PrioritySlider } from "@/components/tasks/priority-slider";
import type { Enums } from "@/lib/supabase/types";

const DOMAINS: Enums<"task_domain">[] = ["coding", "research", "writing", "life", "health", "finance", "other"];

function addDays(day: string, delta: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + delta);
  return formatDay(d);
}

function dueLabel(due: string | null): string {
  if (!due) return "NO DATE";
  const today = todayString();
  if (due === today) return "TODAY";
  if (due === addDays(today, 1)) return "TOMORROW";
  return parseDay(due)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

export function TaskComposer({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: {
    title: string;
    tags: string[];
    due_date: string | null;
    priority: Enums<"task_priority">;
    domain: Enums<"task_domain">;
  }) => Promise<unknown>;
}) {
  const [raw, setRaw] = useState("");
  // null = follow whatever the NLP detects; a string/false = user overrode it
  const [manualDue, setManualDue] = useState<string | null | false>(false);
  const [priority, setPriority] = useState<Enums<"task_priority">>("medium");
  const [domain, setDomain] = useState<Enums<"task_domain">>("other");
  const [creating, setCreating] = useState(false);
  const [createdFlash, setCreatedFlash] = useState(false);

  // The immersive part: parse as you type. `明天3pm review PR #work` lights up
  // a date chip and tag chips live, before anything is saved.
  const parsed = useMemo(() => parseCapture(raw), [raw]);
  const nlpDue = parsed.due ? formatDay(parsed.due) : null;
  const effectiveDue = manualDue === false ? nlpDue : manualDue;

  const today = todayString();
  const datePills: { label: string; value: string | null }[] = [
    { label: "TODAY", value: today },
    { label: "TOMORROW", value: addDays(today, 1) },
    { label: "NEXT WEEK", value: addDays(today, 7) },
    { label: "NONE", value: null },
  ];

  async function create() {
    const title = parsed.title.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      await onCreate({ title, tags: parsed.tags, due_date: effectiveDue, priority, domain });
      // reset for rapid entry (Drafts philosophy) but stay open + flash
      setRaw("");
      setManualDue(false);
      setPriority("medium");
      setCreatedFlash(true);
      setTimeout(() => setCreatedFlash(false), 1400);
    } finally {
      setCreating(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      create();
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.8)" }} />
        <Dialog.Content className="dot-grid-subtle fixed left-1/2 top-1/2 z-50 w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-visible bg-surface p-8">
          <div className="flex items-start justify-between">
            <Dialog.Title className="label">NEW TASK</Dialog.Title>
            <Dialog.Close aria-label="Close" className="text-faint transition-mech hover:text-foreground">
              <X size={18} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          <textarea
            autoFocus
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="What needs doing? Try: tomorrow 3pm review PR #work"
            className="mt-6 w-full resize-none bg-transparent font-sans text-heading text-hero outline-none placeholder:text-faint"
            style={{ letterSpacing: "-0.01em" }}
          />

          {/* live parse readout — mirrors the capture bar's NLP preview */}
          <div className="mt-2 flex min-h-5 flex-wrap items-center gap-2">
            {nlpDue && manualDue === false && (
              <span className="label rounded-full border border-hero px-2.5 py-1 !text-hero">
                📅 {dueLabel(nlpDue)}
              </span>
            )}
            {parsed.tags.map((t) => (
              <span key={t} className="label rounded-full border border-border-visible px-2.5 py-1 !text-interactive">
                #{t}
              </span>
            ))}
            {createdFlash && <span className="label !text-success">[CREATED]</span>}
          </div>

          <div className="mt-6 flex flex-col gap-5 border-t border-border pt-6">
            <Row icon={<Calendar size={14} strokeWidth={1.5} />} label="DUE">
              <div className="flex flex-wrap items-center gap-1.5">
                {datePills.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setManualDue(p.value)}
                    className={`label rounded-full border px-3 py-1.5 transition-mech ${
                      effectiveDue === p.value && manualDue !== false
                        ? "border-hero bg-hero !text-black"
                        : "border-border-visible !text-muted hover:!text-foreground"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <input
                  type="date"
                  value={manualDue === false ? "" : (manualDue ?? "")}
                  onChange={(e) => setManualDue(e.target.value || null)}
                  aria-label="Pick a due date"
                  className="label rounded-full border border-border-visible bg-transparent px-3 py-1 text-foreground outline-none"
                />
              </div>
            </Row>

            <div>
              <span className="label mb-2 block !text-muted">PRIORITY</span>
              <PrioritySlider value={priority} onChange={setPriority} />
            </div>

            <Row icon={<Layers size={14} strokeWidth={1.5} />} label="DOMAIN">
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as Enums<"task_domain">)}
                className="label rounded-full border border-border-visible bg-transparent px-3 py-1.5 text-foreground outline-none"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d} className="bg-surface text-foreground">
                    {d}
                  </option>
                ))}
              </select>
            </Row>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <span className="label flex items-center gap-2 !text-faint">
              <CornerDownLeft size={11} strokeWidth={1.5} />
              CREATE · ESC CLOSE
            </span>
            <button
              type="button"
              onClick={create}
              disabled={!parsed.title.trim() || creating}
              className="label flex h-11 items-center rounded-full bg-hero px-8 text-black transition-mech hover:opacity-90 disabled:opacity-40"
            >
              {creating ? "[CREATING...]" : "CREATE TASK"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="label flex shrink-0 items-center gap-2">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}
