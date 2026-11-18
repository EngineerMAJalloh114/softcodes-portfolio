import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { ArrowRight } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/Section";
import { pages, softCodes } from "@/content/site";

export const metadata: Metadata = {
  title: pages.softCodes.title,
  description: pages.softCodes.description,
  alternates: { canonical: "/soft-codes" },
  openGraph: { title: pages.softCodes.title, description: pages.softCodes.description, url: "/soft-codes" },
};

export default function SoftCodesPage() {
  return (
    <>
      <section className="hero-bg grain relative isolate overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-32">
        <Container className="relative z-10 flex flex-col items-center text-center">
          <Reveal>
            <Image
              src="/brand/softcodes-icon-white.svg"
              alt="The Soft CODES sleeping koala"
              width={977}
              height={977}
              priority
              unoptimized
              className="h-56 w-56 drop-shadow-[0_0_60px_rgba(199,208,217,0.25)] sm:h-80 sm:w-80"
            />
          </Reveal>
          <Reveal delay={150} className="mt-10">
            <Eyebrow>{softCodes.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-5xl font-extrabold tracking-tighter text-mist sm:text-7xl">
              {softCodes.heading}
            </h1>
          </Reveal>
          <Reveal delay={300}>
            <p className="mx-auto mt-8 max-w-2xl text-2xl leading-snug font-semibold text-mist sm:text-3xl">
              {softCodes.lead}
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 sm:py-32">
        <Container className="max-w-3xl">
          <Reveal className="space-y-6 text-lg leading-relaxed text-muted">
            {/* TODO: company story is placeholder copy — see softCodes.paragraphs in src/content/site.ts */}
            {softCodes.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </Container>
        <Container className="mt-20">
          <ul className="grid gap-5 md:grid-cols-3">
            {softCodes.principles.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 100}>
                <div className="glow h-full rounded-2xl border border-slate bg-night p-8">
                  <h2 className="text-xl font-extrabold tracking-tight text-mist">{p.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-16 flex justify-center">
            <Button href={softCodes.cta.href}>
              {softCodes.cta.label}
              <ArrowRight />
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
