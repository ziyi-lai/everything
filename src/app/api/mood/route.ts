import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  let query = supabase.from("mood_entries").select("*").order("recorded_at", { ascending: false });
  if (from) query = query.gte("recorded_at", from);
  if (to) query = query.lte("recorded_at", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entries: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const score: number | undefined = body.score;
  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: "score must be between 1 and 5" }, { status: 400 });
  }

  const insert: TablesInsert<"mood_entries"> = {
    user_id: user.id,
    score,
    note: body.note ?? null,
  };
  // omitted entirely (not just null) so the DB's now() default applies
  if (body.recorded_at) insert.recorded_at = body.recorded_at;

  const { data, error } = await supabase.from("mood_entries").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
