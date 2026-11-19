import { ArrowUpRight } from "./Icons";

/** "Download CV" (M-04). Rendered only when a CV PDF is set in Settings. */
export function CvButton({ href, label, variant = "button" }: { href: string; label: string; variant?: "button" | "link" }) {
  const cls =
    variant === "button"
      ? "inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold tracking-wide text-text transition duration-300 hover:border-[var(--border-hover)] hover:shadow-[0_0_40px_-12px_var(--glow)]"
      : "inline-flex items-center gap-2 font-semibold text-text hover:underline";
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" data-cv-button className={cls}>
      {label}
      <ArrowUpRight />
    </a>
  );
}
