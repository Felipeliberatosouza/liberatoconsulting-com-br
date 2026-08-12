ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'autor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'consultor';

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  birth_date date,
  cpf text NOT NULL DEFAULT '',
  rg text NOT NULL DEFAULT '',
  nationality text NOT NULL DEFAULT '',
  marital_status text NOT NULL DEFAULT '',
  address_street text NOT NULL DEFAULT '',
  address_number text NOT NULL DEFAULT '',
  address_complement text NOT NULL DEFAULT '',
  address_district text NOT NULL DEFAULT '',
  address_city text NOT NULL DEFAULT '',
  address_state text NOT NULL DEFAULT '',
  address_zip text NOT NULL DEFAULT '',
  address_country text NOT NULL DEFAULT 'Brasil',
  bank_name text NOT NULL DEFAULT '',
  bank_branch text NOT NULL DEFAULT '',
  bank_account text NOT NULL DEFAULT '',
  pix_key text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  email_opt_in boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles admin all" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  requester_name text NOT NULL DEFAULT '',
  kind text NOT NULL,
  action text NOT NULL DEFAULT 'update',
  target_id text,
  title text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  review_note text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_requests TO authenticated;
GRANT ALL ON public.change_requests TO service_role;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "change requests admin all" ON public.change_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "change requests read own" ON public.change_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid());
CREATE POLICY "change requests insert own" ON public.change_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE TRIGGER change_requests_updated_at BEFORE UPDATE ON public.change_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email_opt_in boolean NOT NULL DEFAULT true;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS email_opt_in boolean NOT NULL DEFAULT true;