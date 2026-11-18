import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { Container } from "@/components/Section";
import { StatusBadge } from "@/components/StatusBadge";
import { getProject, pages, projects } from "@/content/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const description = `${project.summary} ${project.tagline}`;
  return {
    title: project.name,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { title: project.name, description, url: `/projects/${project.slug}` },
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const t = pages.caseStudy;

  return (
    <article className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container>
        <Reveal>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text"
          >
            <ArrowLeft />
            {t.back}
          </Link>
        </Reveal>

        <Reveal delay={100} className="mt-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={project.status} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {project.kind}
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">
            {project.name}
          </h1>
          <p className="mt-5 text-xl font-semibold text-text/90 sm:text-2xl">{project.tagline}</p>
          <p className="mt-4 text-lg leading-relaxed text-muted">{project.summary}</p>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-14">
            <Reveal as="section">
              <h2 className="text-2xl font-extrabold tracking-tight text-text">{t.problem}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">{project.problem}</p>
            </Reveal>
            <Reveal as="section">
              <h2 className="text-2xl font-extrabold tracking-tight text-text">{t.solution}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">{project.solution}</p>
            </Reveal>
            <Reveal as="section">
              <h2 className="text-2xl font-extrabold tracking-tight text-text">{t.features}</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li
                    key={f}
                    className="rounded-2xl border border-border bg-surface px-5 py-4 font-semibold text-text"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal as="aside" delay={150}>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-surface lg:sticky lg:top-28">
              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.status}</dt>
                <dd className="mt-3">
                  <StatusBadge status={project.status} />
                </dd>
              </div>
              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.type}</dt>
                <dd className="mt-2 font-semibold text-text">{project.kind}</dd>
              </div>
              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.stack}</dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {project.stack.map((s) => (
                    <span key={s} className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-text">
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{t.links}</dt>
                <dd className="mt-3">
                  {project.links.length > 0 ? (
                    <ul className="space-y-2">
                      {project.links.map((l) => (
                        <li key={l.href}>
                          <a
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 font-semibold text-text hover:text-muted"
                          >
                            {l.label}
                            <ArrowUpRight />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">{t.noLinks}</p>
                  )}
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal as="section" className="mt-20">
          <h2 className="text-2xl font-extrabold tracking-tight text-text">{t.screenshots}</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {project.screenshots.map((s) => (
              <li
                key={s.alt}
                className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface"
              >
                {s.src ? (
                  <Image src={s.src} alt={s.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                ) : (
                  // TODO: screenshot placeholder — set `src` for this screenshot in src/content/site.ts.
                  <div
                    role="img"
                    aria-label={`${s.alt} (placeholder)`}
                    className="grain relative flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-surface to-bg p-6 text-center"
                  >
                    <span className="text-sm font-semibold text-text">{s.alt}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {t.screenshotPlaceholder}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </article>
  );
}
