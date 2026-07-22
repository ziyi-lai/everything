"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TransactionForm } from "@/components/finance/transaction-form";
import { MonthlyDashboard } from "@/components/finance/monthly-dashboard";
import { BudgetSettings } from "@/components/finance/budget-settings";
import { AccountsView } from "@/components/finance/accounts-view";
import { TrendChart } from "@/components/finance/trend-chart";
import { useTransactions, useBudgets, useAccounts, useFinanceReport } from "@/hooks/use-finance";
import { monthString } from "@/lib/date";

const TABS = ["OVERVIEW", "BUDGETS", "ACCOUNTS", "TRENDS"] as const;
type Tab = (typeof TABS)[number];

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("OVERVIEW");
  const [month, setMonth] = useState(() => monthString());

  const { createTransaction } = useTransactions(month);
  const { budgets, setBudget, deleteBudget } = useBudgets(month);
  const { accounts, createAccount } = useAccounts();
  const { report, loading, refetch: refetchReport } = useFinanceReport(month);

  // the report is a separate fetch (income/expense totals, category rollup,
  // and budget-vs-spent — all computed server-side) from the raw
  // transactions/budgets lists, so it doesn't know either changed until told
  // to refetch
  async function handleCreateTransaction(input: Parameters<typeof createTransaction>[0]) {
    const transaction = await createTransaction(input);
    await refetchReport();
    return transaction;
  }

  async function handleSetBudget(input: Parameters<typeof setBudget>[0]) {
    await setBudget(input);
    await refetchReport();
  }

  async function handleDeleteBudget(id: string) {
    await deleteBudget(id);
    await refetchReport();
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-mech hover:text-foreground"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <h1 className="font-display text-display-md text-hero">{formatMonthLabel(month)}</h1>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-mech hover:text-foreground"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
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
      </header>

      <TransactionForm onSubmit={handleCreateTransaction} />

      {tab === "OVERVIEW" &&
        (loading || !report ? (
          <p className="label">[LOADING...]</p>
        ) : (
          <MonthlyDashboard report={report} />
        ))}

      {tab === "BUDGETS" && (
        <BudgetSettings budgets={budgets} onSet={handleSetBudget} onDelete={handleDeleteBudget} />
      )}

      {tab === "ACCOUNTS" && <AccountsView accounts={accounts} onCreate={createAccount} />}

      {tab === "TRENDS" && <TrendChart />}
    </div>
  );
}
