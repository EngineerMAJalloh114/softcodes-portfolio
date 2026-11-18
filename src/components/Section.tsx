import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type SectionProps = {
  id?: string;
  eyebrow?: string;
  heading?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
};

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">{children}</p>
  );
}

export function Section({ id, eyebrow, heading, intro, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`py-24 sm:py-32 ${className}`}>
      <Container>
        {(eyebrow || heading) && (
          <Reveal className="mb-12 max-w-2xl sm:mb-16">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {heading && (
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text sm:text-5xl">
                {heading}
              </h2>
            )}
            {intro && <p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p>}
          </Reveal>
        )}
        {children}
      </Container>
    </section>
  );
}
