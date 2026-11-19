import Image from "next/image";
import { Button } from "@/components/Button";
import { Container } from "@/components/Section";
import { SiteChrome } from "@/components/SiteChrome";
import { pages } from "@/content/site";

export default function NotFound() {
  return (
    <SiteChrome>
    <section className="hero-bg grain relative isolate flex min-h-[70vh] items-center overflow-hidden pt-32 pb-24 sm:pt-36">
      <Container className="relative z-10 flex flex-col items-center text-center">
        {/* DEC-31: koala mascot on the 404 state. */}
        <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-2xl border border-border shadow-[0_0_80px_-30px_var(--glow)]">
          <Image
            src="/brand/mascot-koala.jpg"
            alt="The Soft CODES koala, eyes closed, listening to music"
            fill
            priority
            sizes="(min-width: 640px) 448px, 90vw"
            className="object-cover object-[50%_35%]"
          />
        </div>
        <h1 className="mt-10 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">
          {pages.notFound.title}
        </h1>
        <p className="mt-5 text-lg text-muted">{pages.notFound.body}</p>
        <div className="mt-10">
          <Button href="/">{pages.notFound.cta}</Button>
        </div>
      </Container>
    </section>
    </SiteChrome>
  );
}
