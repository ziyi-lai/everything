"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function formatElapsedShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Records via the browser's native MediaRecorder — no transcription, just
 * capture-then-play, matching the zero-friction philosophy of typed capture. */
export function VoiceRecordButton({ onRecorded }: { onRecorded: (audioPath: string) => void | Promise<void> }) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void upload(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      setRecording(true);
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      // mic permission denied or unavailable — nothing to record
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
  }

  async function upload(blob: Blob) {
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const path = `${user.id}/${crypto.randomUUID()}.webm`;
      const { error } = await supabase.storage.from("voice-captures").upload(path, blob);
      if (error) return;
      await onRecorded(path);
    } finally {
      setUploading(false);
    }
  }

  if (recording) {
    return (
      <button
        type="button"
        onClick={stop}
        aria-label="Stop recording"
        className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-accent px-3 text-hero transition-mech hover:opacity-90"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hero opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-hero" />
        </span>
        <span className="font-mono text-caption tabular-nums">{formatElapsedShort(elapsed)}</span>
        <Square size={10} strokeWidth={0} fill="currentColor" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      disabled={uploading}
      aria-label="Record voice capture"
      title="Record a voice capture"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-faint transition-mech hover:text-foreground disabled:opacity-40"
    >
      <Mic size={15} strokeWidth={1.5} />
    </button>
  );
}
