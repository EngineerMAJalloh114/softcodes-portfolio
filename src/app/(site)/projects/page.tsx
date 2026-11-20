import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/admin/ui";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/Section";
import { getSiteContent } from "@/lib/content/load";
import { PROJECT_TYPE_OPTIONS } from "@/lib/content/options";
import { applyProjectFilters, filterOptions, parseProjectFilters, projectsHref } from "@/lib/content/project-filters";

export async function generateMetadata({ searchParams }: PageProps<"/projects">): Promise<Metadata> {
  const { pages, projects } = await getSiteContent();
  const f = parseProjectFilters(await searchParams, projects);
  const typeLabel = PROJECT_TYPE_OPTIONS.find((o) => o.value === f.type)?.label;
  const title = [typeLabel, f.tag, pages.projects.title].filter(Boolean).join(" · ");
  return {
    title,
    description: pages.projects.description,
    // Filtered views point search engines at the main list.
    alternates: { canonical: "/projects" },
    openGraph: { title, description: pages.projects.description, url: projectsHref(f) },
  };
}

/** A-05 portfolio with M-11 filters (?type=, ?tag=): plain links, works without JavaScript. */
export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const { pages, projects, projectsSection } = await getSiteContent();
  const t = pages.projects;
  const f = parseProjectFilters(await searchParams, projects);
  const { types, tags } = filterOptions(projects);
  const shown = applyProjectFilters(projects, f);
  const label = (v: string) => PROJECT_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "border-text bg-btn-bg text-btn-fg" : "border-border text-muted hover:text-text"
    }`;

  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>{projectsSection.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">{t.heading}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{t.intro}</p>
        </Reveal>

        <div className="mt-10 space-y-4" data-project-filters>
          {types.length > 1 && (
            <nav aria-label={t.typeFilterLabel} className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.typeFilterLabel}</span>
              <Link href={projectsHref({ tag: f.tag })} className={chip(!f.type)} aria-current={!f.type ? "page" : undefined}>
                {t.allLabel}
              </Link>
              {types.map((ty) => (
                <Link key={ty} href={projectsHref({ type: ty, tag: f.tag })} className={chip(f.type === ty)} aria-current={f.type === ty ? "page" : undefined} data-filter-type={ty}>
                  {label(ty)}
                </Link>
              ))}
            </nav>
          )}
          {tags.length > 0 && (
            <nav aria-label={t.tagFilterLabel} className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.tagFilterLabel}</span>
              <Link href={projectsHref({ type: f.type })} className={chip(!f.tag)} aria-current={!f.tag ? "page" : undefined}>
                {t.allLabel}
              </Link>
              {tags.map((tag) => (
                <Link key={tag} href={projectsHref({ type: f.type, tag })} className={chip(f.tag === tag)} aria-current={f.tag === tag ? "page" : undefined} data-filter-tag={tag}>
                  {tag}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-surface" data-projects-empty>
            <EmptyState
              title={t.emptyHeading}
              body={
                <>
                  {t.emptyBody}{" "}
                  <Link href="/projects" className="font-semibold text-text underline">
                    {t.clearLabel}
                  </Link>
                </>
              }
            />
          </div>
        ) : (
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 3) * 100}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
