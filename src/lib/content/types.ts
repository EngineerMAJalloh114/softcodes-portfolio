import type * as seed from "@/content/site";
import type { RichDoc } from "@/lib/blog/richtext";

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
  blog: typeof seed.blog;
  /** Published posts (all posts in preview); filter by date with livePosts(). Body images resolved. */
  posts: BlogPost[];
  postCategories: seed.PostCategory[];
  testimonialsSection: typeof seed.testimonialsSection;
  /** Published testimonials (all in preview); photo resolved to a public URL. */
  testimonials: Testimonial[];
  newsletter: typeof seed.newsletter;
  /** From Settings: floating WhatsApp button on/off (M-06) and the public CV PDF URL (M-04). */
  features: { whatsappButton: boolean; cvUrl: string | null };
  /** True when rendered from drafts (admin preview). */
  preview: boolean;
  /** Where the content came from: the database or the bundled seed (no DB at build). */
  source: "db" | "seed";
};

export type Testimonial = {
  id: number;
  quote: string;
  name: string;
  role: string;
  company: string;
  photo: string | null;
  project: string | null;
  rating: number | null;
  isDraft?: boolean;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  /** Resolved public URL (or null). */
  coverImage: string | null;
  category: string | null;
  tags: string[];
  body: RichDoc;
  seoTitle: string;
  seoDescription: string;
  /** YYYY-MM-DD; null only for unpublished drafts. */
  publishedAt: string | null;
  featured: boolean;
  readingMinutes: number;
  updatedAt: string;
  isDraft?: boolean;
};

export type { Faq, PricingPackage, Project, ProjectStatus, ProjectType } from "@/content/site";
