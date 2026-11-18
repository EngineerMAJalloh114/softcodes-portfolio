import Link from "next/link";
import type { Project } from "@/content/site";
import { StatusBadge } from "./StatusBadge";
import { ArrowRight } from "./Icons";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="glow group flex h-full flex-col rounded-2xl border border-border bg-surface p-7 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {project.kind}
        </span>
        <StatusBadge status={project.status} />
      </div>
      <h3 className="mt-8 text-2xl font-extrabold tracking-tight text-text">{project.name}</h3>
      <p className="mt-2 font-semibold text-text/90">{project.tagline}</p>
      <p className="mt-4 flex-1 leading-relaxed text-muted">{project.summary}</p>
      <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-text">
        View case study
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
