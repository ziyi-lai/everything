import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { monthString } from "@/lib/date";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const month = request.nextUrl.searchParams.get("month"); // "YYYY-MM"
  let query = supabase.from("budgets").select("*");
  if (month) query = query.eq("start_date", `${month}-01`).eq("period", "monthly");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budgets: data });
}

// Upsert — setting a budget for a category the user already budgeted this
// month should update it, not create a duplicate row (unique constraint on
// user_id, category, period, start_date).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.category || body.amount === undefined) {
    return NextResponse.json({ error: "category and amount are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        category: body.category,
        amount: body.amount,
        period: body.period ?? "monthly",
        start_date: body.start_date ?? `${monthString()}-01`,
      },
      { onConflict: "user_id,category,period,start_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budget: data }, { status: 201 });
}
