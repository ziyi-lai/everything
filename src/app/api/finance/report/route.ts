import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { monthString } from "@/lib/date";

export type FinanceReport = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  categories: { category: string; amount: number; percent: number }[];
  budgets: { category: string; budgeted: number; spent: number }[];
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const month = request.nextUrl.searchParams.get("month") ?? monthString();
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1)).toISOString().slice(0, 10);

  const [txResult, budgetResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, category")
      .gte("transaction_date", start)
      .lt("transaction_date", end),
    supabase.from("budgets").select("category, amount").eq("start_date", start).eq("period", "monthly"),
  ]);

  if (txResult.error) return NextResponse.json({ error: txResult.error.message }, { status: 400 });

  const transactions = txResult.data ?? [];
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Number(t.amount));
  }
  const categories = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount, percent: expense > 0 ? (amount / expense) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const budgetMap = new Map((budgetResult.data ?? []).map((b) => [b.category, Number(b.amount)]));
  const allBudgetCategories = new Set([...budgetMap.keys(), ...byCategory.keys()]);
  const budgets = [...allBudgetCategories]
    .filter((c) => budgetMap.has(c))
    .map((category) => ({
      category,
      budgeted: budgetMap.get(category) ?? 0,
      spent: byCategory.get(category) ?? 0,
    }));

  const report: FinanceReport = {
    month,
    income,
    expense,
    balance: income - expense,
    categories,
    budgets,
  };
  return NextResponse.json(report);
}
