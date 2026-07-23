"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimelineView } from "@/components/time/timeline-view";
import { TimeAnalytics } from "@/components/time/time-analytics";
import { EntryDetail } from "@/components/time/entry-detail";
import { useCaptures } from "@/hooks/use-captures";
import { todayString } from "@/lib/date";
import { periodLabel, shiftPeriod, type PeriodMode } from "@/lib/period";

const TABS = ["TIMELINE", "ANALYTICS"] as const;
type Tab = (typeof TABS)[number];

const MODES: PeriodMode[] = ["DAY", "WEEK", "MONTH"];

export default function TimePage() {
  const [tab, setTab] = useState<Tab>("TIMELINE");
  const [mode, setMode] = useState<PeriodMode>("DAY");
  const [anchor, setAnchor] = useState(() => todayString());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingCreateId, setPendingCreateId] = useState<string | null>(null);

  const timeline = useCaptures({ is_timer: true });

  // the sidebar timer writes through its own client, so this page has to be
  // told when a session lands rather than owning that write itself
  useEffect(() => {
    const refresh = () => timeline.refetch();
    window.addEventListener("everything:capture-saved", refresh);
    return () => window.removeEventListener("everything:capture-saved", refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable enough for an event listener
  }, []);

  const detailEntry = timeline.captures.find((c) => c.id === detailId) ?? null;

  async function handleCreateEntry(start: Date, end: Date) {
    const durationSeconds = Math.max(60, Math.round((end.getTime() - start.getTime()) / 1000));
    const created = await timeline.createCapture({
      raw_text: "Untitled session",
      is_timer: true,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_seconds: durationSeconds,
    });
    // straight into rename — a drag-created block starts nameless, so open
    // its detail immediately rather than leaving "Untitled session" sitting there
    setDetailId(created.id);
    setPendingCreateId(created.id);
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">TIME</p>
          <h1 className="font-display text-display-md text-hero mt-1">{periodLabel(anchor, mode)}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded-full border border-border-visible p-1">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`label rounded-full px-3 py-1.5 transition-mech ${
                  mode === m ? "bg-hero !text-black" : "!text-muted hover:!text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous period"
              onClick={() => setAnchor((a) => shiftPeriod(a, mode, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-mech hover:text-foreground"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Next period"
              onClick={() => setAnchor((a) => shiftPeriod(a, mode, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-mech hover:text-foreground"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(todayString())}
              className="label ml-1 rounded-full border border-border-visible px-3 py-1.5 !text-muted transition-mech hover:!text-foreground"
            >
              TODAY
            </button>
          </div>

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
        </div>
      </header>

      {tab === "TIMELINE" ? (
        <TimelineView
          entries={timeline.captures}
          anchor={anchor}
          mode={mode}
          onSelect={(entry) => setDetailId(entry.id)}
          onReschedule={(id, newStart, newEnd) =>
            timeline.updateCapture(id, { start_time: newStart.toISOString(), end_time: newEnd.toISOString() })
          }
          onCreate={handleCreateEntry}
        />
      ) : (
        <TimeAnalytics entries={timeline.captures} anchor={anchor} mode={mode} />
      )}

      <EntryDetail
        key={detailEntry?.id ?? "empty"}
        entry={detailEntry}
        onOpenChange={(open) => {
          if (!open) {
            // closing without saving (ESC, backdrop, X) on a freshly
            // drag-created entry cancels the creation instead of leaving
            // a stray "Untitled session" behind
            if (pendingCreateId) {
              timeline.deleteCapture(pendingCreateId);
              setPendingCreateId(null);
            }
            setDetailId(null);
          }
        }}
        onSave={(id, patch) => {
          if (id === pendingCreateId) setPendingCreateId(null);
          return timeline.updateCapture(id, patch);
        }}
        onDelete={(id) => {
          if (id === pendingCreateId) setPendingCreateId(null);
          timeline.deleteCapture(id);
        }}
      />
    </div>
  );
}
