import { z } from "zod";
import { CTA_KINDS, WHATSAPP_HOST_RE } from "./whatsapp";

/**
 * Field specs for admin content forms. One spec drives both the admin form (UI) and
 * server-side validation (K-15), so the two can't drift apart. Pure module.
 *
 * Every key a public page reads must be described here: validation strips unknown keys.
 */
export type Field =
  | { name: string; label: string; type: "text" | "textarea"; required?: boolean; max?: number; help?: string }
  | { name: string; label: string; type: "href"; required?: boolean; help?: string }
  | { name: string; label: string; type: "slug"; help?: string }
  | { name: string; label: string; type: "boolean"; help?: string }
  | { name: string; label: string; type: "image"; help?: string }
  | { name: string; label: string; type: "select"; options: readonly { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: "stringList"; itemLabel: string; max?: number; itemMax?: number; multiline?: boolean; help?: string }
  | { name: string; label: string; type: "list"; itemLabel: string; fields: Field[]; max?: number; help?: string }
  | { name: string; label: string; type: "group"; fields: Field[]; help?: string }
  /** Call to action: label + link type (whatsapp | url | anchor). WhatsApp uses the Settings number (DEC-37). */
  | { name: string; label: string; type: "cta"; help?: string }
  /** Money in integer minor units (cents); the form shows major units (e.g. 3,500). */
  | { name: string; label: string; type: "money"; currency: "USD" | "SLE"; help?: string };

/** Links: site paths, in-page anchors, https URLs, mailto:, tel:, WhatsApp. */
export const HREF_RE = /^(\/(?!\/)[^\s]*|#[\w-]*|https:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9 ]+)$/;

/** Image references: a /public path, an https URL, or `media:<uuid>` from the library. */
export const MEDIA_REF_RE = /^media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const IMAGE_REF_RE = /^(\/(?!\/)[\w\-./]+\.(?:jpe?g|png|webp|gif|avif|svg)|https:\/\/[^\s]+)$/i;
export const isImageRef = (v: string) => MEDIA_REF_RE.test(v) || IMAGE_REF_RE.test(v);
export const mediaIdFromRef = (v: string | null | undefined) => (v ? (MEDIA_REF_RE.exec(v)?.[1] ?? null) : null);

const DEFAULT_MAX = { text: 200, textarea: 4000 } as const;

function zodFor(field: Field): z.ZodType {
  switch (field.type) {
    case "text":
    case "textarea": {
      const max = field.max ?? DEFAULT_MAX[field.type];
      const base = z.string().trim().max(max, `${field.label}: at most ${max} characters.`);
      return field.required === false ? base : base.min(1, `${field.label} is required.`);
    }
    case "href": {
      const base = z
        .string()
        .trim()
        .max(2000)
        .refine((v) => v === "" || HREF_RE.test(v), `${field.label}: use a /path, #anchor, https:// link, mailto: or tel:.`)
        .refine((v) => !WHATSAPP_HOST_RE.test(v), WHATSAPP_MESSAGE(field.label));
      return field.required === false ? base : base.refine((v) => v !== "", `${field.label} is required.`);
    }
    case "slug":
      return z
        .string()
        .trim()
        .min(2, `${field.label} is too short.`)
        .max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${field.label}: lowercase letters, numbers and single hyphens.`);
    case "boolean":
      return z.boolean();
    case "image":
      return z
        .string()
        .trim()
        .max(2000)
        .nullable()
        .transform((v) => (v ? v : null))
        .refine((v) => v === null || isImageRef(v), `${field.label}: pick from the media library or use a /path or https:// URL.`);
    case "select":
      return z.enum(field.options.map((o) => o.value) as [string, ...string[]], { error: `${field.label}: choose an option.` });
    case "stringList":
      return z
        .array(
          z
            .string()
            .trim()
            .min(1, `${field.itemLabel} can't be empty.`)
            .max(field.itemMax ?? 200, `${field.itemLabel}: at most ${field.itemMax ?? 200} characters.`),
        )
        .max(field.max ?? 50, `${field.label}: too many items.`);
    case "list":
      return z.array(objectSchema(field.fields)).max(field.max ?? 50, `${field.label}: too many items.`);
    case "group":
      return objectSchema(field.fields);
    case "cta":
      return ctaSchema(field.label);
    case "money":
      return z
        .number({ error: `${field.label}: enter an amount.` })
        .int(`${field.label}: whole cents only.`)
        .min(0, `${field.label} can't be negative.`)
        .max(1_000_000_000, `${field.label} is too large.`);
  }
}

const WHATSAPP_MESSAGE = (label: string) =>
  `${label}: don't type WhatsApp links — use the WhatsApp link type; the number comes from Settings (DEC-37).`;

export function ctaSchema(label: string) {
  return z
    .object({
      label: z.string().trim().min(1, `${label}: button text is required.`).max(60),
      kind: z.enum(CTA_KINDS.map((k) => k.value) as ["whatsapp", "url", "anchor"], { error: `${label}: choose a link type.` }),
      href: z.string().trim().max(2000).default(""),
    })
    .superRefine((v, ctx) => {
      if (v.kind === "whatsapp") return; // href ignored: built from Settings
      if (WHATSAPP_HOST_RE.test(v.href)) {
        ctx.addIssue({ code: "custom", path: ["href"], message: WHATSAPP_MESSAGE(label) });
      } else if (v.kind === "anchor" && !/^(\/[^\s#]*)?#[\w-]+$/.test(v.href)) {
        ctx.addIssue({ code: "custom", path: ["href"], message: `${label}: an anchor looks like #services or /#services.` });
      } else if (v.kind === "url" && (!HREF_RE.test(v.href) || v.href.startsWith("#"))) {
        ctx.addIssue({ code: "custom", path: ["href"], message: `${label}: use a /path or https:// link.` });
      }
    })
    .transform((v) => (v.kind === "whatsapp" ? { ...v, href: "" } : v));
}

/** "3,500.50" → 350050 (minor units); null if not a valid amount. */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/[\s,]/g, "").replace(/^(\$|le)/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** 350050 → "3,500.50"; whole amounts without decimals. */
export function formatMajor(minor: number): string {
  const major = minor / 100;
  return major.toLocaleString("en-US", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 });
}

/** Zod schema for an object described by `fields` (unknown keys are stripped). */
export function objectSchema(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.name, zodFor(f)])));
}

/** Empty value for a field (used for "Add item" in lists). */
export function emptyValue(field: Field): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    case "image":
      return null;
    case "select":
      return field.options[0]?.value ?? "";
    case "stringList":
      return [];
    case "list":
      return [];
    case "group":
      return emptyObject(field.fields);
    case "cta":
      return { label: "", kind: "url", href: "" };
    case "money":
      return 0;
    default:
      return "";
  }
}

export function emptyObject(fields: Field[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.name, emptyValue(f)]));
}

/** Flatten Zod issues to "path: message" strings for toasts and inline errors. */
export function issuesToErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    out[path || "_"] ??= issue.message;
  }
  return out;
}
