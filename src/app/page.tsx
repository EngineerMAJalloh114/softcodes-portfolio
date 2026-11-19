import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ContactDetails } from "@/components/ContactDetails";
import { ContactForm } from "@/components/ContactForm";
import { ArrowRight, SparkIcon } from "@/components/Icons";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { MascotPlaceholder } from "@/components/MascotPlaceholder";
import { Container, Eyebrow, Section } from "@/components/Section";
import {
  about,
  contactSection,
  featuredProjects,
  hero,
  person,
  projectsSection,
  services,
  stack,
} from "@/content/site";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <FeaturedProjects />
      <Stack />
      <Contact />
    </>
  );
}

function Hero() {
  return (
    // DEC-29: koala mascot as full-width background; text left, koala right.
    // data-theme="dark" scopes the dark tokens so the hero stays dark in both themes.
    <section
      data-theme="dark"
      aria-labelledby="hero-heading"
      className="relative isolate flex flex-col overflow-hidden bg-bg text-text lg:min-h-[760px] lg:justify-center"
    >
      {/* Mascot layer: below the text on mobile, background right of centre on desktop. */}
      <div
        aria-hidden
        className="hero-koala relative order-2 mt-4 h-[min(115vw,520px)] w-full lg:absolute lg:inset-y-0 lg:left-[28%] lg:right-0 lg:order-none lg:mt-0 lg:h-auto lg:w-auto"
      >
        <Image
          src="/brand/mascot-koala.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 72vw, 100vw"
          className="object-cover object-[50%_40%] lg:object-center"
        />
      </div>

      {/* Text-side gradient for AA contrast (desktop: left → right). */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 hidden w-[68%] bg-gradient-to-r from-bg from-35% via-bg/90 via-55% to-transparent lg:block"
      />
      {/* Bottom fade into the page bg (no seam in dark theme). */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent"
      />

      <Container className="relative z-10 order-1 pt-32 sm:pt-40 lg:py-40">
        <div className="max-w-xl">
          <Reveal>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={100}>
            <h1
              id="hero-heading"
              className="mt-6 text-5xl font-extrabold tracking-tighter text-text sm:text-7xl"
            >
              {hero.name}
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 text-lg font-semibold text-muted sm:text-xl">{hero.title}</p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-8 text-2xl leading-snug font-semibold text-text sm:text-3xl">
              {hero.pitch}
            </p>
          </Reveal>
          <Reveal delay={400} className="mt-10 flex flex-wrap gap-4">
            <Button href={hero.primaryCta.href}>
              {hero.primaryCta.label}
              <ArrowRight />
            </Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function Portrait() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_0_80px_-30px_var(--glow)]">
      {person.photo ? (
        <Image
          src={person.photo}
          alt={person.photoAlt}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 90vw"
          className="object-cover object-top"
        />
      ) : (
        <MascotPlaceholder
          label={person.photoAlt}
          note="Photo coming soon"
          sizes="(min-width: 1024px) 380px, 90vw"
        />
      )}
    </div>
  );
}

function About() {
  return (
    <Section id="about" eyebrow={about.eyebrow} heading={about.heading}>
      {/* TODO(DEC-30): interim 2-column layout (photo + bio). The owner will supply the
          final About layout reference and a new photo (public/brand/me.jpg). */}
      <div className="grid items-start gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        <Reveal className="mx-auto w-full max-w-sm md:max-w-none">
          <Portrait />
        </Reveal>
        <div>
          <Reveal className="space-y-6 text-lg leading-relaxed text-muted">
            {/* TODO: bio is placeholder copy — see about.paragraphs in src/content/site.ts */}
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
          <Reveal delay={150} className="mt-10">
            <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {about.facts.map((f) => (
                <div key={f.label} className="p-6">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {f.label}
                  </dt>
                  <dd className="mt-2 font-semibold text-text">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function Services() {
  return (
    <Section
      id="services"
      eyebrow={services.eyebrow}
      heading={services.heading}
      className="border-y border-border bg-surface/40"
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.items.map((s, i) => (
          <Reveal
            as="li"
            key={s.title}
            delay={i * 80}
            // Last card spans 2 columns so the 2- and 3-column grids have no empty slot.
            className={i === services.items.length - 1 ? "sm:col-span-2" : ""}
          >
            <div className="glow h-full rounded-2xl border border-border bg-surface p-7 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted">
                <SparkIcon />
              </span>
              <h3 className="mt-6 text-xl font-extrabold tracking-tight text-text">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

function FeaturedProjects() {
  return (
    <Section
      id="projects"
      eyebrow={projectsSection.eyebrow}
      heading={projectsSection.heading}
      intro={projectsSection.intro}
    >
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featuredProjects.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 100}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-12">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 font-semibold text-text hover:text-muted"
        >
          {projectsSection.allLabel}
          <ArrowRight />
        </Link>
      </Reveal>
    </Section>
  );
}

function Stack() {
  return (
    <Section
      id="stack"
      eyebrow={stack.eyebrow}
      heading={stack.heading}
      className="border-y border-border bg-surface/40"
    >
      <Reveal as="ul" className="flex flex-wrap gap-3">
        {stack.items.map((s) => (
          <li
            key={s}
            className="glow rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text"
          >
            {s}
          </li>
        ))}
      </Reveal>
    </Section>
  );
}

function Contact() {
  return (
    <Section
      id="contact"
      eyebrow={contactSection.eyebrow}
      heading={contactSection.heading}
      intro={contactSection.body}
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1.5fr]">
        <Reveal>
          <ContactDetails />
        </Reveal>
        <Reveal delay={150}>
          <ContactForm />
        </Reveal>
      </div>
    </Section>
  );
}
