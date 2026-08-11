DROP POLICY IF EXISTS "settings public read" ON public.site_settings;
CREATE POLICY "settings public read" ON public.site_settings
FOR SELECT USING (key = ANY (ARRAY['theme','texts','branding','hero','brazil']));