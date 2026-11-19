/**
 * DEC-37: every WhatsApp link on the site is built here from the Settings number — never
 * typed into content. Pure module.
 */

export const HIRE_MESSAGE = "Hi Mohamed, I'd like to talk about a project.";

/** Digits only, e.g. "+232 32 829 316" → "23232829316". */
export const whatsappDigits = (display: string) => display.replace(/\D/g, "");

export function whatsappUrl(display: string, message?: string): string {
  const base = `https://wa.me/${whatsappDigits(display)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Hand-typed WhatsApp links are refused in content (use a WhatsApp CTA instead). */
export const WHATSAPP_HOST_RE = /^https:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|(www\.)?whatsapp\.com)(\/|$)/i;

/** Call-to-action link: WhatsApp (number from Settings), a site/page URL, or an in-page anchor. */
export type Cta = { label: string; kind: "whatsapp" | "url" | "anchor"; href: string };
export const CTA_KINDS = [
  { value: "whatsapp", label: "WhatsApp (number from Settings)" },
  { value: "url", label: "Page or URL" },
  { value: "anchor", label: "Section on a page (#anchor)" },
] as const;

/** Resolve a CTA to an href. Legacy { label, href } values are treated as URLs. */
export function ctaHref(cta: Partial<Cta> & { href?: string }, whatsappDisplay: string): string {
  if (cta.kind === "whatsapp") return whatsappUrl(whatsappDisplay, HIRE_MESSAGE);
  return cta.href || "/";
}
