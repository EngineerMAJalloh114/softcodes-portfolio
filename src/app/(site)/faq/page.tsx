import type { Metadata } from "next";
import { EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { Container } from "@/components/Section";
import { faqJsonLd, jsonLdString } from "@/lib/content/faq-jsonld";
import { getSiteContent } from "@/lib/content/load";
import { faqCategoryLabel } from "@/lib/content/options";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getSiteContent();
  return {
    title: pages.faq.title,
    description: pages.faq.description,
    alternates: { canonical: "/faq" },
    openGraph: { title: pages.faq.title, description: pages.faq.description, url: "/faq" },
  };
}

/** A-09 FAQ page: accordion grouped by category + FAQPage structured data (published only). */
export default async function FaqPage() {
  const { pages, faqs, preview } = await getSiteContent();
  const groups = [...new Set(faqs.map((f) => f.category))].map((category) => ({
    category,
    items: faqs.filter((f) => f.category === category),
  }));
  const published = faqs.filter((f) => !f.isDraft);

  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      {published.length > 0 && !preview && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd(published)) }} />
      )}
      <Container className="max-w-3xl">
        <Reveal>
          <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-6xl">{pages.faq.heading}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{pages.faq.intro}</p>
        </Reveal>

        {faqs.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-surface">
            <EmptyState title={pages.faq.empty} />
            <div className="flex justify-center pb-10">
              <Button href="/contact">Ask a question</Button>
            </div>
          </div>
        ) : (
          <div className="mt-12 space-y-10">
            {groups.map((g) => (
              <section key={g.category} aria-labelledby={`faq-${g.category}`}>
                <h2 id={`faq-${g.category}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {faqCategoryLabel(g.category)}
                </h2>
                <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
                  {g.items.map((f) => (
                    <details key={f.question} className="group px-6 py-5" data-faq={f.question}>
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-text [&::-webkit-details-marker]:hidden">
                        <span>
                          {f.question}
                          {f.isDraft && <span className="ml-2 rounded-full bg-btn-bg px-2 py-0.5 text-xs text-btn-fg">Draft</span>}
                        </span>
                        <span aria-hidden className="mt-0.5 text-muted transition-transform duration-300 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 leading-relaxed text-muted">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
