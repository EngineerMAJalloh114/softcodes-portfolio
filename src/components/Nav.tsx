"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { contact, nav, site } from "@/content/site";
import { CloseIcon, MenuIcon } from "./Icons";

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate/60 bg-night/75 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-mist focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between gap-6 px-6 sm:px-8">
        <Link href="/" className="shrink-0" aria-label={`${site.shortName} — home`}>
          <Image
            src="/brand/softcodes-logo-white.svg"
            alt="Soft CODES"
            width={2121}
            height={579}
            priority
            unoptimized
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm font-semibold text-muted transition-colors duration-300 hover:text-mist"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={contact.whatsappHireUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-mist px-5 py-2.5 text-sm font-semibold text-void transition duration-300 hover:bg-white hover:shadow-[0_0_32px_-8px_rgba(199,208,217,0.6)] sm:inline-flex"
          >
            {nav.hireLabel}
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate text-mist md:hidden"
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
        className="border-t border-slate/60 bg-night md:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-6xl px-6 py-6">
          <ul className="flex flex-col gap-1">
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-lg font-semibold text-mist hover:bg-void/60"
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
            className="mt-4 flex justify-center rounded-full bg-mist px-5 py-3 text-sm font-semibold text-void"
          >
            {nav.hireLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}
