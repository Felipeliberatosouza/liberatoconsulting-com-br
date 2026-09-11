ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE POLICY "service products public read published"
  ON public.service_products
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

GRANT SELECT (
  id, slug, group_id, groups, family_id, family_title, code, title, lead, problem, body,
  audience, duration, duration_corporate, level, bullets, results, modules, limits, ai,
  position, published, translations, created_at, updated_at
) ON public.service_products TO anon;