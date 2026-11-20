import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ContactDetails } from "@/components/ContactDetails";
import { QuoteForm } from "@/components/QuoteForm";
import { ArrowRight, SparkIcon } from "@/components/Icons";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow, Section } from "@/components/Section";
import { AboutContent } from "@/components/AboutContent";
import { CvButton } from "@/components/CvButton";
import { PostCard } from "@/components/blog/PostCard";
import { TestimonialList } from "@/components/Testimonials";
import { livePosts } from "@/lib/blog/posts";
import { CurrencyToggle } from "@/components/pricing/CurrencyToggle";
import { PackageCard } from "@/components/pricing/PackageCard";
import { getSiteContent } from "@/lib/content/load";
import { ctaHref } from "@/lib/content/whatsapp";
import type { BlogPost, SiteContent } from "@/lib/content/types";

// Content comes from the CMS (cached; admin saves refresh it). Hourly safety net.
export const revalidate = 3600;

type P = { c: SiteContent };

export default async function Home() {
  const c = await getSiteContent();
  const latest = livePosts(c.posts, { preview: c.preview }).slice(0, 3);
  return (
    <>
      <Hero c={c} />
      <About c={c} />
      <Services c={c} />
      {c.process.visible && <Process c={c} />}
      <FeaturedProjects c={c} />
      {c.testimonials.length > 0 && (
        <Section id="testimonials" eyebrow={c.testimonialsSection.eyebrow} heading={c.testimonialsSection.heading}>
          <TestimonialList items={c.testimonials.slice(0, 6)} />
        </Section>
      )}
      {c.packages.length > 0 && <PricingTeaser c={c} />}
      {latest.length > 0 && <LatestPosts c={c} posts={latest} />}
      <Stack c={c} />
      <Contact c={c} />
    </>
  );
}

function Hero({ c }: P) {
  const { hero } = c;
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
            <Button href={ctaHref(hero.primaryCta, c.contact.whatsappDisplay)}>
              {hero.primaryCta.label}
              <ArrowRight />
            </Button>
            <Button href={ctaHref(hero.secondaryCta, c.contact.whatsappDisplay)} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
            {c.features.cvUrl && <CvButton href={c.features.cvUrl} label={c.pages.about.cvLabel} />}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function About({ c }: P) {
  const { about } = c;
  return (
    <Section id="about" eyebrow={about.eyebrow} heading={about.heading}>
      <AboutContent c={c} variant="short" />
    </Section>
  );
}

function Services({ c }: P) {
  const { services } = c;
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

/** M-14 Process — placeholder copy; shown only when switched on in Admin → Content → Process. */
function Process({ c }: P) {
  const { process } = c;
  return (
    <Section id="process" eyebrow={process.eyebrow} heading={process.heading} intro={process.intro}>
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {process.steps.map((step, i) => (
          <Reveal as="li" key={step.title} delay={i * 80}>
            <div className="h-full rounded-2xl border border-border bg-surface p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Step {i + 1}</span>
              <h3 className="mt-3 text-lg font-extrabold tracking-tight text-text">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

function FeaturedProjects({ c }: P) {
  const { projectsSection } = c;
  return (
    <Section
      id="projects"
      eyebrow={projectsSection.eyebrow}
      heading={projectsSection.heading}
      intro={projectsSection.intro}
    >
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {c.projects.filter((p) => p.featured).map((p, i) => (
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

/** A-08 teaser: featured packages (or the first three) + link to /pricing. */
function PricingTeaser({ c }: P) {
  const { pricing } = c;
  const featured = c.packages.filter((p) => p.featured);
  const shown = (featured.length ? featured : c.packages).slice(0, 3);
  return (
    <Section id="pricing" eyebrow={pricing.eyebrow} heading={pricing.heading} intro={pricing.intro}>
      <div className="mb-8">
        <CurrencyToggle label={pricing.currencyLabel} />
      </div>
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((pkg, i) => (
          <Reveal as="li" key={pkg.slug} delay={i * 80}>
            <PackageCard pkg={pkg} pricing={pricing} compact />
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-10">
        <Link href="/pricing" className="inline-flex items-center gap-2 font-semibold text-text hover:underline">
          {pricing.teaserLinkLabel}
          <ArrowRight />
        </Link>
      </Reveal>
    </Section>
  );
}

/** M-05 home teaser: the three newest posts (featured first). Hidden when none are live. */
function LatestPosts({ c, posts }: P & { posts: BlogPost[] }) {
  const { blog } = c;
  const nameOf = (slug: string | null) => c.postCategories.find((x) => x.slug === slug)?.name ?? null;
  return (
    <Section id="blog" eyebrow={blog.latestEyebrow} heading={blog.latestHeading}>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-latest-posts>
        {posts.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 80}>
            <PostCard post={p} categoryName={nameOf(p.category)} readingLabel={blog.readingTimeLabel} />
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-10">
        <Link href="/blog" className="inline-flex items-center gap-2 font-semibold text-text hover:underline">
          {blog.latestLinkLabel}
          <ArrowRight />
        </Link>
      </Reveal>
    </Section>
  );
}

function Stack({ c }: P) {
  const { stack } = c;
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

function Contact({ c }: P) {
  const { contactSection } = c;
  return (
    <Section
      id="contact"
      eyebrow={contactSection.eyebrow}
      heading={contactSection.heading}
      intro={contactSection.body}
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1.5fr]">
        <Reveal>
          <ContactDetails contact={c.contact} contactSection={contactSection} />
        </Reveal>
        <Reveal delay={150}>
          <QuoteForm contact={c.contact} contactSection={contactSection} packages={c.packages} />
        </Reveal>
      </div>
    </Section>
  );
}
