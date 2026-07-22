import { EmptyState } from "@/components/shared/empty-state";

export default function KnowledgePage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="label">KNOWLEDGE</p>
        <h1 className="font-display text-display-md text-hero mt-1">DAILY NOTE</h1>
      </header>
      <EmptyState
        headline="Daily notes land in Phase 5"
        description="Obsidian-style [[wiki links]], backlinks, and a local graph."
      />
    </div>
  );
}
