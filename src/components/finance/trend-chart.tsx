"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useFinanceTrends } from "@/hooks/use-finance";
import { EmptyState } from "@/components/shared/empty-state";

export function TrendChart() {
  const [months, setMonths] = useState<6 | 12>(6);
  const { trends, loading } = useFinanceTrends(months);

  const totalIncome = trends.reduce((sum, t) => sum + t.income, 0);
  const totalExpense = trends.reduce((sum, t) => sum + t.expense, 0);
  const hasData = trends.some((t) => t.income > 0 || t.expense > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-body-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-hero" /> Income
          </span>
          <span className="flex items-center gap-2 text-body-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-accent" /> Expense
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border-visible p-1">
          {([6, 12] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`label rounded-full px-4 py-2 transition-mech ${
                months === m ? "bg-hero !text-black" : "!text-muted hover:!text-foreground"
              }`}
            >
              {m}M
            </button>
          ))}
        </div>
      </div>

      {!loading && !hasData ? (
        <EmptyState headline="No trend data yet" description="Log a few months of transactions to see it here." />
      ) : (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(m: string) => m.slice(5)}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                  axisLine={{ stroke: "var(--border-visible)" }}
                  tickLine={false}
                />
                {/* isAnimationActive={false}: Recharts' grow-in animation can
                    leave the series un-rendered here, and the design system
                    rules out gratuitous animation anyway */}
                <Line type="monotone" dataKey="income" stroke="var(--text-display)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="expense" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-12 border-t border-border pt-4">
            <Stat label={`${months}M INCOME`} value={totalIncome} />
            <Stat label={`${months}M EXPENSE`} value={totalExpense} />
            <Stat label="NET" value={totalIncome - totalExpense} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label">{label}</span>
      <span className="font-mono text-body text-foreground">
        RM{value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}
