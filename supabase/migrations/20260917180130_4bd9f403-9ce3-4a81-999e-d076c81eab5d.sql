GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

DROP POLICY IF EXISTS "settings public read" ON public.site_settings;
CREATE POLICY "settings public read"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY['theme'::text, 'texts'::text, 'branding'::text, 'hero'::text, 'brazil'::text, 'banners'::text, 'institutional'::text]));