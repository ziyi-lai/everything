"use client";

import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import type { Account } from "@/hooks/use-finance";

const ACCOUNT_TYPES = ["checking", "savings", "credit", "cash", "investment"] as const;

export function AccountsView({
  accounts,
  onCreate,
}: {
  accounts: Account[];
  onCreate: (input: { name: string; type: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ACCOUNT_TYPES)[number]>("checking");

  const netWorth = accounts.reduce((sum, a) => sum + Number(a.balance ?? 0), 0);

  function submit() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), type });
    setName("");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="label">NET WORTH</span>
        <span className="font-mono text-display-md text-hero">
          RM{netWorth.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </span>
      </div>

      {accounts.length === 0 ? (
        <EmptyState headline="No accounts yet" description="Add one below to start tracking balances." />
      ) : (
        <div className="flex flex-col">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-border py-3">
              <div>
                <p className="text-body text-foreground">{a.name}</p>
                <p className="label mt-0.5">{a.type}</p>
              </div>
              <span className="font-mono text-body text-foreground">
                RM{Number(a.balance ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Account name (e.g. Maybank Savings)"
          className="flex-1 border-0 border-b border-border-visible bg-transparent py-2 text-body text-foreground outline-none transition-mech focus:border-foreground placeholder:text-faint"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof ACCOUNT_TYPES)[number])}
          className="label rounded-full border border-border-visible bg-transparent px-4 py-2 text-foreground outline-none"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t} className="bg-surface text-foreground">
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim()}
          className="label rounded-full bg-hero px-6 py-2.5 text-black transition-mech hover:opacity-90 disabled:opacity-40"
        >
          ADD
        </button>
      </div>
    </div>
  );
}
