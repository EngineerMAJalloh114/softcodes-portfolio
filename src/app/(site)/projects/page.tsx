import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/Section";
import { pages, projects, projectsSection } from "@/content/site";

export const metadata: Metadata = {
  title: pages.projects.title,
  description: pages.projects.description,
  alternates: { canonical: "/projects" },
  openGraph: { title: pages.projects.title, description: pages.projects.description, url: "/projects" },
};

export default function ProjectsPage() {
  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>{projectsSection.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">
            {pages.projects.heading}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{pages.projects.intro}</p>
        </Reveal>
        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={(i % 3) * 100}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
