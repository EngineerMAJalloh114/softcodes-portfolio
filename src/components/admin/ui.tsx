import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export function PageHeader({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl leading-relaxed text-muted">{intro}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface p-6 ${className}`}>{children}</div>;
}

export function StatCard({ label, value, hint, href }: { label: string; value: number; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-4xl font-extrabold tracking-tight text-text tabular-nums">{value.toLocaleString("en")}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </>
  );
  if (!href) return <Card>{body}</Card>;
  return (
    <Link href={href} data-stat={label} className="block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-[var(--border-hover)]">
      {body}
      <span className="mt-3 block text-sm font-semibold text-text">Open →</span>
    </Link>
  );
}

/** Empty state with the koala mascot (DEC-31). */
export function EmptyState({ title, body, compact = false }: { title: string; body?: ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-4 text-center ${compact ? "py-6" : "py-12"}`}>
      <div
        className={`relative overflow-hidden rounded-2xl border border-border ${compact ? "h-24 w-40" : "h-40 w-64"}`}
      >
        <Image
          src="/brand/mascot-koala.jpg"
          alt=""
          fill
          sizes="256px"
          className="object-cover object-[50%_35%]"
        />
      </div>
      <div>
        <p className="font-extrabold text-text">{title}</p>
        {body && <p className="mt-1 text-sm text-muted">{body}</p>}
      </div>
    </div>
  );
}

/** Placeholder for sections delivered by a later task. */
export function ComingSoon({ title, release, body }: { title: string; release: string; body: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState title={`Coming in ${release}`} body={body} />
      </Card>
    </>
  );
}
