import Link from "next/link";
import { formatPrice } from "@/lib/content/money";
import type { SiteContent } from "@/lib/content/types";

type Pkg = SiteContent["packages"][number];

/** Price in both currencies; CSS shows the visitor's choice (no layout shift, no JS needed). */
export function Price({ pkg, fromLabel }: { pkg: Pkg; fromLabel: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-sm font-semibold uppercase tracking-[0.15em] text-muted">{fromLabel}</span>
      <span className="text-4xl font-extrabold tracking-tight text-text tabular-nums" data-price={pkg.slug}>
        <span className="price-usd">{formatPrice(pkg.priceUsdMinor, "USD")}</span>
        <span className="price-sle">{formatPrice(pkg.priceSleMinor, "SLE")}</span>
      </span>
      {pkg.unit && <span className="text-sm font-semibold text-muted">{pkg.unit}</span>}
    </p>
  );
}

/** A-08 package card with quote + call actions (wizard is R2; Cal.com booking is T7). */
export function PackageCard({ pkg, pricing, compact = false }: { pkg: Pkg; pricing: SiteContent["pricing"]; compact?: boolean }) {
  return (
    <article
      data-package={pkg.slug}
      className={`glow flex h-full flex-col rounded-2xl border bg-surface p-7 ${pkg.featured ? "border-text/60" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-extrabold tracking-tight text-text">{pkg.name}</h3>
        <span className="flex gap-2">
          {pkg.isDraft && <span className="rounded-full bg-btn-bg px-2.5 py-0.5 text-xs font-semibold text-btn-fg">Draft</span>}
          {pkg.featured && <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-text">Popular</span>}
        </span>
      </div>
      <p className="mt-2 leading-relaxed text-muted">{pkg.summary}</p>
      <div className="mt-6">
        <Price pkg={pkg} fromLabel={pricing.fromLabel} />
      </div>
      {!compact && pkg.items.length > 0 && (
        <ul className="mt-6 flex-1 space-y-2 text-sm text-text">
          {pkg.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-muted">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      )}
      <div className={`flex flex-wrap gap-3 ${compact ? "mt-auto pt-6" : "mt-8"}`}>
        <Link
          href={`/contact?package=${encodeURIComponent(pkg.slug)}`}
          className="inline-flex h-11 items-center rounded-full bg-btn-bg px-5 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85"
        >
          {pricing.requestQuoteLabel}
        </Link>
        {!compact && (
          // TODO(T7): open the Cal.com booking (M-10) instead of the contact page.
          <Link
            href="/contact#book"
            title={pricing.bookCallNote}
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-text hover:border-[var(--border-hover)]"
          >
            {pricing.bookCallLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
