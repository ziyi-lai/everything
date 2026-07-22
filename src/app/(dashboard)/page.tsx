import Link from "next/link";
import { Zap, CheckSquare, Wallet, Activity, BookOpen, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DomainCard } from "@/components/dashboard/domain-card";
import { LiveClock } from "@/components/shared/live-clock";
import { StatusIcon } from "@/components/tasks/status-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { todayString, hoursAgoIso } from "@/lib/date";
import { formatDuration } from "@/lib/period";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayString();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [captures, tasksCount, monthTransactions, notes, todayTasks, recentSessions] =
    await Promise.all([
      // is_timer:false — timer sessions live in their own module and are never
      // "processed", so counting them here would inflate the inbox badge
      supabase
        .from("captures")
        .select("id", { count: "exact", head: true })
        .eq("processed", false)
        .eq("is_timer", false),
      supabase.from("tasks").select("id", { count: "exact", head: true }).in("status", ["todo", "in_progress"]),
      supabase.from("transactions").select("type, amount").gte("transaction_date", monthStart),
      supabase.from("notes").select("id", { count: "exact", head: true }),
      supabase
        .from("tasks")
        .select("*")
        .in("status", ["todo", "in_progress"])
        .or(`due_date.eq.${today},priority.in.(urgent,high)`)
        .order("due_date", { ascending: true })
        .limit(5),
      supabase
        .from("captures")
        .select("start_time, duration_seconds")
        // 48h is wide enough to contain "today" in any timezone; the exact
        // day is then decided in APP_TIMEZONE below
        .eq("is_timer", true)
        .gte("start_time", hoursAgoIso(48)),
    ]);

  const monthBalance = (monthTransactions.data ?? []).reduce(
    (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0
  );

  const trackedTodaySeconds = (recentSessions.data ?? [])
    .filter((s) => s.start_time && todayString(new Date(s.start_time)) === today)
    .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);

  const displayName = user?.email?.split("@")[0]?.toUpperCase() ?? "THERE";

  return (
    <div className="flex flex-col gap-12">
      <header className="flex items-end justify-between">
        <h1 className="font-display text-display-md text-hero" style={{ letterSpacing: "-0.02em" }}>
          GOOD DAY, {displayName}
        </h1>
        <LiveClock />
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DomainCard
          href="/capture"
          label="CAPTURE"
          icon={Zap}
          metric={captures.count ?? 0}
          unit="IN INBOX"
          description="Thoughts waiting for triage."
        />
        <DomainCard
          href="/time"
          label="TIME"
          icon={Timer}
          metric={trackedTodaySeconds > 0 ? formatDuration(trackedTodaySeconds) : "—"}
          unit={trackedTodaySeconds > 0 ? "TODAY" : undefined}
          description="Time tracked today across all sessions."
        />
        <DomainCard
          href="/tasks"
          label="TASKS"
          icon={CheckSquare}
          metric={tasksCount.count ?? 0}
          unit="OPEN"
          description="Todo and in-progress items."
        />
        <DomainCard
          href="/finance"
          label="FINANCE"
          icon={Wallet}
          metric={`${monthBalance >= 0 ? "" : "-"}RM${Math.abs(monthBalance).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          unit="THIS MONTH"
          description="Balance so far this month."
        />
        <DomainCard
          href="/health"
          label="HEALTH"
          icon={Activity}
          metric="—"
          description="No recovery score logged today."
        />
        <DomainCard
          href="/knowledge"
          label="KNOWLEDGE"
          icon={BookOpen}
          metric={notes.count ?? 0}
          unit="NOTES"
          description="Total notes in your knowledge base."
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="label">TODAY&rsquo;S TASKS</span>
          <Link href="/tasks" className="label transition-mech hover:!text-foreground">
            VIEW ALL →
          </Link>
        </div>

        {todayTasks.data && todayTasks.data.length > 0 ? (
          <div className="flex flex-col">
            {todayTasks.data.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="flex items-center gap-3 border-b border-border py-3 transition-mech hover:bg-surface"
              >
                <StatusIcon status={task.status ?? "todo"} />
                <span className="flex-1 text-body text-foreground">{task.title}</span>
                {task.tags?.map((t) => (
                  <span key={t} className="label !text-interactive">
                    #{t}
                  </span>
                ))}
                {task.due_date && (
                  <span className="label !text-muted">
                    {task.due_date === today ? "DUE TODAY" : task.due_date}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState headline="Nothing urgent today" description="Your Today view is clear." />
        )}
      </section>
    </div>
  );
}
