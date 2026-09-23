UPDATE public.newsletter_campaigns
SET published_at = COALESCE(published_at, sent_at, created_at)
WHERE published_at IS NULL AND status = 'sent';

WITH base AS (
  SELECT id,
         regexp_replace(
           trim(both '-' from regexp_replace(
             lower(translate(subject,
               'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
               'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')),
             '[^a-z0-9]+', '-', 'g')),
           '^$', 'newsletter') AS raw_slug,
         created_at
  FROM public.newsletter_campaigns
  WHERE (slug IS NULL OR slug = '')
    AND (published_at IS NOT NULL OR status = 'sent')
), numbered AS (
  SELECT id,
         left(raw_slug, 80) AS s,
         row_number() OVER (PARTITION BY left(raw_slug, 80) ORDER BY created_at) AS rn
  FROM base
)
UPDATE public.newsletter_campaigns c
SET slug = CASE WHEN n.rn = 1 THEN n.s ELSE n.s || '-' || n.rn END
FROM numbered n
WHERE c.id = n.id
  AND NOT EXISTS (
    SELECT 1 FROM public.newsletter_campaigns x
    WHERE x.slug = CASE WHEN n.rn = 1 THEN n.s ELSE n.s || '-' || n.rn END
  );