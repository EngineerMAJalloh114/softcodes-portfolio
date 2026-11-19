import type { Metadata } from "next";
import { PackageCard } from "@/components/pricing/PackageCard";
import { CurrencyToggle } from "@/components/pricing/CurrencyToggle";
import { EmptyState } from "@/components/admin/ui";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/Section";
import { getSiteContent } from "@/lib/content/load";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getSiteContent();
  return {
    title: pages.pricing.title,
    description: pages.pricing.description,
    alternates: { canonical: "/pricing" },
    openGraph: { title: pages.pricing.title, description: pages.pricing.description, url: "/pricing" },
  };
}

/** A-08 / M-15: packages with 'from' prices in USD and SLE (DEC-25, DEC-38). */
export default async function PricingPage() {
  const { pricing, packages } = await getSiteContent();
  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>{pricing.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">{pricing.heading}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{pricing.intro}</p>
        </Reveal>
        <div className="mt-10">
          <CurrencyToggle label={pricing.currencyLabel} />
        </div>
        {packages.length ? (
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <Reveal as="li" key={pkg.slug} delay={(i % 3) * 80}>
                <PackageCard pkg={pkg} pricing={pricing} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <EmptyState title="Prices are being updated" body="Message us for a quote in the meantime." />
        )}
        <p className="mt-10 max-w-2xl text-sm text-muted">{pricing.bookCallNote}</p>
      </Container>
    </section>
  );
}
