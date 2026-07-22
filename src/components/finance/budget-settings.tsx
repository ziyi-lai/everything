"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import type { Budget } from "@/hooks/use-finance";

export function BudgetSettings({
  budgets,
  onSet,
  onDelete,
}: {
  budgets: Budget[];
  onSet: (input: { category: string; amount: number }) => void;
  onDelete: (id: string) => void;
}) {
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0].name);
  const [amount, setAmount] = useState("");

  const budgeted = new Set(budgets.map((b) => b.category));

  function submit() {
    const value = Number(amount);
    if (!value || value <= 0) return;
    onSet({ category, amount: value });
    setAmount("");
  }

  return (
    <div className="flex flex-col gap-6">
      <span className="label">SET MONTHLY BUDGET</span>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="label rounded-full border border-border-visible bg-transparent px-4 py-2 text-foreground outline-none"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name} className="bg-surface text-foreground">
              {c.emoji} {c.name}
              {budgeted.has(c.name) ? " (set)" : ""}
            </option>
          ))}
        </select>
        <span className="font-mono text-body text-faint">RM</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="0.00"
          inputMode="decimal"
          className="w-28 border-0 border-b border-border-visible bg-transparent py-1 font-mono text-body text-foreground outline-none focus:border-foreground placeholder:text-faint"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!amount}
          className="label rounded-full bg-hero px-4 py-2 text-black transition-mech hover:opacity-90 disabled:opacity-40"
        >
          SET
        </button>
      </div>

      {budgets.length > 0 && (
        <div className="flex flex-col">
          {budgets.map((b) => (
            <div key={b.id} className="flex items-center justify-between border-b border-border py-2.5">
              <span className="text-body-sm text-foreground">{b.category}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-body-sm text-muted">RM{Number(b.amount).toFixed(0)}</span>
                <button
                  type="button"
                  aria-label="Remove budget"
                  onClick={() => onDelete(b.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-mech hover:!text-accent hover:bg-surface-raised"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
