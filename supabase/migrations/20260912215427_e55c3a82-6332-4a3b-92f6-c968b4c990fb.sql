
-- EMPRESAS
CREATE TABLE public.crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trade_name text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT '',
  size text NOT NULL DEFAULT 'pme',
  status text NOT NULL DEFAULT 'lead',
  country text NOT NULL DEFAULT 'Brasil',
  state text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  founded_on date,
  employees integer,
  revenue_range text NOT NULL DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  birthday_email boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_companies TO authenticated;
GRANT ALL ON public.crm_companies TO service_role;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm companies" ON public.crm_companies FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER crm_companies_updated_at BEFORE UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

-- PESSOAS
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role_title text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  birth_date date,
  decision_maker boolean NOT NULL DEFAULT false,
  email_opt_in boolean NOT NULL DEFAULT true,
  birthday_email boolean NOT NULL DEFAULT true,
  language text NOT NULL DEFAULT 'pt',
  active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_contacts_company_idx ON public.crm_contacts(company_id);
CREATE INDEX crm_contacts_email_idx ON public.crm_contacts(lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm contacts" ON public.crm_contacts FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

-- DATAS IMPORTANTES
CREATE TABLE public.crm_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  label text NOT NULL,
  event_date date NOT NULL,
  recurring boolean NOT NULL DEFAULT true,
  notify_email boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_dates_company_idx ON public.crm_dates(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_dates TO authenticated;
GRANT ALL ON public.crm_dates TO service_role;
ALTER TABLE public.crm_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm dates" ON public.crm_dates FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER crm_dates_updated_at BEFORE UPDATE ON public.crm_dates
  FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

-- INTERAÇÕES
CREATE TABLE public.crm_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'nota',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_interactions_company_idx ON public.crm_interactions(company_id, occurred_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_interactions TO authenticated;
GRANT ALL ON public.crm_interactions TO service_role;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm interactions" ON public.crm_interactions FOR ALL TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER crm_interactions_updated_at BEFORE UPDATE ON public.crm_interactions
  FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

-- NAVEGAÇÃO NO SITE
CREATE TABLE public.crm_site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  email text,
  kind text NOT NULL DEFAULT 'page',
  path text NOT NULL,
  label text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'pt',
  country text NOT NULL DEFAULT '',
  referrer text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_site_events_visitor_idx ON public.crm_site_events(visitor_id, created_at DESC);
CREATE INDEX crm_site_events_email_idx ON public.crm_site_events(lower(email), created_at DESC);
GRANT SELECT ON public.crm_site_events TO authenticated;
GRANT ALL ON public.crm_site_events TO service_role;
ALTER TABLE public.crm_site_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read crm site events" ON public.crm_site_events FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

-- LOG DE ANIVERSÁRIOS ENVIADOS
CREATE TABLE public.crm_birthday_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  year integer NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, year)
);
GRANT SELECT ON public.crm_birthday_sends TO authenticated;
GRANT ALL ON public.crm_birthday_sends TO service_role;
ALTER TABLE public.crm_birthday_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read crm birthday sends" ON public.crm_birthday_sends FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));
