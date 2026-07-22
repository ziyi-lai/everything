export function EmptyState({ headline, description }: { headline: string; description: string }) {
  return (
    <div className="dot-grid-subtle flex flex-col items-center justify-center gap-2 rounded-2xl py-24 text-center">
      <p className="text-subheading text-muted">{headline}</p>
      <p className="text-body-sm text-faint">{description}</p>
    </div>
  );
}
