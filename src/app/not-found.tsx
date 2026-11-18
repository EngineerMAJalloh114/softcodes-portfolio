import { Button } from "@/components/Button";
import { Container } from "@/components/Section";
import { pages } from "@/content/site";

export default function NotFound() {
  return (
    <section className="hero-bg grain relative isolate flex min-h-[70vh] items-center overflow-hidden pt-36 pb-24">
      <Container className="relative z-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-6xl">
          {pages.notFound.title}
        </h1>
        <p className="mt-5 text-lg text-muted">{pages.notFound.body}</p>
        <div className="mt-10">
          <Button href="/">{pages.notFound.cta}</Button>
        </div>
      </Container>
    </section>
  );
}
