ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS whatsapp text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS via_whatsapp boolean NOT NULL DEFAULT false;