import { PROJECT_STATUSES_LIST, PROJECT_TYPE_OPTIONS } from "./options";
import { objectSchema, type Field } from "./fields";

/**
 * What the admin can edit (A-15, G-14). Pure module shared by the admin UI, the server
 * services and the tests. Contact email/WhatsApp/location come from Settings (G-20).
 */

const link = (name: string, label: string): Field => ({
  name,
  label,
  type: "group",
  fields: [
    { name: "label", label: "Label", type: "text", max: 60 },
    { name: "href", label: "Link", type: "href" },
  ],
});
const linkList = (name: string, label: string): Field => ({
  name,
  label,
  type: "list",
  itemLabel: "Link",
  max: 12,
  fields: [
    { name: "label", label: "Label", type: "text", max: 60 },
    { name: "href", label: "Link", type: "href" },
  ],
});
const eyebrow: Field = { name: "eyebrow", label: "Small label above the heading", type: "text", max: 60 };
const heading: Field = { name: "heading", label: "Heading", type: "text", max: 120 };
const meta = (name: string, label: string, extra: Field[] = []): Field => ({
  name,
  label,
  type: "group",
  fields: [
    { name: "title", label: "Page title (browser tab + search)", type: "text", max: 70 },
    { name: "description", label: "Meta description (search + social)", type: "textarea", max: 200 },
    ...extra,
  ],
});

