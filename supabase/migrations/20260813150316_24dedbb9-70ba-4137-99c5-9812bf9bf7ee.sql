ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_campaigns_slug_key
  ON public.newsletter_campaigns (slug) WHERE slug IS NOT NULL;

GRANT SELECT ON public.newsletter_campaigns TO anon;

DROP POLICY IF EXISTS "Public can read published newsletters" ON public.newsletter_campaigns;
CREATE POLICY "Public can read published newsletters"
  ON public.newsletter_campaigns FOR SELECT TO anon, authenticated
  USING (slug IS NOT NULL AND published_at IS NOT NULL);