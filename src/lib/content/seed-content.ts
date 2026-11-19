import * as seed from "@/content/site";
import type { SiteContent } from "./types";

/**
 * Site content from src/content/site.ts. Used to seed the DB and as the fallback when no
 * database is configured (e.g. `next build` in CI). Pure module.
 */
export function seedContent(): SiteContent {
  return {
    site: seed.site,
    person: seed.person,
    contact: seed.contact,
    nav: seed.nav,
    hero: seed.hero,
    about: seed.about,
    services: seed.services,
    process: seed.processSection,
    projectsSection: seed.projectsSection,
    projects: seed.projects,
    stack: seed.stack,
    contactSection: seed.contactSection,
    softCodes: seed.softCodes,
    footer: seed.footer,
    pages: seed.pages,
    preview: false,
    source: "seed",
  };
}

/** WhatsApp links derived from the display number in Settings. */
export function contactFrom(email: string, whatsappDisplay: string): SiteContent["contact"] {
  const digits = whatsappDisplay.replace(/\D/g, "");
  return {
    email,
    whatsappDisplay,
    whatsappUrl: `https://wa.me/${digits}`,
    whatsappHireUrl: `https://wa.me/${digits}?text=${encodeURIComponent("Hi Mohamed, I'd like to talk about a project.")}`,
  };
}
