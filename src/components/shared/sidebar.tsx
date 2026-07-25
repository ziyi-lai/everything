"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Zap,
  CheckSquare,
  Wallet,
  Activity,
  BookOpen,
  Command,
  Timer,
} from "lucide-react";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useCaptures } from "@/hooks/use-captures";
import { useTasks } from "@/hooks/use-tasks";

const NAV_ITEMS = [
  { href: "/", label: "DASHBOARD", icon: LayoutGrid },
  { href: "/capture", label: "CAPTURE", icon: Zap },
  { href: "/time", label: "TIME", icon: Timer },
  { href: "/tasks", label: "TASKS", icon: CheckSquare },
  { href: "/finance", label: "FINANCE", icon: Wallet },
  { href: "/health", label: "HEALTH", icon: Activity },
  { href: "/knowledge", label: "KNOWLEDGE", icon: BookOpen },
] as const;

export function Sidebar({ email }: { email: string | undefined }) {
  const pathname = usePathname();
  // unread-style counts — inbox items waiting to be triaged, tasks still open
  const inbox = useCaptures({ processed: false, is_timer: false });
  const { tasks } = useTasks();
  const openTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length;
  const NAV_BADGES: Record<string, number> = {
    "/capture": inbox.captures.length,
    "/tasks": openTasks,
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-border px-6 py-8">
      <Link href="/" className="mb-12 block">
        <span className="font-display text-heading text-hero" style={{ letterSpacing: "-0.01em" }}>
          EVERYTHING
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const badge = NAV_BADGES[href];
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-mech ${
                active ? "text-hero" : "text-faint hover:text-muted"
              }`}
            >
              {active && (
                <span className="absolute left-0 h-4 w-0.5 -translate-x-3 rounded-full bg-accent transition-mech" />
              )}
              <Icon size={18} strokeWidth={1.5} />
              <span className="label flex-1 !text-inherit">{label}</span>
              {!!badge && (
                <span className="label rounded-full bg-accent px-1.5 py-0.5 !text-hero">{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        className="label mb-6 flex items-center justify-between rounded-lg border border-border-visible px-3 py-2 text-muted transition-mech hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Command size={14} strokeWidth={1.5} />
          SEARCH
        </span>
        <span>⌘K</span>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
        <span className="label min-w-0 flex-1 truncate !text-faint">{email ?? "—"}</span>
        <ThemeToggle />
        <SignOutButton />
      </div>
    </aside>
  );
}
