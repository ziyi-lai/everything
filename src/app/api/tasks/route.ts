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

  const status = request.nextUrl.searchParams.get("status");
  const view = request.nextUrl.searchParams.get("view");

  let query = supabase
    .from("tasks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as never);

  if (view === "today") {
    const today = todayString();
    // due today or overdue — matches the client-side "Today" filter
    query = query.in("status", ["todo", "in_progress"]).lte("due_date", today);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tasks: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const insert: TablesInsert<"tasks"> = {
    user_id: user.id,
    title: body.title,
    description: body.description ?? null,
    status: body.status ?? "todo",
    priority: body.priority ?? "medium",
    domain: body.domain ?? "other",
    due_date: body.due_date ?? null,
    tags: body.tags ?? [],
    parent_id: body.parent_id ?? null,
  };

  const { data, error } = await supabase.from("tasks").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: data }, { status: 201 });
}
