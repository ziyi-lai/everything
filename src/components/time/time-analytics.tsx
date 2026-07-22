"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import type { Capture } from "@/hooks/use-captures";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDay, formatDuration, periodRange, type PeriodMode } from "@/lib/period";

export function TimeAnalytics({
  entries,
  anchor,
  mode,
}: {
  entries: Capture[];
  anchor: string;
  mode: PeriodMode;
}) {
  const { start, end } = periodRange(anchor, mode);

  const stats = useMemo(() => {
    const inPeriod = entries.filter((e) => {
      if (!e.start_time) return false;
      const t = new Date(e.start_time).getTime();
      return t >= start.getTime() && t < end.getTime();
    });

    const total = inPeriod.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);

    // one bucket per day in the period, so gaps show as gaps
    const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const perDay = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return { key: formatDay(d), date: d, seconds: 0 };
    });
    const dayIndex = new Map(perDay.map((d) => [d.key, d]));
    for (const e of inPeriod) {
      const bucket = dayIndex.get(formatDay(new Date(e.start_time!)));
      if (bucket) bucket.seconds += e.duration_seconds ?? 0;
    }

    const byActivity = new Map<string, { seconds: number; count: number }>();
    for (const e of inPeriod) {
      const name = (e.parsed_title ?? e.raw_text).trim() || "Untitled";
      const cur = byActivity.get(name) ?? { seconds: 0, count: 0 };
      cur.seconds += e.duration_seconds ?? 0;
      cur.count += 1;
      byActivity.set(name, cur);
    }
    const activities = [...byActivity.entries()]
      .map(([name, v]) => ({ name, ...v, percent: total > 0 ? (v.seconds / total) * 100 : 0 }))
      .sort((a, b) => b.seconds - a.seconds);

    const activeDays = perDay.filter((d) => d.seconds > 0).length;
    const longest = inPeriod.reduce((max, e) => Math.max(max, e.duration_seconds ?? 0), 0);

    return {
      total,
      sessions: inPeriod.length,
      perDay,
      activities,
      activeDays,
      longest,
      avgPerActiveDay: activeDays > 0 ? total / activeDays : 0,
    };
  }, [entries, start, end]);

  if (stats.sessions === 0) {
    return (
      <EmptyState
        headline="Nothing tracked in this period"
        description="Time analytics appear once you log a session."
      />
    );
  }

  const chartData = stats.perDay.map((d) => ({
    label: d.date.toLocaleDateString("en-US", { day: "numeric" }),
    hours: Number((d.seconds / 3600).toFixed(2)),
    seconds: d.seconds,
  }));

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        <Stat label="TOTAL TRACKED" value={formatDuration(stats.total)} hero />
        <Stat label="SESSIONS" value={String(stats.sessions)} />
        <Stat label="AVG / ACTIVE DAY" value={formatDuration(Math.round(stats.avgPerActiveDay))} />
        <Stat label="LONGEST SESSION" value={formatDuration(stats.longest)} />
      </div>

      <div className="flex flex-col gap-4">
        <span className="label">TIME PER DAY</span>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "var(--border-visible)" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <Bar dataKey="hours" isAnimationActive={false}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill="var(--text-display)" fillOpacity={d.seconds > 0 ? 1 : 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="label">WHERE THE TIME WENT</span>
        <div className="flex flex-col">
          {stats.activities.slice(0, 8).map((a) => (
            <div key={a.name} className="flex flex-col gap-1.5 border-b border-border py-3">
              <div className="flex items-baseline justify-between gap-4">
                <span className="truncate text-body-sm text-foreground">{a.name}</span>
                <span className="shrink-0 font-mono text-body-sm text-muted">
                  {formatDuration(a.seconds)}
                  <span className="label ml-2 !text-faint">
                    {a.percent.toFixed(0)}% · {a.count}×
                  </span>
                </span>
              </div>
              <span className="h-1 w-full bg-border">
                <span className="block h-full bg-hero" style={{ width: `${Math.max(2, a.percent)}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label">{label}</span>
      <span className={`font-mono ${hero ? "text-display-md text-hero" : "text-heading text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
