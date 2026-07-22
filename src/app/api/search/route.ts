import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  domain: "tasks" | "captures" | "time" | "notes" | "transactions";
  id: string;
  title: string;
  href: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const like = `%${q}%`;

  const [tasks, captures, notes, transactions] = await Promise.all([
    supabase.from("tasks").select("id, title").ilike("title", like).limit(5),
    supabase.from("captures").select("id, raw_text, is_timer").ilike("raw_text", like).limit(5),
    supabase.from("notes").select("id, title").ilike("title", like).limit(5),
    supabase.from("transactions").select("id, description, category").ilike("description", like).limit(5),
  ]);

  const results: SearchResult[] = [
    ...(tasks.data ?? []).map((t) => ({
      domain: "tasks" as const,
      id: t.id,
      title: t.title,
      href: `/tasks?open=${t.id}`,
    })),
    // timer sessions and typed notes share a table but are now separate
    // modules, so they have to resolve to different routes
    ...(captures.data ?? []).map((c) =>
      c.is_timer
        ? { domain: "time" as const, id: c.id, title: c.raw_text.slice(0, 80), href: `/time?open=${c.id}` }
        : { domain: "captures" as const, id: c.id, title: c.raw_text.slice(0, 80), href: `/capture?open=${c.id}` }
    ),
    ...(notes.data ?? []).map((n) => ({
      domain: "notes" as const,
      id: n.id,
      title: n.title,
      href: `/knowledge/${n.id}`,
    })),
    ...(transactions.data ?? []).map((t) => ({
      domain: "transactions" as const,
      id: t.id,
      title: t.description ?? t.category,
      href: `/finance?open=${t.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
