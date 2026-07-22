const SEGMENTS = 24;

function statusColor(percent: number): string {
  if (percent > 100) return "var(--accent)";
  if (percent >= 80) return "var(--warning)";
  return "var(--text-display)";
}

export function BudgetBar({ category, spent, budgeted }: { category: string; spent: number; budgeted: number }) {
  const percent = budgeted > 0 ? (spent / budgeted) * 100 : 0;
  const filledSegments = Math.min(SEGMENTS, Math.round((Math.min(percent, 100) / 100) * SEGMENTS));
  const overBudget = percent > 100;
  const color = statusColor(percent);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="label">{category}</span>
        <span className={`font-mono text-body-sm ${overBudget ? "text-accent" : "text-muted"}`}>
          RM{spent.toFixed(0)} / RM{budgeted.toFixed(0)}
          {overBudget && <span className="label ml-2 !text-accent">OVER</span>}
        </span>
      </div>
      <div className="flex gap-[2px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 flex-1 transition-mech"
            style={{ background: i < filledSegments ? color : "var(--border)" }}
          />
        ))}
      </div>
    </div>
  );
}
