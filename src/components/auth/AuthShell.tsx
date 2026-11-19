import type { ReactNode } from "react";
import { Container } from "@/components/Section";

/** Centered card used by every /auth page and the /admin placeholder. */
export function AuthShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container className="max-w-lg">
        <div className="rounded-2xl border border-border bg-surface p-7 sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-text">{title}</h1>
          {intro && <div className="mt-3 leading-relaxed text-muted">{intro}</div>}
          <div className="mt-8">{children}</div>
        </div>
      </Container>
    </section>
  );
}
