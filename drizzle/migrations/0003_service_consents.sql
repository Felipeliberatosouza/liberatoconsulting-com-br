CREATE TABLE public.service_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  service text NOT NULL,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT '',
  via_email boolean NOT NULL DEFAULT true,
  via_whatsapp boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid,
  invited_by_name text NOT NULL DEFAULT '',
  invited_at timestamptz NOT NULL DEFAULT now(),
  invite_email_status text NOT NULL DEFAULT '',
  invite_whatsapp_status text NOT NULL DEFAULT '',
  approved_at timestamptz,
  approved_ip text NOT NULL DEFAULT '',
  approved_user_agent text NOT NULL DEFAULT '',
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_consents TO authenticated;
GRANT ALL ON public.service_consents TO service_role;
ALTER TABLE public.service_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read consents" ON public.service_consents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX service_consents_email_idx ON public.service_consents (lower(email));
CREATE TRIGGER service_consents_updated BEFORE UPDATE ON public.service_consents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();