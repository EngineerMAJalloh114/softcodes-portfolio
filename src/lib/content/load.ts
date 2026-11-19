import "server-only";
import { asc, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { cache } from "react";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/admin/settings";
import { publicUrl } from "@/lib/storage";
import { mediaIdFromRef } from "./fields";
import { contactFrom, seedContent } from "./seed-content";
import type { Project, SiteContent } from "./types";

/** Cache tag for all public content. Admin saves call updateTag(CONTENT_TAG). */
export const CONTENT_TAG = "content";

type Row<T> = T & { published: boolean; draft: unknown };

/** Live values, or (preview) live values overlaid with unpublished edits. */
function view<T extends object>(row: Row<T>, preview: boolean): T {
  return preview && row.draft && typeof row.draft === "object" ? ({ ...row, ...(row.draft as object) } as T) : row;
}

async function loadFromDb(preview: boolean): Promise<SiteContent> {
  const db = getDb();
  const fallback = seedContent();

  const [sectionRows, serviceRows, stackRows, projectRows, packageRows, faqRows, settings] = await Promise.all([
    db.select().from(schema.contentSections),
    db.select().from(schema.services).orderBy(asc(schema.services.sortOrder), asc(schema.services.id)),
    db.select().from(schema.stackItems).orderBy(asc(schema.stackItems.sortOrder), asc(schema.stackItems.id)),
    db.select().from(schema.projects).orderBy(asc(schema.projects.sortOrder), asc(schema.projects.id)),
    db.select().from(schema.pricingPackages).orderBy(asc(schema.pricingPackages.sortOrder), asc(schema.pricingPackages.id)),
    db.select().from(schema.faqs).orderBy(asc(schema.faqs.sortOrder), asc(schema.faqs.id)),
    getSettings(),
  ]);

  const section = <K extends keyof SiteContent>(key: string, seedValue: SiteContent[K]): SiteContent[K] => {
    const row = sectionRows.find((r) => r.key === key);
    if (!row) return seedValue;
    const value = preview && row.draft ? row.draft : row.data;
    // Seed values fill any key not stored yet (e.g. a field added in a later release).
    return { ...(seedValue as object), ...(value as object) } as SiteContent[K];
  };

  const visible = <T extends { published: boolean }>(rows: T[]) => (preview ? rows : rows.filter((r) => r.published));

  // Resolve media:<id> image references to public URLs (public bucket only).
  const projects: Project[] = visible(projectRows).map((r) => {
    const v = view(r, preview);
    return {
      slug: v.slug,
      name: v.name,
      tagline: v.tagline,
      summary: v.summary,
      status: v.status,
      featured: v.featured,
      kind: v.kind,
      type: v.type as Project["type"],
      tags: v.tags,
      problem: v.problem,
      solution: v.solution,
      features: v.features,
      stack: v.stack,
      screenshots: v.screenshots,
      links: v.links,
      ...(preview && !r.published ? { isDraft: true } : {}),
    };
  });

  const person = section<"person">("person", fallback.person);
  const refs = [person.photo, ...projects.flatMap((p) => p.screenshots.map((s) => s.src))]
    .map(mediaIdFromRef)
    .filter((id): id is string => !!id);
  const media = refs.length
    ? await db
        .select({ id: schema.media.id, key: schema.media.key, visibility: schema.media.visibility })
        .from(schema.media)
        .where(inArray(schema.media.id, [...new Set(refs)]))
    : [];
  const resolve = (ref: string | null): string | null => {
    const id = mediaIdFromRef(ref);
    if (!id) return ref;
    const m = media.find((x) => x.id === id);
    return m && m.visibility === "public" ? publicUrl(m.key) : null; // missing/private → placeholder
  };
  for (const p of projects) p.screenshots = p.screenshots.map((s) => ({ ...s, src: resolve(s.src) }));

  const servicesHeader = section<"services">("services_section", fallback.services);
  const stackHeader = section<"stack">("stack_section", fallback.stack);
  const site = section<"site">("site", fallback.site);

  return {
    site: { ...site, url: fallback.site.url }, // URL is deployment config, not content
    person: { ...person, photo: resolve(person.photo), location: settings.location },
    contact: contactFrom(settings.contactEmail, settings.whatsapp),
    nav: section<"nav">("nav", fallback.nav),
    hero: section<"hero">("hero", fallback.hero),
    about: section<"about">("about", fallback.about),
    services: {
      ...servicesHeader,
      items: visible(serviceRows).map((r) => {
        const v = view(r, preview);
        return { title: v.title, body: v.body };
      }),
    },
    process: section<"process">("process", fallback.process),
    projectsSection: section<"projectsSection">("projects_section", fallback.projectsSection),
    projects,
    stack: { ...stackHeader, items: visible(stackRows).map((r) => view(r, preview).name) },
    contactSection: section<"contactSection">("contact_section", fallback.contactSection),
    softCodes: section<"softCodes">("soft_codes", fallback.softCodes),
    footer: section<"footer">("footer", fallback.footer),
    pricing: section<"pricing">("pricing", fallback.pricing),
    packages: visible(packageRows).map((r) => {
      const v = view(r, preview);
      return {
        slug: v.slug,
        name: v.name,
        summary: v.summary,
        items: v.items,
        priceUsdMinor: v.priceUsdMinor,
        priceSleMinor: v.priceSleMinor,
        unit: v.unit,
        featured: v.featured,
        ...(preview && !r.published ? { isDraft: true } : {}),
      };
    }),
    faqs: visible(faqRows).map((r) => {
      const v = view(r, preview);
      return {
        question: v.question,
        answer: v.answer,
        category: v.category as SiteContent["faqs"][number]["category"],
        ...(preview && !r.published ? { isDraft: true } : {}),
      };
    }),
    pages: section<"pages">("pages", fallback.pages),
    preview,
    source: "db",
  };
}

const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

/**
 * Seed fallback only when there is no database (CI builds) or the DB fails *during the
 * build*. At runtime a DB error is thrown, so Next keeps serving the last good page
 * instead of silently reverting the site to seed content.
 */
async function loadOrFallback(preview: boolean): Promise<SiteContent> {
  if (!process.env.DATABASE_URL) return seedContent();
  try {
    return await loadFromDb(preview);
  } catch (error) {
    if (isBuild()) {
      console.warn("[content] database unavailable during build — using seed content", (error as Error).message);
      return seedContent();
    }
    throw error;
  }
}

const getPublished = unstable_cache(() => loadOrFallback(false), ["site-content", "v1"], {
  tags: [CONTENT_TAG],
  revalidate: 3600, // safety net; saves revalidate immediately via the tag
});

/** Published content only (no request needed): generateStaticParams, sitemap. */
export function getPublishedContent(): Promise<SiteContent> {
  return getPublished();
}

/**
 * Public site content. Published content is cached (tag "content"); in Draft Mode
 * (admin "Preview draft") drafts are read fresh on every request.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const { isEnabled } = await draftMode();
  return isEnabled ? loadOrFallback(true) : getPublished();
});

/** A single project by slug (published, or any in preview). */
export async function getProject(slug: string) {
  const content = await getSiteContent();
  return content.projects.find((p) => p.slug === slug);
}
