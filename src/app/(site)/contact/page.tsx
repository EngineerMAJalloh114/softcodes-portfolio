import type { Metadata } from "next";
import { ContactDetails } from "@/components/ContactDetails";
import { QuoteForm } from "@/components/QuoteForm";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/Section";
import { getSiteContent } from "@/lib/content/load";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getSiteContent();
  return {
    title: pages.contact.title,
    description: pages.contact.description,
    alternates: { canonical: "/contact" },
    openGraph: { title: pages.contact.title, description: pages.contact.description, url: "/contact" },
  };
}

export default async function ContactPage() {
  const { contact, contactSection, packages } = await getSiteContent();
  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>{contactSection.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">
            {contactSection.heading}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{contactSection.body}</p>
        </Reveal>
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_1.5fr]">
          <Reveal>
            <ContactDetails contact={contact} contactSection={contactSection} />
          </Reveal>
          <Reveal delay={150}>
            <QuoteForm contact={contact} contactSection={contactSection} packages={packages} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
