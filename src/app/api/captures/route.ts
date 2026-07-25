import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCapture } from "@/lib/nlp-parser";
import type { TablesInsert } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const processed = request.nextUrl.searchParams.get("processed");
  const isTimer = request.nextUrl.searchParams.get("is_timer");

  let query = supabase.from("captures").select("*").order("created_at", { ascending: false });
  if (processed !== null) query = query.eq("processed", processed === "true");
  if (isTimer !== null) query = query.eq("is_timer", isTimer === "true");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ captures: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const rawText: string | undefined = body.raw_text;
  if (!rawText || !rawText.trim()) {
    return NextResponse.json({ error: "raw_text is required" }, { status: 400 });
  }

  const insert: TablesInsert<"captures"> = {
    user_id: user.id,
    raw_text: rawText,
    source: body.source ?? "text",
    audio_path: body.audio_path ?? null,
  };

  if (body.is_timer) {
    insert.is_timer = true;
    insert.start_time = body.start_time ?? new Date().toISOString();
    insert.end_time = body.end_time ?? null;
    insert.duration_seconds = body.duration_seconds ?? null;
    insert.parsed_title = rawText.trim();
  } else {
    const parsed = parseCapture(rawText);
    insert.parsed_title = parsed.title || null;
    insert.parsed_tags = parsed.tags;
    insert.parsed_due = parsed.due ? parsed.due.toISOString() : null;
  }

  const { data, error } = await supabase.from("captures").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ capture: data }, { status: 201 });
}
