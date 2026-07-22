"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/supabase/types";
import type { FinanceReport } from "@/app/api/finance/report/route";
import type { TrendPoint } from "@/app/api/finance/trends/route";

export type Transaction = Tables<"transactions">;
export type Budget = Tables<"budgets">;
export type Account = Tables<"accounts">;

export function useTransactions(month?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function refetch() {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const res = await fetch(`/api/transactions?${params.toString()}`);
    const data = await res.json();
    setTransactions(data.transactions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true);
      refetch();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch closes over current month each render
  }, [month]);

  async function createTransaction(input: { amount: number; type: "income" | "expense"; category: string } & Record<string, unknown>) {
    const res = await fetch("/api/transactions", { method: "POST", body: JSON.stringify(input) });
    const data = await res.json();
    await refetch();
    return data.transaction as Transaction;
  }

  async function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    await refetch();
  }

  return { transactions, loading, refetch, createTransaction, deleteTransaction };
}

export function useBudgets(month?: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  async function refetch() {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    const res = await fetch(`/api/budgets?${params.toString()}`);
    const data = await res.json();
    setBudgets(data.budgets ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true);
      refetch();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch closes over current month each render
  }, [month]);

  async function setBudget(input: { category: string; amount: number; start_date?: string }) {
    await fetch("/api/budgets", { method: "POST", body: JSON.stringify(input) });
    await refetch();
  }

  async function deleteBudget(id: string) {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    await refetch();
  }

  return { budgets, loading, refetch, setBudget, deleteBudget };
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  async function refetch() {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(data.accounts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true);
      refetch();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  async function createAccount(input: { name: string } & Record<string, unknown>) {
    await fetch("/api/accounts", { method: "POST", body: JSON.stringify(input) });
    await refetch();
  }

  async function updateAccount(id: string, patch: Record<string, unknown>) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    await fetch(`/api/accounts/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await refetch();
  }

  return { accounts, loading, refetch, createAccount, updateAccount };
}

export function useFinanceReport(month: string) {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  async function refetch() {
    setLoading(true);
    const res = await fetch(`/api/finance/report?month=${month}`);
    setReport(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    const id = setTimeout(refetch, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch closes over current month each render
  }, [month]);

  return { report, loading, refetch };
}

export function useFinanceTrends(months: number) {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/finance/trends?months=${months}`);
      const data = await res.json();
      setTrends(data.trends ?? []);
      setLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }, [months]);

  return { trends, loading };
}
