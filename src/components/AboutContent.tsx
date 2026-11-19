import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "./Icons";
import { MascotPlaceholder } from "./MascotPlaceholder";
import { Reveal } from "./Reveal";
import type { SiteContent } from "@/lib/content/types";

function Portrait({ person }: { person: SiteContent["person"] }) {
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
        <MascotPlaceholder label={person.photoAlt} note="Photo coming soon" sizes="(min-width: 1024px) 380px, 90vw" />
      )}
    </div>
  );
}

/**
 * About content (A-03). "short" (home): first bio paragraph + "More about me" → /about.
 * "full" (/about): all paragraphs and the facts list.
 * TODO(DEC-30): interim 2-column layout (photo + bio); the owner will supply the final
 * About layout reference and a new photo.
 */
export function AboutContent({ c, variant }: { c: SiteContent; variant: "short" | "full" }) {
  const { about, person, pages } = c;
  const paragraphs = variant === "short" ? about.paragraphs.slice(0, 1) : about.paragraphs;
  return (
    <div className="grid items-start gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
      <Reveal className="mx-auto w-full max-w-sm md:max-w-none">
        <Portrait person={person} />
      </Reveal>
      <div>
        <Reveal className="space-y-6 text-lg leading-relaxed text-muted">
          {/* TODO: bio is placeholder copy — edit it in Admin → Content → About (DEC-21). */}
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
        {variant === "short" ? (
          <Reveal delay={100} className="mt-8">
            <Link href="/about" className="inline-flex items-center gap-2 font-semibold text-text hover:underline">
              {pages.about.moreLabel}
              <ArrowRight />
            </Link>
          </Reveal>
        ) : (
          <Reveal delay={150} className="mt-10">
            <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {about.facts.map((f) => (
                <div key={f.label} className="p-6">
                  <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{f.label}</dt>
                  <dd className="mt-2 font-semibold text-text">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </div>
    </div>
  );
}
