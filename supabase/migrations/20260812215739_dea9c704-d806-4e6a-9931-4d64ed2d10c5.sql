CREATE TABLE public.bulletin_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT '',
  date_label text NOT NULL DEFAULT '',
  sent_email integer NOT NULL DEFAULT 0,
  sent_whatsapp integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  last_error text,
  is_test boolean NOT NULL DEFAULT false,
  body_html text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bulletin_dispatches TO authenticated;
GRANT ALL ON public.bulletin_dispatches TO service_role;

ALTER TABLE public.bulletin_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bulletin dispatches"
ON public.bulletin_dispatches
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX bulletin_dispatches_created_at_idx ON public.bulletin_dispatches (created_at DESC);