export const SECTION_KEYS = [
  "hero",
  "about",
  "person",
  "services_section",
  "process",
  "projects_section",
  "stack_section",
  "contact_section",
  "soft_codes",
  "nav",
  "footer",
  "site",
  "pages",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionDef = { key: SectionKey; label: string; description: string; path: string; fields: Field[] };

export const SECTION_DEFS: Record<SectionKey, SectionDef> = {
  hero: {
    key: "hero",
    label: "Hero",
    description: "Top of the home page: name, title, pitch and the two buttons.",
    path: "/",
    fields: [
      eyebrow,
      { name: "name", label: "Name", type: "text", max: 80 },
      { name: "title", label: "Title", type: "text", max: 120 },
      { name: "pitch", label: "Pitch", type: "textarea", max: 300 },
      link("primaryCta", "Primary button"),
      link("secondaryCta", "Secondary button"),
    ],
  },
  about: {
    key: "about",
    label: "About",
    description: "Home page About section: bio paragraphs and quick facts.",
    path: "/#about",
    fields: [
      eyebrow,
      heading,
      { name: "paragraphs", label: "Bio paragraphs", type: "stringList", itemLabel: "Paragraph", max: 8, itemMax: 2000, multiline: true },
      {
        name: "facts",
        label: "Facts",
        type: "list",
        itemLabel: "Fact",
        max: 10,
        fields: [
          { name: "label", label: "Label", type: "text", max: 40 },
          { name: "value", label: "Value", type: "text", max: 160 },
        ],
      },
    ],
  },
  person: {
    key: "person",
    label: "Profile & portrait",
    description: "Your name, role and portrait (About section). Location comes from Settings.",
    path: "/#about",
    fields: [
      { name: "name", label: "Full name", type: "text", max: 80 },
      { name: "role", label: "Role", type: "text", max: 80 },
      { name: "company", label: "Company", type: "text", max: 80 },
      { name: "education", label: "Education", type: "text", max: 200 },
      { name: "experience", label: "Experience", type: "text", max: 200 },
      { name: "photo", label: "Portrait", type: "image", help: "TODO(DEC-30): owner will supply the final photo." },
      { name: "photoAlt", label: "Portrait description (alt text)", type: "text", max: 160 },
    ],
  },
  services_section: {
    key: "services_section",
    label: "Services — heading",
    description: "Heading of the Services section. The services themselves are a separate list.",
    path: "/#services",
    fields: [eyebrow, heading],
  },
  process: {
    key: "process",
    label: "Process (M-14)",
    description: "Discover → Design → Build → Launch → Support. Hidden until switched on.",
    path: "/#process",
    fields: [
      { name: "visible", label: "Show on the home page", type: "boolean" },
      eyebrow,
      heading,
      { name: "intro", label: "Intro", type: "textarea", max: 300 },
      {
        name: "steps",
        label: "Steps",
        type: "list",
        itemLabel: "Step",
        max: 8,
        fields: [
          { name: "title", label: "Title", type: "text", max: 40 },
          { name: "body", label: "Description", type: "textarea", max: 300 },
        ],
      },
    ],
  },
  projects_section: {
    key: "projects_section",
    label: "Projects — heading",
    description: "Heading of the featured projects on the home page.",
    path: "/#projects",
    fields: [
      eyebrow,
      heading,
      { name: "intro", label: "Intro", type: "textarea", max: 300 },
      { name: "allLabel", label: "\"All projects\" link text", type: "text", max: 40 },
    ],
  },
  stack_section: {
    key: "stack_section",
    label: "Stack — heading",
    description: "Heading of the Stack section. The tools themselves are a separate list.",
    path: "/#stack",
    fields: [eyebrow, heading],
  },
  contact_section: {
    key: "contact_section",
    label: "Contact section",
    description: "Contact section text and form labels. Email and WhatsApp come from Settings.",
    path: "/contact",
    fields: [
      eyebrow,
      heading,
      { name: "body", label: "Intro", type: "textarea", max: 300 },
      { name: "emailLabel", label: "Email label", type: "text", max: 40 },
      { name: "whatsappLabel", label: "WhatsApp label", type: "text", max: 40 },
      {
        name: "form",
        label: "Contact form",
        type: "group",
        fields: [
          { name: "nameLabel", label: "Name field label", type: "text", max: 40 },
          { name: "emailLabel", label: "Email field label", type: "text", max: 40 },
          { name: "messageLabel", label: "Message field label", type: "text", max: 40 },
          { name: "submitLabel", label: "Button text", type: "text", max: 40 },
          { name: "note", label: "Note under the form", type: "text", max: 160 },
          { name: "subjectPrefix", label: "Email subject prefix", type: "text", max: 60 },
        ],
      },
    ],
  },
  soft_codes: {
    key: "soft_codes",
    label: "Soft CODES page",
    description: "The company story page.",
    path: "/soft-codes",
    fields: [
      eyebrow,
      heading,
      { name: "lead", label: "Lead sentence", type: "textarea", max: 300 },
      { name: "paragraphs", label: "Story paragraphs", type: "stringList", itemLabel: "Paragraph", max: 10, itemMax: 2000, multiline: true },
      {
        name: "principles",
        label: "Principles",
        type: "list",
        itemLabel: "Principle",
        max: 6,
        fields: [
          { name: "title", label: "Title", type: "text", max: 60 },
          { name: "body", label: "Description", type: "textarea", max: 200 },
        ],
      },
      link("cta", "Button"),
    ],
  },
  nav: {
    key: "nav",
    label: "Navigation",
    description: "Top menu links and the \"Hire me\" button text.",
    path: "/",
    fields: [linkList("links", "Menu links"), { name: "hireLabel", label: "\"Hire me\" button text", type: "text", max: 30 }],
  },
  footer: {
    key: "footer",
    label: "Footer",
    description: "Tagline, copyright line and footer links.",
    path: "/",
    fields: [
      { name: "tagline", label: "Tagline", type: "text", max: 120 },
      { name: "copyright", label: "Copyright line", type: "text", max: 120 },
      linkList("links", "Footer links"),
    ],
  },
  site: {
    key: "site",
    label: "Site identity & SEO",
    description: "Default page title and description used in search results and link previews.",
    path: "/",
    fields: [
      { name: "name", label: "Site name", type: "text", max: 80 },
      { name: "shortName", label: "Short name", type: "text", max: 30 },
      { name: "title", label: "Default title", type: "text", max: 120 },
      { name: "description", label: "Default meta description", type: "textarea", max: 200 },
      { name: "locale", label: "Language code", type: "text", max: 10 },
    ],
  },
  pages: {
    key: "pages",
    label: "Page metadata & labels",
    description: "Titles, descriptions and fixed labels for the Projects, Contact, Soft CODES, case study and 404 pages.",
    path: "/projects",
    fields: [
      meta("projects", "Projects page", [
        { name: "heading", label: "Heading", type: "text", max: 120 },
        { name: "intro", label: "Intro", type: "textarea", max: 300 },
      ]),
      meta("contact", "Contact page"),
      meta("softCodes", "Soft CODES page"),
      {
        name: "caseStudy",
        label: "Case study labels",
        type: "group",
        fields: [
          ["back", "Back link"],
          ["problem", "Problem heading"],
          ["solution", "Solution heading"],
          ["features", "Features heading"],
          ["stack", "Stack label"],
          ["screenshots", "Screenshots heading"],
          ["status", "Status label"],
          ["type", "Type label"],
          ["links", "Links label"],
          ["noLinks", "No-links message"],
          ["screenshotPlaceholder", "Screenshot placeholder text"],
        ].map(([name, label]) => ({ name, label, type: "text" as const, max: 160 })),
      },
      {
        name: "notFound",
        label: "404 page",
        type: "group",
        fields: [
          { name: "title", label: "Title", type: "text", max: 80 },
          { name: "body", label: "Message", type: "text", max: 200 },
          { name: "cta", label: "Button text", type: "text", max: 40 },
        ],
      },
    ],
  },
};

export const sectionSchema = (key: SectionKey) => objectSchema(SECTION_DEFS[key].fields);
export const isSectionKey = (v: unknown): v is SectionKey =>
  typeof v === "string" && (SECTION_KEYS as readonly string[]).includes(v);

/* ------------------------------------------------------------------ */
/* Collections                                                         */
/* ------------------------------------------------------------------ */

export const COLLECTION_KEYS = ["services", "stack", "projects"] as const;
export type CollectionKey = (typeof COLLECTION_KEYS)[number];

export type CollectionDef = {
  key: CollectionKey;
  label: string;
  singular: string;
  /** Field shown as the item's name in lists. */
  titleField: string;
  description: string;
  path: string;
  /** Admin list URL. */
  adminPath: string;
  fields: Field[];
};

export const COLLECTION_DEFS: Record<CollectionKey, CollectionDef> = {
  services: {
    key: "services",
    label: "Services",
    singular: "service",
    titleField: "title",
    description: "The service cards on the home page.",
    path: "/#services",
    adminPath: "/admin/content/services",
    fields: [
      { name: "title", label: "Title", type: "text", max: 80 },
      { name: "body", label: "Description", type: "textarea", max: 400 },
    ],
  },
  stack: {
    key: "stack",
    label: "Stack",
    singular: "tool",
    titleField: "name",
    description: "The tools listed in the Stack section.",
    path: "/#stack",
    adminPath: "/admin/content/stack",
    fields: [{ name: "name", label: "Tool name", type: "text", max: 60 }],
  },
  projects: {
    key: "projects",
    label: "Projects",
    singular: "project",
    titleField: "name",
    description: "Portfolio projects and their case studies.",
    path: "/projects",
    adminPath: "/admin/projects",
    fields: [
      { name: "name", label: "Project name", type: "text", max: 80 },
      { name: "slug", label: "URL slug", type: "slug", help: "Used in the address: /projects/<slug>." },
      { name: "tagline", label: "Tagline", type: "text", max: 160 },
      { name: "summary", label: "Summary", type: "textarea", max: 400 },
      { name: "status", label: "Status", type: "select", options: PROJECT_STATUSES_LIST },
      { name: "featured", label: "Featured on the home page", type: "boolean" },
      { name: "kind", label: "Type label shown on cards", type: "text", max: 60, help: "e.g. Client website" },
      { name: "type", label: "Filter type (M-11)", type: "select", options: PROJECT_TYPE_OPTIONS },
      { name: "tags", label: "Tags", type: "stringList", itemLabel: "Tag", max: 12 },
      { name: "problem", label: "Case study: the problem", type: "textarea", max: 2000 },
      { name: "solution", label: "Case study: the solution", type: "textarea", max: 2000 },
      { name: "features", label: "Key features", type: "stringList", itemLabel: "Feature", max: 20 },
      { name: "stack", label: "Stack", type: "stringList", itemLabel: "Tool", max: 20 },
      {
        name: "screenshots",
        label: "Screenshots",
        type: "list",
        itemLabel: "Screenshot",
        max: 12,
        fields: [
          { name: "src", label: "Image", type: "image", help: "Leave empty to show the koala placeholder." },
          { name: "alt", label: "Description (alt text)", type: "text", max: 160 },
        ],
      },
      linkList("links", "Links"),
    ],
  },
};

export const collectionSchema = (key: CollectionKey) => objectSchema(COLLECTION_DEFS[key].fields);
export const isCollectionKey = (v: unknown): v is CollectionKey =>
  typeof v === "string" && (COLLECTION_KEYS as readonly string[]).includes(v);
