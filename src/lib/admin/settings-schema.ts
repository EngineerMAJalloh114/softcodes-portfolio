import { z } from "zod";
import { contact, person } from "@/content/site";

/**
 * Admin settings (G-20) — validation (K-15) shared by the server action, the service and
 * tests. Pure module (no server imports).
 */

export const CURRENCIES = ["USD", "SLE"] as const; // DEC-25

export const settingsSchema = z.object({
  contactEmail: z.email("Enter a valid email address.").max(254),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 ]{6,19}$/, "Use digits and spaces, e.g. +232 32 829 316."),
  location: z.string().trim().min(2, "Location is too short.").max(100, "Location is too long."),
  // DEC-O8 (deposit policy) is still open: configurable, default 50%.
  depositPercent: z.coerce
    .number({ error: "Deposit must be a number." })
    .int("Deposit must be a whole number.")
    .min(0, "Deposit can't be below 0%.")
    .max(100, "Deposit can't be above 100%."),
  currencies: z
    .array(z.enum(CURRENCIES))
    .min(1, "Choose at least one currency.")
    .transform((list) => CURRENCIES.filter((c) => list.includes(c))), // stable order, no dupes
  // M-06: floating WhatsApp button on public pages (checkbox: "on" / absent).
  whatsappButton: z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean()),
  // M-04: CV file — a public PDF from the media library, or none.
  cvMediaId: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.uuid("Choose a file from the media library.").nullable(),
  ),
});

export type SettingsInput = z.input<typeof settingsSchema>;
export type Settings = z.output<typeof settingsSchema>;

/** Values used until the owner saves settings (from src/content/site.ts + decisions). */
export const DEFAULT_SETTINGS: Settings = {
  contactEmail: contact.email,
  whatsapp: contact.whatsappDisplay,
  location: person.location,
  depositPercent: 50,
  currencies: ["USD", "SLE"],
  whatsappButton: true,
  cvMediaId: null,
};

/** Storage keys in the `settings` table. */
export const SETTING_KEYS = {
  contact: "site.contact",
  depositPercent: "payments.deposit_percent",
  currencies: "pricing.currencies",
  whatsappButton: "site.whatsapp_button",
  cvMediaId: "site.cv_media_id",
} as const;

/** wa.me link from a display number (DEC-37: the single WhatsApp link builder). */
export { whatsappUrl } from "@/lib/content/whatsapp";
