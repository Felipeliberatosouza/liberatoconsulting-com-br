CREATE TABLE public.delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  reference_id uuid,
  subject text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  recipient_email text NOT NULL DEFAULT '',
  recipient_phone text NOT NULL DEFAULT '',
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'enviado',
  error text NOT NULL DEFAULT '',
  is_test boolean NOT NULL DEFAULT false,
  retroactive boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX delivery_log_sent_at_idx ON public.delivery_log (sent_at DESC);
CREATE INDEX delivery_log_ref_idx ON public.delivery_log (reference_id);
GRANT SELECT ON public.delivery_log TO authenticated;
GRANT ALL ON public.delivery_log TO service_role;
ALTER TABLE public.delivery_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read delivery log" ON public.delivery_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));