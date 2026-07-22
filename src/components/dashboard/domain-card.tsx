import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function DomainCard({
  href,
  label,
  icon: Icon,
  metric,
  unit,
  description,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  metric: string | number;
  unit?: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-mech hover:border-border-visible"
    >
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <Icon
          size={18}
          strokeWidth={1.5}
          className="text-faint transition-mech group-hover:text-muted"
        />
      </div>

      <div className="mt-8 flex items-baseline gap-2">
        <span className="font-mono text-display-md text-hero transition-mech">{metric}</span>
        {unit && <span className="label !text-muted">{unit}</span>}
      </div>

      <p className="mt-3 text-body-sm text-faint">{description}</p>
    </Link>
  );
}
