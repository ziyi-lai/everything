"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign_in" | "sign_up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("pending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } =
      mode === "sign_in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    if (mode === "sign_up") {
      setStatus("success");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="dot-grid-subtle pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative w-full max-w-sm">
        <div className="mb-16 text-center">
          <h1 className="font-display text-display-lg text-hero transition-mech" style={{ letterSpacing: "-0.02em" }}>
            EVERYTHING
          </h1>
          <p className="label mt-4">PERSONAL OPERATING SYSTEM</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <Field
            label="EMAIL"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <Field
            label="PASSWORD"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
            required
          />

          {status === "error" && (
            <p className="label !text-accent">[ERROR] {errorMessage}</p>
          )}
          {status === "success" && (
            <p className="label !text-success">[CHECK YOUR EMAIL TO CONFIRM]</p>
          )}

          <button
            type="submit"
            disabled={status === "pending"}
            className="label mt-2 h-11 rounded-full bg-hero text-black transition-mech hover:opacity-90 disabled:opacity-40"
          >
            {status === "pending"
              ? "[WORKING...]"
              : mode === "sign_in"
                ? "SIGN IN"
                : "CREATE ACCOUNT"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign_in" ? "sign_up" : "sign_in");
            setStatus("idle");
            setErrorMessage("");
          }}
          className="label mx-auto mt-8 block !text-muted transition-mech hover:!text-foreground"
        >
          {mode === "sign_in" ? "NEW HERE? CREATE ACCOUNT" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="text-body border-0 border-b border-border-visible bg-transparent py-2 font-mono text-foreground outline-none transition-mech focus:border-foreground"
      />
    </label>
  );
}
