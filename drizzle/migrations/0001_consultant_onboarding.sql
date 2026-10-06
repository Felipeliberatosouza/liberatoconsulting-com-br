CREATE TABLE public.consultant_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'sent',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  sent_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_note text NOT NULL DEFAULT '',
  consultant_id uuid,
  user_id uuid,
  contract_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultant_onboarding TO authenticated;
GRANT ALL ON public.consultant_onboarding TO service_role;
ALTER TABLE public.consultant_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage consultant onboarding" ON public.consultant_onboarding
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER consultant_onboarding_updated_at BEFORE UPDATE ON public.consultant_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();