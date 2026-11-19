import { z } from "zod";

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
  | { name: string; label: string; type: "stringList"; itemLabel: string; max?: number; help?: string }
  | { name: string; label: string; type: "list"; itemLabel: string; fields: Field[]; max?: number; help?: string }
  | { name: string; label: string; type: "group"; fields: Field[]; help?: string };

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
        .refine((v) => v === "" || HREF_RE.test(v), `${field.label}: use a /path, #anchor, https:// link, mailto: or tel:.`);
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
        .array(z.string().trim().min(1, `${field.itemLabel} can't be empty.`).max(200))
        .max(field.max ?? 50, `${field.label}: too many items.`);
    case "list":
      return z.array(objectSchema(field.fields)).max(field.max ?? 50, `${field.label}: too many items.`);
    case "group":
      return objectSchema(field.fields);
  }
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
