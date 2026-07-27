"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Paperclip, X, Loader2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadAttachment, ATTACHMENTS_CHANGED_EVENT } from "@/lib/attachments";

type AttachmentRow = { id: string; file_name: string; file_path: string; file_size: number | null };

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export type AttachmentManagerHandle = {
  open: () => void;
  uploadFile: (file: File) => Promise<void>;
};

export const AttachmentManager = forwardRef<
  AttachmentManagerHandle,
  { bucket: string; apiBase: string; folder: string; hideDefaultTrigger?: boolean }
>(function AttachmentManager({ bucket, apiBase, folder, hideDefaultTrigger }, ref) {
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refetch() {
    const res = await fetch(apiBase);
    const data = await res.json();
    const list: AttachmentRow[] = data.attachments ?? [];
    setAttachments(list);

    // signed URLs since the bucket is private
    const supabase = createClient();
    const entries = await Promise.all(
      list.map(async (a) => {
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(a.file_path, 3600);
        return [a.id, signed?.signedUrl ?? ""] as const;
      })
    );
    setUrls(Object.fromEntries(entries));
  }

  useEffect(() => {
    // deferred via setTimeout rather than called synchronously in the effect body
    const id = setTimeout(refetch, 0);

    function onChanged(e: Event) {
      if ((e as CustomEvent).detail?.apiBase === apiBase) refetch();
    }
    window.addEventListener(ATTACHMENTS_CHANGED_EVENT, onChanged);

    return () => {
      clearTimeout(id);
      window.removeEventListener(ATTACHMENTS_CHANGED_EVENT, onChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apiBase only
  }, [apiBase]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      await uploadAttachment({ bucket, apiBase, folder, file });
      await refetch();
    } finally {
      setUploading(false);
    }
  }

  useImperativeHandle(ref, () => ({
    open: () => fileInputRef.current?.click(),
    uploadFile: handleUpload,
  }));

  async function handleDelete(attachmentId: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    await fetch(`${apiBase}/${attachmentId}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {attachments.map((a) => (
            <AttachmentItem key={a.id} attachment={a} url={urls[a.id]} onDelete={() => handleDelete(a.id)} />
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
      {!hideDefaultTrigger && (
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
      )}
    </div>
  );
});

function AttachmentItem({
  attachment,
  url,
  onDelete,
}: {
  attachment: AttachmentRow;
  url?: string;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isImage = IMAGE_EXT.test(attachment.file_name);

  return (
    <div
      className="relative flex items-center gap-2 rounded-lg border border-border px-3 py-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Paperclip size={12} strokeWidth={1.5} className="shrink-0 text-faint" />
      <a
        href={url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-body-sm text-foreground transition-mech hover:!text-interactive"
      >
        {attachment.file_name}
      </a>
      <span className="label !text-faint">{formatSize(attachment.file_size)}</span>
      <button
        type="button"
        aria-label="Remove attachment"
        onClick={onDelete}
        className="shrink-0 text-faint transition-mech hover:!text-accent"
      >
        <X size={12} strokeWidth={2} />
      </button>

      {hovered && url && (
        <div className="absolute bottom-full left-0 z-50 mb-2 flex flex-col gap-1 rounded-lg border border-border-visible bg-surface p-2">
          {isImage ? (
            <img src={url} alt={attachment.file_name} className="max-h-48 w-56 rounded object-contain" />
          ) : (
            <div className="flex h-24 w-56 flex-col items-center justify-center gap-1.5 text-faint">
              <FileText size={24} strokeWidth={1.5} />
              <span className="label !text-faint">NO PREVIEW</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
