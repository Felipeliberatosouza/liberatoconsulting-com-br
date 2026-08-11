INSERT INTO public.site_settings (key, value)
VALUES ('branding', jsonb_build_object('whatsapp', '+5511913258668'))
ON CONFLICT (key) DO UPDATE
SET value = coalesce(public.site_settings.value, '{}'::jsonb) || jsonb_build_object('whatsapp', '+5511913258668');