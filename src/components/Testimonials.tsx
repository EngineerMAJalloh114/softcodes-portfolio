import Image from "next/image";
import type { Testimonial } from "@/lib/content/types";
import { optimisable } from "./blog/PostCard";

/**
 * Client testimonials (A-16). Shown only once published (admin approval). Deliberately no
 * Review/AggregateRating structured data (DEC-44: Google's self-serving review policy) —
 * the optional rating is shown visually only.
 */
export function TestimonialCard({ t }: { t: Testimonial }) {
  const who = [t.role, t.company].filter(Boolean).join(", ");
  return (
    <figure data-testimonial={t.id} className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        {t.rating ? (
          <p className="text-base tracking-[0.15em] text-text" aria-label={`Rated ${t.rating} out of 5`} data-rating={t.rating}>
            <span aria-hidden="true">{"★".repeat(t.rating)}</span>
            <span aria-hidden="true" className="text-muted/50">
              {"★".repeat(5 - t.rating)}
            </span>
          </p>
        ) : (
          <span aria-hidden="true" className="text-4xl leading-none font-extrabold text-muted/60">
            “
          </span>
        )}
        {t.isDraft && <span className="rounded-full bg-btn-bg px-2.5 py-0.5 text-xs font-semibold text-btn-fg">Draft</span>}
      </div>
      <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-text">
        <p>{t.quote}</p>
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-4">
        {t.photo && (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
            <Image src={t.photo} alt="" fill sizes="48px" unoptimized={!optimisable(t.photo)} className="object-cover" />
          </span>
        )}
        <span>
          <span className="block font-semibold text-text">{t.name}</span>
          {who && <span className="block text-sm text-muted">{who}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialList({ items }: { items: Testimonial[] }) {
  return (
    <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" data-testimonials>
      {items.map((t) => (
        <li key={t.id}>
          <TestimonialCard t={t} />
        </li>
      ))}
    </ul>
  );
}
