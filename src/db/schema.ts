/**
 * Database schema (Drizzle ORM, DEC-22) for Neon Postgres (M-08).
 *
 * Content tables mirror src/content/site.ts, which is the seed source
 * (scripts/db/seed.ts). Public pages still render from site.ts until T5.
 *
 * Auth tables (users, sessions, accounts, verifications, two_factors,
 * rate_limits) follow the Better Auth shape; auth logic is in src/lib/auth (T3).
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ------------------------------------------------------------------ */
/* Roles & users                                                       */
/* ------------------------------------------------------------------ */

export const roleKey = pgEnum("role_key", ["owner", "admin", "staff", "client"]);

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  key: roleKey("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    /** Better Auth twoFactor plugin (T3, K-04). */
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    /** Set for a one-time temporary password; cleared after the first password change (T3). */
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

/* Sessions-ready tables for Better Auth (T3). Not used yet. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/** TOTP secret + encrypted recovery codes (Better Auth twoFactor plugin, K-04). */
export const twoFactors = pgTable(
  "two_factors",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    verified: boolean("verified").notNull().default(true),
    failedVerificationCount: integer("failed_verification_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
  },
  (t) => [index("two_factors_user_id_idx").on(t.userId), index("two_factors_secret_idx").on(t.secret)],
);

/** Rate-limit counters shared by all server instances (K-14). */
export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Settings & audit log                                                */
/* ------------------------------------------------------------------ */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

/**
 * Append-only (K-16): a trigger in drizzle/0001_audit_log_append_only.sql
 * rejects UPDATE, DELETE and TRUNCATE.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    data: jsonb("data"),
    ip: text("ip"),
  },
  (t) => [index("audit_log_at_idx").on(t.at), index("audit_log_entity_idx").on(t.entity, t.entityId)],
);

/* ------------------------------------------------------------------ */
/* Content (mirrors src/content/site.ts)                               */
/* ------------------------------------------------------------------ */

/** One row per single-object section of site.ts (hero, about, nav, footer, pages, …). */
export const contentSectionKey = pgEnum("content_section_key", [
  "site",
  "person",
  "contact",
  "nav",
  "hero",
  "about",
  "services_section",
  "projects_section",
  "stack_section",
  "contact_section",
  "soft_codes",
  "footer",
  "pages",
  "process", // T5: process section (M-14 placeholder)
]);

/**
 * `data` is the published version; `draft` holds unpublished edits (T5). Publishing copies
 * draft → data. Only `data` is ever shown publicly.
 */
export const contentSections = pgTable("content_sections", {
  key: contentSectionKey("key").primaryKey(),
  data: jsonb("data").notNull(),
  draft: jsonb("draft"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  body: text("body").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  /** Unpublished edits (T5); live columns change only on publish. */
  draft: jsonb("draft"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const projectStatus = pgEnum("project_status", [
  "Live",
  "In development",
  "Coming soon",
  "Concept",
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  summary: text("summary").notNull(),
  status: projectStatus("status").notNull(),
  featured: boolean("featured").notNull().default(false),
  kind: text("kind").notNull(),
  problem: text("problem").notNull(),
  solution: text("solution").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  stack: jsonb("stack").$type<string[]>().notNull().default([]),
  screenshots: jsonb("screenshots")
    .$type<{ src: string | null; alt: string }[]>()
    .notNull()
    .default([]),
  links: jsonb("links").$type<{ label: string; href: string }[]>().notNull().default([]),
  /** For portfolio filters (M-11): website | platform | app | branding | other. */
  type: text("type").notNull().default("other"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  /** Unpublished edits (T5); live columns change only on publish. */
  draft: jsonb("draft"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const stackItems = pgTable("stack_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  /** Unpublished edits (T5); live columns change only on publish. */
  draft: jsonb("draft"),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Media (Neon object storage, DEC-32)                                 */
/* ------------------------------------------------------------------ */

export const mediaVisibility = pgEnum("media_visibility", ["public", "private"]);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    visibility: mediaVisibility("visibility").notNull(),
    mime: text("mime").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    alt: text("alt"),
    /** Original upload name (sanitised), for the library UI. */
    filename: text("filename"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("media_visibility_key_idx").on(t.visibility, t.key),
    check("media_size_nonnegative", sql`${t.size} >= 0`),
  ],
);

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export const leadStatus = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
  "spam",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    projectType: text("project_type"),
    budget: text("budget"),
    deadline: text("deadline"),
    message: text("message").notNull(),
    source: text("source").notNull().default("website"),
    status: leadStatus("status").notNull().default("new"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("leads_status_created_idx").on(t.status, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Prices ('from' prices, DEC-25: USD + SLE)                           */
/* ------------------------------------------------------------------ */

export const currency = pgEnum("currency", ["USD", "SLE"]);
export const pricePeriod = pgEnum("price_period", ["one_off", "monthly"]);

/** One row per package per currency. Amounts are integer minor units (cents). */
export const prices = pgTable(
  "prices",
  {
    id: serial("id").primaryKey(),
    packageKey: text("package_key").notNull(),
    name: text("name").notNull(),
    currency: currency("currency").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    period: pricePeriod("period").notNull().default("one_off"),
    isFrom: boolean("is_from").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    approved: boolean("approved").notNull().default(false),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("prices_package_currency_idx").on(t.packageKey, t.currency),
    check("prices_amount_nonnegative", sql`${t.amountMinor} >= 0`),
  ],
);
