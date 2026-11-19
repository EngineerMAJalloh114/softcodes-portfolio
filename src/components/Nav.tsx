"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content/types";
import { CloseIcon, MenuIcon } from "./Icons";
import { ThemeImage } from "./ThemeImage";
import { ThemeToggle } from "./ThemeToggle";

export function Nav({ nav, contact, site }: Pick<SiteContent, "nav" | "contact" | "site">) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/75 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-btn-bg focus:px-4 focus:py-2 focus:text-btn-fg"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between gap-6 px-6 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${site.shortName} — home`}
        >
          {/* < 1024px: koala icon + text */}
          <ThemeImage name="softcodes-icon" alt="" width={977} height={977} priority className="block h-9 w-9 lg:hidden" />
          <span className="text-lg font-extrabold tracking-tight text-text lg:hidden">
            {site.shortName}
          </span>
          {/* ≥ 1024px: full wordmark */}
          <ThemeImage
            name="softcodes-logo"
            alt=""
            width={2121}
            height={579}
            priority
            className="hidden w-[200px] min-w-[200px] lg:block"
          />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm font-semibold text-muted transition-colors duration-300 hover:text-text"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href={contact.whatsappHireUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-btn-bg px-5 py-2.5 text-sm font-semibold text-btn-fg transition duration-300 hover:bg-btn-bg/85 hover:shadow-[0_0_40px_-8px_var(--glow-strong)] sm:inline-flex"
          >
            {nav.hireLabel}
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-text md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-border bg-surface md:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-6xl px-6 py-6">
          <ul className="flex flex-col gap-1">
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-lg font-semibold text-text hover:bg-bg/60"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={contact.whatsappHireUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex justify-center rounded-full bg-btn-bg px-5 py-3 text-sm font-semibold text-btn-fg"
          >
            {nav.hireLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}
