"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Attachment = Tables<"capture_attachments">;

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function CaptureAttachments({ captureId }: { captureId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refetch() {
    const res = await fetch(`/api/captures/${captureId}/attachments`);
    const data = await res.json();
    const list: Attachment[] = data.attachments ?? [];
    setAttachments(list);

    // signed URLs since the bucket is private
    const supabase = createClient();
    const entries = await Promise.all(
      list.map(async (a) => {
        const { data: signed } = await supabase.storage
          .from("capture-attachments")
          .createSignedUrl(a.file_path, 3600);
        return [a.id, signed?.signedUrl ?? ""] as const;
      })
    );
    setUrls(Object.fromEntries(entries));
  }

  useEffect(() => {
    // deferred via setTimeout rather than called synchronously in the effect body
    const id = setTimeout(refetch, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- captureId only
  }, [captureId]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const path = `${user.id}/${captureId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("capture-attachments").upload(path, file);
      if (uploadError) return;

      await fetch(`/api/captures/${captureId}/attachments`, {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, file_path: path, file_size: file.size }),
      });
      await refetch();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachmentId: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    await fetch(`/api/captures/${captureId}/attachments/${attachmentId}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <Paperclip size={12} strokeWidth={1.5} className="shrink-0 text-faint" />
              <a
                href={urls[a.id] || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-body-sm text-foreground transition-mech hover:!text-interactive"
              >
                {a.file_name}
              </a>
              <span className="label !text-faint">{formatSize(a.file_size)}</span>
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => handleDelete(a.id)}
                className="shrink-0 text-faint transition-mech hover:!text-accent"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="label flex items-center gap-1.5 self-start !text-faint transition-mech hover:!text-muted disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 size={11} strokeWidth={1.5} className="animate-spin" />
        ) : (
          <Paperclip size={11} strokeWidth={1.5} />
        )}
        {uploading ? "UPLOADING..." : "ATTACH FILE"}
      </button>
    </div>
  );
}
