/**
 * Seed the database from src/content/site.ts (the seed source) and the R1a 'from'
 * prices (docs/product/R1A-PLAN.md). Idempotent: safe to run repeatedly.
 * Since T5 the admin CMS owns content: the seed only inserts what is missing and never
 * overwrites content the owner has edited.
 * Prices are seeded with approved=false until the owner approves them (DEC-O11).
 */
import { sql } from "drizzle-orm";
import { z } from "zod";
import * as content from "../../src/content/site";
import { scriptDb, schema, type ScriptDb } from "./client";

const ROLES = [
  { key: "owner", name: "Owner", description: "Full control, including billing and admins" },
  { key: "admin", name: "Admin", description: "Manages content, leads and settings" },
  { key: "staff", name: "Staff", description: "Works on assigned projects" },
  { key: "client", name: "Client", description: "Client portal access to own projects" },
] as const;

// USD / SLE (~23 SLE per USD). Amounts in whole units here; stored as minor units (×100).
const PRICE_SEED = [
  { packageKey: "landing", name: "Landing page", usd: 150, sle: 3_500, period: "one_off" },
  { packageKey: "business-site", name: "Business site", usd: 400, sle: 9_200, period: "one_off" },
  { packageKey: "site-admin", name: "Site + admin", usd: 900, sle: 20_700, period: "one_off" },
  { packageKey: "ecommerce-booking", name: "E-commerce / booking", usd: 1_200, sle: 27_600, period: "one_off" },
  { packageKey: "web-app-platform", name: "Web app / platform", usd: 2_500, sle: 57_500, period: "one_off" },
  { packageKey: "ui-brand", name: "UI & brand", usd: 150, sle: 3_500, period: "one_off" },
  { packageKey: "maintenance", name: "Maintenance", usd: 25, sle: 575, period: "monthly" },
] as const;

// K-15: validate seed input before it is written.
const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  tagline: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(["Live", "In development", "Coming soon", "Concept"]),
  featured: z.boolean(),
  kind: z.string().min(1),
  type: z.enum(content.PROJECT_TYPES),
  tags: z.array(z.string()),
  problem: z.string().min(1),
  solution: z.string().min(1),
  features: z.array(z.string()),
  stack: z.array(z.string()),
  screenshots: z.array(z.object({ src: z.string().nullable(), alt: z.string() })),
  links: z.array(z.object({ label: z.string(), href: z.url() })),
});
const serviceSchema = z.object({ title: z.string().min(1), body: z.string().min(1) });
const priceSchema = z.object({
  packageKey: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  usd: z.number().int().positive(),
  sle: z.number().int().positive(),
  period: z.enum(["one_off", "monthly"]),
});

const toMinor = (whole: number) => whole * 100;

export async function seed(db: ScriptDb) {
  const projects = z.array(projectSchema).parse(content.projects);
  const services = z.array(serviceSchema).parse(content.services.items);
  const prices = z.array(priceSchema).parse(PRICE_SEED);

  // `url` is deployment config (env), not content — leave it out of the DB.
  const { url: _url, ...siteContent } = content.site;
  void _url;
  const { items: _services, ...servicesSection } = content.services;
  const { items: stackNames, ...stackSection } = content.stack;
  void _services;

  const sections: { key: (typeof schema.contentSectionKey.enumValues)[number]; data: unknown }[] = [
    { key: "site", data: siteContent },
    { key: "person", data: content.person },
    { key: "nav", data: content.nav },
    { key: "hero", data: content.hero },
    { key: "about", data: content.about },
    { key: "services_section", data: servicesSection },
    { key: "projects_section", data: content.projectsSection },
    { key: "stack_section", data: stackSection },
    { key: "contact_section", data: content.contactSection },
    { key: "soft_codes", data: content.softCodes },
    { key: "footer", data: content.footer },
    { key: "pages", data: content.pages },
    { key: "process", data: content.processSection },
    { key: "pricing", data: content.pricing },
  ];

  const excluded = (col: string) => sql.raw(`excluded."${col}"`);

  // db.batch runs all statements in one transaction over HTTP.
  await db.batch([
    db
      .insert(schema.roles)
      .values(ROLES.map((r) => ({ ...r })))
      .onConflictDoUpdate({
        target: schema.roles.key,
        set: { name: excluded("name"), description: excluded("description") },
      }),
    db.insert(schema.contentSections).values(sections).onConflictDoNothing({ target: schema.contentSections.key }),
    db
      .insert(schema.services)
      .values(services.map((s, i) => ({ ...s, sortOrder: i })))
      .onConflictDoNothing({ target: schema.services.title }),
    db
      .insert(schema.projects)
      .values(projects.map((p, i) => ({ ...p, sortOrder: i })))
      // T5 backfill: fill type/tags only on rows that still have the column defaults.
      .onConflictDoUpdate({
        target: schema.projects.slug,
        set: { type: excluded("type"), tags: excluded("tags") },
        setWhere: sql`${schema.projects.type} = 'other' and ${schema.projects.tags} = '[]'::jsonb`,
      }),
    db
      .insert(schema.stackItems)
      .values(stackNames.map((name, i) => ({ name, sortOrder: i })))
      .onConflictDoNothing({ target: schema.stackItems.name }),
    // T6: DEC-38 packages published; FAQs seeded as drafts (DEC-21). Never overwrite CMS edits.
    db
      .insert(schema.pricingPackages)
      .values(content.packages.map((p, i) => ({ ...p, sortOrder: i, published: true })))
      .onConflictDoNothing({ target: schema.pricingPackages.slug }),
    db
      .insert(schema.faqs)
      .values(content.faqs.map((f, i) => ({ ...f, sortOrder: i, published: false })))
      .onConflictDoNothing({ target: schema.faqs.question }),
    db
      .insert(schema.prices)
      .values(
        prices.flatMap((p, i) => [
          { packageKey: p.packageKey, name: p.name, currency: "USD" as const, amountMinor: toMinor(p.usd), period: p.period, sortOrder: i },
          { packageKey: p.packageKey, name: p.name, currency: "SLE" as const, amountMinor: toMinor(p.sle), period: p.period, sortOrder: i },
        ]),
      )
      // Don't overwrite prices the owner has already edited/approved.
      .onConflictDoNothing({ target: [schema.prices.packageKey, schema.prices.currency] }),
    db
      .insert(schema.settings)
      .values([
        { key: "pricing.currencies", value: ["USD", "SLE"] },
        { key: "pricing.sle_per_usd", value: 23 },
        { key: "pricing.approved", value: false },
      ])
      .onConflictDoNothing({ target: schema.settings.key }),
  ]);
}

export async function countRows(db: ScriptDb) {
  const tables = [
    "roles", "users", "sessions", "accounts", "verifications", "settings", "audit_log",
    "content_sections", "services", "projects", "stack_items", "media", "leads", "prices", "pricing_packages", "faqs",
  ];
  const out: Record<string, number> = {};
  for (const t of tables) {
    const r = await db.execute<{ n: number }>(sql`select count(*)::int as n from ${sql.identifier(t)}`);
    out[t] = r.rows[0].n;
  }
  return out;
}

// CLI: `npm run db:seed` (skipped when imported by another script)
if (process.argv[1]?.endsWith("seed.ts")) {
  const db = scriptDb();
  seed(db)
    .then(() => countRows(db))
    .then((counts) => console.log("seeded", counts))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
