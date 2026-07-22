import { EmptyState } from "@/components/shared/empty-state";

export default function HealthPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="label">HEALTH</p>
        <h1 className="font-display text-display-md text-hero mt-1">TODAY</h1>
      </header>
      <EmptyState
        headline="Trinity scores land in Phase 4"
        description="Recovery, Strain, and Sleep — estimated from your own logs, coached in plain language."
      />
    </div>
  );
}
