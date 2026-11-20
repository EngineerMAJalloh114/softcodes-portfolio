import * as seed from "@/content/site";
import type { SiteContent } from "./types";
import { HIRE_MESSAGE, whatsappUrl } from "./whatsapp";

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
    pricing: seed.pricing,
    packages: seed.packages,
    faqs: [], // seeded FAQs are drafts (DEC-21): nothing public until approved
    pages: seed.pages,
    blog: seed.blog,
    posts: [], // the welcome post is a draft (DEC-21): nothing public until the owner publishes
    postCategories: seed.postCategories,
    testimonialsSection: seed.testimonialsSection,
    testimonials: [],
    newsletter: seed.newsletter,
    features: { whatsappButton: true, cvUrl: null },
    preview: false,
    source: "seed",
  };
}

/** Contact details; WhatsApp links are always derived from the Settings number (DEC-37). */
export function contactFrom(email: string, whatsappDisplay: string): SiteContent["contact"] {
  return {
    email,
    whatsappDisplay,
    whatsappUrl: whatsappUrl(whatsappDisplay),
    whatsappHireUrl: whatsappUrl(whatsappDisplay, HIRE_MESSAGE),
  };
}
