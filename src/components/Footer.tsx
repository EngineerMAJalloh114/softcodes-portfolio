import Link from "next/link";
import type { SiteContent } from "@/lib/content/types";
import { ThemeImage } from "./ThemeImage";

export function Footer({ contact, footer }: Pick<SiteContent, "contact" | "footer">) {
  // pb-24 on small screens: room for the floating WhatsApp button (M-06).
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-14 pb-24 sm:px-8 md:flex-row md:pb-14 md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <ThemeImage name="softcodes-icon" alt="" width={977} height={977} className="block h-12 w-12 opacity-80" />
          <div>
            <ThemeImage
              name="softcodes-logo"
              alt="Soft CODES"
              width={2121}
              height={579}
              className="block w-[220px] min-w-[220px]"
            />
            <p className="mt-2 text-sm text-muted">{footer.tagline}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-sm md:items-end">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footer.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-semibold text-muted hover:text-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
            <a href={`mailto:${contact.email}`} className="break-all hover:text-text">
              {contact.email}
            </a>
            <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-text">
              {contact.whatsappDisplay}
            </a>
          </div>
          <p className="text-muted">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
