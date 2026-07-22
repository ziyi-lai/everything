import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayString } from "@/lib/date";
import type { TablesInsert } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const month = request.nextUrl.searchParams.get("month"); // "YYYY-MM"
  let query = supabase.from("transactions").select("*").order("transaction_date", { ascending: false });

  if (month) {
    const start = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1)).toISOString().slice(0, 10);
    query = query.gte("transaction_date", start).lt("transaction_date", end);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transactions: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.amount || !body.category || !body.type) {
    return NextResponse.json({ error: "amount, type, and category are required" }, { status: 400 });
  }

  const insert: TablesInsert<"transactions"> = {
    user_id: user.id,
    type: body.type,
    amount: body.amount,
    category: body.category,
    description: body.description ?? null,
    account_id: body.account_id ?? null,
    transaction_date: body.transaction_date ?? todayString(),
  };

  const { data, error } = await supabase.from("transactions").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transaction: data }, { status: 201 });
}
