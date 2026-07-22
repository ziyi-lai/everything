"use client";

import { Sun, Moon } from "lucide-react";
import { toggleTheme } from "@/lib/theme";

// Which icon shows is decided by CSS (the `light:` variant), not React state.
// The inline script in the root layout sets the theme class before first
// paint, so any state-based version would hydrate with the wrong value.
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light and dark mode"
      title="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-mech hover:bg-surface-raised hover:text-foreground"
    >
      <Moon size={16} strokeWidth={1.5} className="light:hidden" />
      <Sun size={16} strokeWidth={1.5} className="hidden light:block" />
    </button>
  );
}
