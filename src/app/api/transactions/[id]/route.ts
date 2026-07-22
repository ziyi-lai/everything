import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";

// Only non-monetary fields are patchable here — the DB trigger that keeps
// accounts.balance in sync only fires on INSERT/DELETE (see migration
// comment), so changing amount/type/account through PATCH would silently
// desync the account balance. Delete + re-create instead if the amount changes.
const PATCHABLE_FIELDS = ["category", "description", "transaction_date"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const update: TablesUpdate<"transactions"> = {};
  for (const field of PATCHABLE_FIELDS) {
    if (field in body) (update as Record<string, unknown>)[field] = body[field];
  }

  const { data, error } = await supabase.from("transactions").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transaction: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
