CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  country text NOT NULL,
  email text,
  service_slug text NOT NULL,
  service_title text,
  message text,
  language text,
  source_path text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX leads_ip_hash_created_at_idx ON public.leads (ip_hash, created_at DESC);
