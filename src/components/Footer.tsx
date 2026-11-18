import Image from "next/image";
import Link from "next/link";
import { contact, footer } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-slate/60 bg-night">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/softcodes-icon-white.svg"
            alt=""
            width={977}
            height={977}
            unoptimized
            className="h-12 w-12 opacity-80"
          />
          <div>
            <Image
              src="/brand/softcodes-logo-white.svg"
              alt="Soft CODES"
              width={2121}
              height={579}
              unoptimized
              className="h-6 w-auto"
            />
            <p className="mt-2 text-sm text-muted">{footer.tagline}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-sm md:items-end">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footer.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-semibold text-muted hover:text-mist">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
            <a href={`mailto:${contact.email}`} className="break-all hover:text-mist">
              {contact.email}
            </a>
            <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-mist">
              {contact.whatsappDisplay}
            </a>
          </div>
          <p className="text-muted">{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
