"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutGrid,
  Zap,
  CheckSquare,
  Wallet,
  Activity,
  BookOpen,
  Search,
  Loader2,
  Terminal,
  SunMoon,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";
import { toggleTheme } from "@/lib/theme";

// `> create task "xxx"` — the only slash-style command wired up so far.
// More (start timer, log weight, new note) land alongside their own domains.
function parseCreateTaskCommand(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed.startsWith(">")) return null;
  const body = trimmed.slice(1).trim();
  const match = body.match(/^create task\s+(.*)$/i);
  if (!match) return null;
  return match[1].trim().replace(/^["“](.*)["”]$/, "$1").trim();
}

const DESTINATIONS = [
  { href: "/", label: "Go to Dashboard", icon: LayoutGrid },
  { href: "/capture", label: "Go to Capture", icon: Zap },
  { href: "/time", label: "Go to Time", icon: Timer },
  { href: "/tasks", label: "Go to Tasks", icon: CheckSquare },
  { href: "/finance", label: "Go to Finance", icon: Wallet },
  { href: "/health", label: "Go to Health", icon: Activity },
  { href: "/knowledge", label: "Go to Knowledge", icon: BookOpen },
] as const;

const DOMAIN_ICON: Record<SearchResult["domain"], LucideIcon> = {
  tasks: CheckSquare,
  captures: Zap,
  time: Timer,
  notes: BookOpen,
  transactions: Wallet,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    // nothing to reset here — the render below already hides stale results
    // once the query is empty, so no setState is needed on this branch
    if (!q || q.startsWith(">")) return;
    const id = ++requestId.current;
    // deferred via setTimeout rather than called synchronously in the effect body
    const startLoading = setTimeout(() => setLoading(true), 0);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data: { results: SearchResult[] } = await res.json();
        if (id === requestId.current) setResults(data.results);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(startLoading);
      clearTimeout(timer);
    };
  }, [query, open]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  async function createTask(title: string) {
    if (!title) return;
    setOpen(false);
    setQuery("");
    await fetch("/api/tasks", { method: "POST", body: JSON.stringify({ title }) });
    router.push("/tasks");
    router.refresh();
  }

  const createTaskTitle = parseCreateTaskCommand(query);
  const hasQuery = query.trim().length > 0 && createTaskTitle === null;
  const showThemeCommand =
    createTaskTitle === null && "toggle theme".includes(query.trim().replace(/^>\s*/, "").toLowerCase());
  const filteredDestinations = DESTINATIONS.filter((d) =>
    d.label.toLowerCase().includes(query.trim().toLowerCase())
  );
  const visibleResults = hasQuery ? results : [];
  const isLoading = hasQuery && loading;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
      label="Global command palette"
      className="fixed inset-0 z-50"
      shouldFilter={false}
    >
      <div
        className="fixed inset-0 transition-mech"
        style={{ background: "rgba(0,0,0,0.8)" }}
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-1/2 top-32 z-10 w-full max-w-[480px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border-visible bg-surface transition-mech">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={16} strokeWidth={1.5} className="text-faint" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Type a command or search…"
            className="w-full bg-transparent font-mono text-body-sm text-foreground outline-none placeholder:text-faint"
          />
          {isLoading ? (
            <Loader2 size={14} strokeWidth={1.5} className="animate-spin text-faint" />
          ) : (
            <kbd className="label !text-faint">ESC</kbd>
          )}
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          {createTaskTitle !== null && createTaskTitle.length === 0 && (
            <Command.Empty className="label px-3 py-6 text-center !text-faint">
              TYPE A TASK TITLE
            </Command.Empty>
          )}

          {createTaskTitle && (
            <Command.Group
              heading="COMMAND"
              className="[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:!text-faint"
            >
              <Command.Item
                value={`create-task-${createTaskTitle}`}
                onSelect={() => createTask(createTaskTitle)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm text-foreground transition-mech data-[selected=true]:bg-surface-raised"
              >
                <Terminal size={16} strokeWidth={1.5} className="text-muted" />
                Create task &ldquo;{createTaskTitle}&rdquo;
              </Command.Item>
            </Command.Group>
          )}

          {createTaskTitle === null &&
            !showThemeCommand &&
            filteredDestinations.length === 0 &&
            visibleResults.length === 0 &&
            !isLoading && (
            <Command.Empty className="label px-3 py-6 text-center !text-faint">
              NO RESULTS
            </Command.Empty>
          )}

          {showThemeCommand && (
            <Command.Group
              heading="COMMAND"
              className="[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:!text-faint"
            >
              <Command.Item
                value="toggle-theme"
                onSelect={() => {
                  toggleTheme();
                  setOpen(false);
                  setQuery("");
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm text-foreground transition-mech data-[selected=true]:bg-surface-raised"
              >
                <SunMoon size={16} strokeWidth={1.5} className="text-muted" />
                Toggle theme
              </Command.Item>
            </Command.Group>
          )}

          {createTaskTitle === null && filteredDestinations.length > 0 && (
            <Command.Group
              heading="NAVIGATE"
              className="[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:!text-faint"
            >
              {filteredDestinations.map(({ href, label, icon: Icon }) => (
                <Command.Item
                  key={href}
                  value={label}
                  onSelect={() => go(href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm text-foreground transition-mech data-[selected=true]:bg-surface-raised"
                >
                  <Icon size={16} strokeWidth={1.5} className="text-muted" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {visibleResults.length > 0 && (
            <Command.Group
              heading="RESULTS"
              className="[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:!text-faint"
            >
              {visibleResults.map((r) => {
                const Icon = DOMAIN_ICON[r.domain];
                return (
                  <Command.Item
                    key={`${r.domain}-${r.id}`}
                    value={`${r.domain}-${r.id}`}
                    onSelect={() => go(r.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm text-foreground transition-mech data-[selected=true]:bg-surface-raised"
                  >
                    <Icon size={16} strokeWidth={1.5} className="text-muted" />
                    <span className="truncate">{r.title}</span>
                    <span className="label ml-auto !text-faint">{r.domain}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
