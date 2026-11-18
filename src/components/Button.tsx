import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition duration-300 ease-out";

const variants = {
  primary:
    "bg-btn-bg text-btn-fg hover:bg-btn-bg/85 hover:shadow-[0_0_40px_-8px_var(--glow-strong)]",
  secondary:
    "border border-border text-text hover:border-[var(--border-hover)] hover:shadow-[0_0_40px_-12px_var(--glow)]",
};

export function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}

export function Button({ href, children, variant = "primary", className = "" }: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (isExternal(href)) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
