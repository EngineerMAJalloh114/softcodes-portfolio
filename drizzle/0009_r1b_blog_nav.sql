-- R1b: add "Blog" to the live nav before "Contact" (or at the end), unless a /blog link exists.
-- Owner-edited nav lists keep their order and labels.
UPDATE "content_sections" AS cs
SET "data" = jsonb_set(
  cs."data",
  '{links}',
  (
    SELECT jsonb_agg(elem ORDER BY ord)
    FROM (
      SELECT l.elem, l.ord::numeric AS ord
      FROM jsonb_array_elements(cs."data"->'links') WITH ORDINALITY AS l(elem, ord)
      UNION ALL
      SELECT '{"label":"Blog","href":"/blog"}'::jsonb,
        COALESCE(
          (SELECT c.ord - 0.5 FROM jsonb_array_elements(cs."data"->'links') WITH ORDINALITY AS c(elem, ord) WHERE c.elem->>'href' = '/contact' LIMIT 1),
          jsonb_array_length(cs."data"->'links') + 1
        )::numeric
    ) AS merged
  )
)
WHERE cs."key" = 'nav'
  AND jsonb_typeof(cs."data"->'links') = 'array'
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(cs."data"->'links') AS e WHERE e->>'href' = '/blog');
