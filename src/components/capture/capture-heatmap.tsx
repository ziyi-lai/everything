"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { todayString } from "@/lib/date";
import { formatDay, parseDay } from "@/lib/period";
import type { Capture } from "@/hooks/use-captures";

const WEEKS = 12;
const DAYS = WEEKS * 7;

/**
 * GitHub-style activity grid + current streak, both derived from the same
 * day-bucketed capture counts. The streak is the addictive hook — Flomo and
 * Duolingo both lean on "don't break the chain" to keep capture a daily habit.
 */
export function CaptureHeatmap({ captures }: { captures: Capture[] }) {
  const { cells, streak } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of captures) {
      if (!c.created_at) continue;
      const key = todayString(new Date(c.created_at));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const today = todayString();
    const days: { key: string; count: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(parseDay(today).getTime() - i * 86400000);
      const key = formatDay(d);
      days.push({ key, count: counts.get(key) ?? 0 });
    }

    let streakCount = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      // today is allowed to still be at zero without breaking the streak —
      // the day isn't over yet
      if (days[i].count > 0) streakCount++;
      else if (days[i].key !== today) break;
    }

    return { cells: days, streak: streakCount };
  }, [captures]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Flame
          size={14}
          strokeWidth={1.5}
          className={streak > 0 ? "text-accent" : "text-faint"}
        />
        <span className="label !text-foreground">{streak} DAY STREAK</span>
      </div>

      <div className="grid grid-flow-col grid-rows-7 gap-[3px]" title={`${cells.filter((c) => c.count > 0).length} active days in the last ${WEEKS} weeks`}>
        {cells.map((c) => (
          <span
            key={c.key}
            className="h-[9px] w-[9px] rounded-[2px] transition-mech"
            style={{
              background:
                c.count === 0
                  ? "var(--border)"
                  : c.count === 1
                    ? "var(--border-visible)"
                    : c.count <= 3
                      ? "var(--interactive)"
                      : "var(--text-display)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
