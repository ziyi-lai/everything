"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BudgetBar } from "@/components/finance/budget-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { categoryEmoji } from "@/lib/constants";
import type { FinanceReport } from "@/app/api/finance/report/route";

export function MonthlyDashboard({ report }: { report: FinanceReport }) {
  const { income, expense, balance, categories, budgets } = report;

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-3 gap-8">
        <BigStat label="INCOME" value={income} color="text-hero" />
        <BigStat label="EXPENSES" value={expense} color="text-hero" />
        <BigStat label="BALANCE" value={balance} color={balance >= 0 ? "text-success" : "text-accent"} />
      </div>

      {budgets.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="label">BUDGETS</span>
          <div className="flex flex-col gap-5">
            {budgets.map((b) => (
              <BudgetBar key={b.category} category={b.category} spent={b.spent} budgeted={b.budgeted} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <span className="label">CATEGORIES THIS MONTH</span>
        {categories.length === 0 ? (
          <EmptyState headline="No spending yet" description="Categories will appear here as you log expenses." />
        ) : (
          <div className="flex items-center gap-12">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={56}
                    outerRadius={88}
                    stroke="var(--black)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {/* opacity, not hue, separates the slices (design system:
                        differentiate by opacity before reaching for color) —
                        and the token inverts correctly in light mode */}
                    {categories.map((c, i) => (
                      <Cell
                        key={c.category}
                        fill="var(--text-display)"
                        fillOpacity={Math.max(0.25, 1 - i * 0.18)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-1 flex-col">
              {categories.map((c) => (
                <div key={c.category} className="flex items-center justify-between border-b border-border py-2.5">
                  <span className="text-body-sm text-foreground">
                    {categoryEmoji(c.category)} {c.category}
                  </span>
                  <span className="font-mono text-body-sm text-muted">
                    RM{c.amount.toFixed(0)} ({c.percent.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="label">{label}</span>
      <span className={`font-mono text-display-md ${color}`}>
        RM{value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}
