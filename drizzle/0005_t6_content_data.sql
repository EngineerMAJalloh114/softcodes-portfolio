-- T6 / DEC-37: hero buttons become typed CTAs (whatsapp | url | anchor).
-- A hand-typed WhatsApp link becomes kind "whatsapp" (number from Settings).
CREATE OR REPLACE FUNCTION t6_to_cta(cta jsonb) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN cta IS NULL OR cta ? 'kind' THEN cta
    WHEN cta->>'href' ~* '^https://(wa\.me|api\.whatsapp\.com)' THEN jsonb_build_object('label', cta->>'label', 'kind', 'whatsapp', 'href', '')
    WHEN cta->>'href' ~ '^(/[^#]*)?#' THEN jsonb_build_object('label', cta->>'label', 'kind', 'anchor', 'href', cta->>'href')
    ELSE jsonb_build_object('label', cta->>'label', 'kind', 'url', 'href', coalesce(cta->>'href', '/'))
  END
$$;
--> statement-breakpoint
UPDATE content_sections
SET data = data || jsonb_build_object('primaryCta', t6_to_cta(data->'primaryCta'), 'secondaryCta', t6_to_cta(data->'secondaryCta')),
    draft = CASE WHEN draft IS NULL THEN NULL
                 ELSE draft || jsonb_build_object('primaryCta', t6_to_cta(draft->'primaryCta'), 'secondaryCta', t6_to_cta(draft->'secondaryCta')) END
WHERE key = 'hero';
--> statement-breakpoint
DROP FUNCTION t6_to_cta(jsonb);
--> statement-breakpoint
-- Nav: add About page, Pricing and FAQ — only if the menu is still the original seed list.
UPDATE content_sections
SET data = jsonb_set(data, '{links}', '[
  {"label": "About", "href": "/about"},
  {"label": "Services", "href": "/#services"},
  {"label": "Projects", "href": "/projects"},
  {"label": "Pricing", "href": "/pricing"},
  {"label": "FAQ", "href": "/faq"},
  {"label": "Contact", "href": "/contact"}
]'::jsonb)
WHERE key = 'nav'
  AND data->'links' = '[
  {"label": "About", "href": "/#about"},
  {"label": "Services", "href": "/#services"},
  {"label": "Projects", "href": "/projects"},
  {"label": "Stack", "href": "/#stack"},
  {"label": "Contact", "href": "/contact"}
]'::jsonb;
--> statement-breakpoint
-- The "contact" section is unused since T5 (contact details come from Settings) and held a
-- hand-typed WhatsApp link; remove it (DEC-37).
DELETE FROM content_sections WHERE key = 'contact';
