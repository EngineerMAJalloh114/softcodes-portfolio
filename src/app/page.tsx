import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ContactDetails } from "@/components/ContactDetails";
import { ContactForm } from "@/components/ContactForm";
import { ArrowRight, SparkIcon } from "@/components/Icons";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
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
    <section className="hero-bg grain relative isolate overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-36">
      <Container className="relative z-10 grid items-center gap-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Reveal>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tighter text-mist sm:text-7xl">
              {hero.name}
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 text-lg font-semibold text-muted sm:text-xl">{hero.title}</p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mt-8 max-w-xl text-2xl leading-snug font-semibold text-mist sm:text-3xl">
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
        <Reveal delay={300} className="mx-auto w-full max-w-sm lg:max-w-none">
          <Portrait />
        </Reveal>
      </Container>
    </section>
  );
}

function Portrait() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate bg-night shadow-[0_0_80px_-30px_rgba(199,208,217,0.35)]">
      {person.photo ? (
        <Image
          src={person.photo}
          alt={person.photoAlt}
          fill
          priority
          sizes="(min-width: 1024px) 400px, 90vw"
          className="object-cover"
        />
      ) : (
        // TODO: placeholder until public/brand/me.jpg is added (set person.photo in src/content/site.ts).
        <div
          role="img"
          aria-label={`${person.photoAlt} (placeholder)`}
          className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-night to-void"
        >
          <Image
            src="/brand/softcodes-icon-white.svg"
            alt=""
            width={977}
            height={977}
            unoptimized
            className="h-28 w-28 opacity-60"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-dusk">
            Photo coming soon
          </span>
        </div>
      )}
    </div>
  );
}

function About() {
  return (
    <Section id="about" eyebrow={about.eyebrow} heading={about.heading}>
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <Reveal className="space-y-6 text-lg leading-relaxed text-muted">
          {/* TODO: bio is placeholder copy — see about.paragraphs in src/content/site.ts */}
          {about.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
        <Reveal delay={150}>
          <dl className="divide-y divide-slate/70 rounded-2xl border border-slate bg-night">
            {about.facts.map((f) => (
              <div key={f.label} className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {f.label}
                </dt>
                <dd className="mt-2 font-semibold text-mist">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
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
      className="border-y border-slate/40 bg-night/40"
    >
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.items.map((s, i) => (
          <Reveal as="li" key={s.title} delay={i * 80}>
            <div className="glow h-full rounded-2xl border border-slate bg-night p-7 sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate text-dusk">
                <SparkIcon />
              </span>
              <h3 className="mt-6 text-xl font-extrabold tracking-tight text-mist">{s.title}</h3>
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
          className="inline-flex items-center gap-2 font-semibold text-mist hover:text-white"
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
      className="border-y border-slate/40 bg-night/40"
    >
      <Reveal as="ul" className="flex flex-wrap gap-3">
        {stack.items.map((s) => (
          <li
            key={s}
            className="glow rounded-full border border-slate bg-night px-5 py-2.5 text-sm font-semibold text-mist"
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
