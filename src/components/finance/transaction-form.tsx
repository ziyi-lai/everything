"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";

export function TransactionForm({
  onSubmit,
}: {
  onSubmit: (input: {
    amount: number;
    type: "income" | "expense";
    category: string;
    description?: string;
  }) => Promise<unknown>;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  async function save() {
    const value = Number(amount);
    if (!value || value <= 0 || !category || saving) return;
    setSaving(true);
    try {
      await onSubmit({ amount: value, type, category, description: description.trim() || undefined });
      setAmount("");
      setDescription("");
      setCategory(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 border-b border-border pb-8">
      <div className="flex items-center gap-1 rounded-full border border-border-visible p-1 w-fit">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory(null);
            }}
            className={`label rounded-full px-4 py-2 transition-mech ${
              type === t ? (t === "expense" ? "bg-accent !text-hero" : "bg-success !text-black") : "!text-muted hover:!text-foreground"
            }`}
          >
            {t === "expense" ? "EXPENSE" : "INCOME"}
          </button>
        ))}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-display-lg text-faint">RM</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="0.00"
          inputMode="decimal"
          className="w-full min-w-0 bg-transparent font-mono text-display-lg text-hero outline-none placeholder:text-faint"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setCategory(c.name)}
            className={`label flex items-center gap-1.5 rounded-full border px-3 py-2 transition-mech ${
              category === c.name
                ? "border-hero !text-hero"
                : "border-border-visible !text-muted hover:!text-foreground"
            }`}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Note (optional)"
          className="flex-1 border-0 border-b border-border-visible bg-transparent py-2 text-body text-foreground outline-none transition-mech focus:border-foreground placeholder:text-faint"
        />
        <button
          type="button"
          onClick={save}
          disabled={!amount || !category || saving}
          className="label h-11 shrink-0 rounded-full bg-hero px-6 text-black transition-mech hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "[SAVING...]" : "SAVE"}
        </button>
      </div>
    </div>
  );
}
