import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";

const PATCHABLE_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "domain",
  "due_date",
  "estimated_minutes",
  "energy_required",
  "recurrence_rule",
  "tags",
  "sort_order",
] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const update: TablesUpdate<"tasks"> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) (update as Record<string, unknown>)[field] = body[field];
  }
  if (update.status === "done" && !("completed_at" in body)) {
    update.completed_at = new Date().toISOString();
  }
  if (update.status && update.status !== "done") {
    update.completed_at = null;
  }

  const { data, error } = await supabase.from("tasks").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
