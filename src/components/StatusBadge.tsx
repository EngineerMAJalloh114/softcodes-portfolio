import type { ProjectStatus } from "@/content/site";

const dot: Record<ProjectStatus, string> = {
  Live: "bg-mist shadow-[0_0_10px_rgba(199,208,217,0.8)]",
  "In development": "bg-mist/70",
  "Coming soon": "bg-dusk",
  Concept: "border border-dusk bg-transparent",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate bg-void/60 px-3 py-1 text-xs font-semibold text-mist">
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} aria-hidden />
      {status}
    </span>
  );
}
