import { createClient } from "@/lib/supabase/client";

export const ATTACHMENTS_CHANGED_EVENT = "everything:attachments-changed";

export async function uploadAttachment({
  bucket,
  apiBase,
  folder,
  file,
}: {
  bucket: string;
  apiBase: string;
  folder: string;
  file: File;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const path = `${user.id}/${folder}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) return;

  await fetch(apiBase, {
    method: "POST",
    body: JSON.stringify({ file_name: file.name, file_path: path, file_size: file.size }),
  });

  // an AttachmentManager for this record may have already mounted and fetched
  // before this upload resolved (e.g. capture creation + attachment upload
  // race) — nudge every instance watching this apiBase to refetch
  window.dispatchEvent(new CustomEvent(ATTACHMENTS_CHANGED_EVENT, { detail: { apiBase } }));
}
