import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { attachmentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: attachment } = await supabase
    .from("capture_attachments")
    .select("file_path")
    .eq("id", attachmentId)
    .single();

  if (attachment) {
    await supabase.storage.from("capture-attachments").remove([attachment.file_path]);
  }

  const { error } = await supabase.from("capture_attachments").delete().eq("id", attachmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
