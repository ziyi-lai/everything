import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const update: TablesUpdate<"captures"> = {};
  if ("processed" in body) update.processed = body.processed;
  if ("converted_to_task_id" in body) update.converted_to_task_id = body.converted_to_task_id;
  if ("raw_text" in body) update.raw_text = body.raw_text;
  if ("parsed_title" in body) update.parsed_title = body.parsed_title;
  if ("parsed_tags" in body) update.parsed_tags = body.parsed_tags;
  if ("start_time" in body) update.start_time = body.start_time;
  if ("end_time" in body) update.end_time = body.end_time;
  if ("duration_seconds" in body) update.duration_seconds = body.duration_seconds;

  // Duration is derived, so never let an edit leave it contradicting the
  // times. If either end of the range moved and the caller didn't send an
  // explicit duration, recompute from the resulting range.
  const timesChanged = "start_time" in body || "end_time" in body;
  if (timesChanged && !("duration_seconds" in body)) {
    const { data: existing } = await supabase
      .from("captures")
      .select("start_time, end_time")
      .eq("id", id)
      .single();

    const start = update.start_time ?? existing?.start_time;
    const end = update.end_time ?? existing?.end_time;
    if (start && end) {
      const seconds = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
      if (seconds < 0) {
        return NextResponse.json({ error: "end_time must be after start_time" }, { status: 400 });
      }
      update.duration_seconds = seconds;
    }
  }

  const { data, error } = await supabase
    .from("captures")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ capture: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: existing } = await supabase.from("captures").select("audio_path").eq("id", id).single();
  if (existing?.audio_path) {
    await supabase.storage.from("voice-captures").remove([existing.audio_path]);
  }

  const { error } = await supabase.from("captures").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
