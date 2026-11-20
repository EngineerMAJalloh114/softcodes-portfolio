import type { Metadata } from "next";
import { Container } from "@/components/Section";
import { getSiteContent } from "@/lib/content/load";
import { isValidUnsubscribeToken } from "@/lib/newsletter/service";
import { UnsubscribeForm } from "./UnsubscribeForm";

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getSiteContent();
  return { title: pages.unsubscribe.title, robots: { index: false, follow: false } };
}

/**
 * Unsubscribe (M-13): the link in every newsletter email (T7b) points here with a token.
 * A button press is required, so link scanners that open the URL don't unsubscribe anyone.
 */
export default async function UnsubscribePage({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  const { pages } = await getSiteContent();
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const valid = await isValidUnsubscribeToken(token);
  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container className="max-w-xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-5xl">{pages.unsubscribe.heading}</h1>
        {valid ? (
          <UnsubscribeForm token={token!} body={pages.unsubscribe.body} button={pages.unsubscribe.button} done={pages.unsubscribe.done} invalid={pages.unsubscribe.invalid} />
        ) : (
          <p data-unsubscribe-invalid className="mt-6 text-lg text-muted">
            {pages.unsubscribe.invalid}
          </p>
        )}
      </Container>
    </section>
  );
}
