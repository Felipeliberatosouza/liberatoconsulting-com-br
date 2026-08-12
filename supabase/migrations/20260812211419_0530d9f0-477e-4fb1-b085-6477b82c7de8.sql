CREATE TABLE public.bulletin_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT 'Todos',
  email text NOT NULL,
  whatsapp text NOT NULL DEFAULT '',
  via_email boolean NOT NULL DEFAULT true,
  via_whatsapp boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'pt',
  source_path text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  unsubscribed_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX bulletin_subscribers_email_key ON public.bulletin_subscribers (lower(email));
CREATE UNIQUE INDEX bulletin_subscribers_token_key ON public.bulletin_subscribers (unsubscribe_token);

GRANT ALL ON public.bulletin_subscribers TO service_role;
GRANT SELECT ON public.bulletin_subscribers TO authenticated;

ALTER TABLE public.bulletin_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read bulletin subscribers"
ON public.bulletin_subscribers
FOR SELECT
TO authenticated
USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER bulletin_subscribers_updated_at
BEFORE UPDATE ON public.bulletin_subscribers
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();