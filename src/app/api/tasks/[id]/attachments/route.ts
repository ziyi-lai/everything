import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("task_attachments")
    .select("*")
    .eq("task_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ attachments: data });
}

// The file itself is uploaded straight to Storage from the browser (RLS
// scopes it to the user's own folder); this just records the metadata row
// once that upload succeeds.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.file_name || !body.file_path) {
    return NextResponse.json({ error: "file_name and file_path are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: id,
      user_id: user.id,
      file_name: body.file_name,
      file_path: body.file_path,
      file_size: body.file_size ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ attachment: data }, { status: 201 });
}
