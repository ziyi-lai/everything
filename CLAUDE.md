@AGENTS.md

# Everything

Personal life-OS: Next.js 16 (App Router) + Supabase, single user (Ziyi). Five domains — Capture, Tasks, Time, Finance, Health (planned), Knowledge (planned). Full product spec, UX mockups, and DB schema live in [docs/EVERYTHING_SPEC.md](docs/EVERYTHING_SPEC.md) — read it before building a new domain or feature; this file only covers conventions.

## Design system: Nothing

This project follows the [nothing-design-skill](https://github.com/dominikmartn/nothing-design-skill) design language — black/white/red, OLED-dark by default, mechanical transitions, Space Grotesk/Space Mono/Doto type. Tokens live in [src/app/globals.css](src/app/globals.css).

**Invoke the `nothing-design` skill for any UI work** — new components, layout changes, styling decisions. It is already installed; call it explicitly rather than freehanding Tailwind classes, since the palette, spacing scale, and motion rules are non-obvious and defined there, not in Tailwind defaults.

## Stack

- Next.js 16 App Router, TypeScript strict, Tailwind CSS v4 (CSS-var-driven theme, see globals.css)
- Supabase (Postgres + Auth), client/server helpers in [src/lib/supabase/](src/lib/supabase/); `types.ts` is generated — regenerate after schema changes, don't hand-edit
- Data flow: route handlers under `src/app/api/**/route.ts` → `use-*.ts` hooks in [src/hooks/](src/hooks/) → page/components. Hooks manage their own local state and refetch via `window` CustomEvents (e.g. `everything:tasks-changed`) so multiple mounted instances stay in sync without a shared store — follow this pattern rather than introducing a global state library
- `Hermes` (localhost:8642) is a local LLM proxy for optional AI features (summarize/decompose/insight/coach). Never put it on a critical path — NLP date/tag parsing in [src/lib/nlp-parser.ts](src/lib/nlp-parser.ts) uses `chrono-node` locally instead, on purpose. Its API contract is still unconfirmed (see spec §Hermes)

## Conventions

- `@/*` path alias → `src/*`
- Route handlers and hooks are paired 1:1 per resource (`api/tasks` ↔ `use-tasks.ts`)
- Read this repo's own code for a pattern before introducing a new one — this is a small, single-author app; consistency with existing files beats "correct" abstractions
- `// ponytail:` comments mark deliberate shortcuts with a named upgrade path (e.g. the transaction-balance trigger not handling UPDATEs) — check for one before "fixing" something that looks incomplete
