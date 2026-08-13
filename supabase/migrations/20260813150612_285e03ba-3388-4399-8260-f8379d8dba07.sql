WITH base AS (
  SELECT id,
    left(regexp_replace(regexp_replace(
      translate(lower(subject),
        'áàâãäéèêëíìîïóòôõöúùûüçñ',
        'aaaaaeeeeiiiiooooouuuucn'),
      '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'), 70) AS s,
    created_at,
    row_number() OVER (
      PARTITION BY left(regexp_replace(regexp_replace(
        translate(lower(subject),
          'áàâãäéèêëíìîïóòôõöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'),
        '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'), 70)
      ORDER BY created_at
    ) AS rn
  FROM public.newsletter_campaigns
  WHERE slug IS NULL
)
UPDATE public.newsletter_campaigns c
SET slug = CASE WHEN b.rn = 1 THEN b.s ELSE b.s || '-' || b.rn END,
    published_at = COALESCE(c.published_at, c.created_at)
FROM base b
WHERE c.id = b.id;