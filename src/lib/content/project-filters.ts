/**
 * Project filters (M-11): /projects?type=website&tag=Payments. Plain links, so filtering
 * works without JavaScript; unknown values are ignored. Pure module.
 */
import { PROJECT_TYPES, type ProjectType } from "@/content/site";

type Filterable = { type: string; tags: string[] };
export type ProjectFilters = { type: ProjectType | null; tag: string | null };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

/** Types and tags actually used by the given (visible) projects, in a stable order. */
export function filterOptions(projects: Filterable[]) {
  const types = PROJECT_TYPES.filter((t) => projects.some((p) => p.type === t));
  const tags = [...new Set(projects.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b));
  return { types, tags };
}

export function parseProjectFilters(params: Record<string, string | string[] | undefined>, projects: Filterable[]): ProjectFilters {
  const { types, tags } = filterOptions(projects);
  const type = one(params.type);
  const tag = one(params.tag);
  return {
    type: (types as readonly string[]).includes(type) ? (type as ProjectType) : null,
    // Tags match case-insensitively but resolve to the stored spelling.
    tag: tags.find((t) => t.toLowerCase() === tag.toLowerCase()) ?? null,
  };
}

export function applyProjectFilters<T extends Filterable>(projects: T[], f: ProjectFilters): T[] {
  return projects.filter((p) => (!f.type || p.type === f.type) && (!f.tag || p.tags.includes(f.tag)));
}

export function projectsHref(f: Partial<ProjectFilters>): string {
  const q = new URLSearchParams();
  if (f.type) q.set("type", f.type);
  if (f.tag) q.set("tag", f.tag);
  const s = q.toString();
  return `/projects${s ? `?${s}` : ""}`;
}
