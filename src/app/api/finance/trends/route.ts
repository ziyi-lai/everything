import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { monthString } from "@/lib/date";

export type TrendPoint = { month: string; income: number; expense: number };

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const months = Math.min(24, Math.max(1, Number(request.nextUrl.searchParams.get("months") ?? 6)));
  // anchor on the current month in APP_TIMEZONE, then step back in pure
  // calendar arithmetic (UTC here is just a stable integer clock, not a zone)
  const [curY, curM] = monthString().split("-").map(Number);
  const startMonth = new Date(Date.UTC(curY, curM - 1 - (months - 1), 1));
  const start = startMonth.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .gte("transaction_date", start);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const buckets = new Map<string, TrendPoint>();
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1));
    const key = d.toISOString().slice(0, 7);
    buckets.set(key, { month: key, income: 0, expense: 0 });
  }

  for (const t of data ?? []) {
    const key = t.transaction_date.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
  }

  return NextResponse.json({ trends: [...buckets.values()] });
}
