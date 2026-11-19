import type * as seed from "@/content/site";

/**
 * Everything the public site renders. Same shape as src/content/site.ts (the seed source),
 * so components keep their types whether data comes from the DB or the seed fallback.
 */
export type SiteContent = {
  site: typeof seed.site;
  person: typeof seed.person;
  contact: typeof seed.contact;
  nav: typeof seed.nav;
  hero: typeof seed.hero;
  about: typeof seed.about;
  services: typeof seed.services;
  process: typeof seed.processSection;
  projectsSection: typeof seed.projectsSection;
  projects: seed.Project[];
  stack: typeof seed.stack;
  contactSection: typeof seed.contactSection;
  softCodes: typeof seed.softCodes;
  footer: typeof seed.footer;
  pricing: typeof seed.pricing;
  packages: (seed.PricingPackage & { isDraft?: boolean })[];
  faqs: (seed.Faq & { isDraft?: boolean })[];
  pages: typeof seed.pages;
  /** From Settings: floating WhatsApp button on/off (M-06) and the public CV PDF URL (M-04). */
  features: { whatsappButton: boolean; cvUrl: string | null };
  /** True when rendered from drafts (admin preview). */
  preview: boolean;
  /** Where the content came from: the database or the bundled seed (no DB at build). */
  source: "db" | "seed";
};

export type { Faq, PricingPackage, Project, ProjectStatus, ProjectType } from "@/content/site";
