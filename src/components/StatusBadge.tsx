import type { ProjectStatus } from "@/content/site";

const dot: Record<ProjectStatus, string> = {
  Live: "bg-text shadow-[0_0_10px_var(--glow-strong)]",
  "In development": "bg-muted",
  "Coming soon": "bg-muted/60",
  Concept: "border border-muted bg-transparent",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-bg/60 px-3 py-1 text-xs font-semibold text-text">
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} aria-hidden />
      {status}
    </span>
  );
}
