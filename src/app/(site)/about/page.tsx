import type { Metadata } from "next";
import { AboutContent } from "@/components/AboutContent";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/Section";
import { getSiteContent } from "@/lib/content/load";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getSiteContent();
  return {
    title: pages.about.title,
    description: pages.about.description,
    alternates: { canonical: "/about" },
    openGraph: { title: pages.about.title, description: pages.about.description, url: "/about" },
  };
}

/** A-03 About page (interim layout — TODO(DEC-30)). */
export default async function AboutPage() {
  const c = await getSiteContent();
  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container>
        <Reveal className="mb-12 max-w-2xl sm:mb-16">
          <Eyebrow>{c.about.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">{c.about.heading}</h1>
        </Reveal>
        <AboutContent c={c} variant="full" />
      </Container>
    </section>
  );
}
