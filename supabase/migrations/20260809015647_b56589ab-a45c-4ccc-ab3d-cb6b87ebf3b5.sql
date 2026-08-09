CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  interest_area text NOT NULL,
  linkedin_url text,
  resume_path text,
  resume_filename text,
  language text,
  source_path text,
  ip_hash text,
  emailed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX job_applications_ip_hash_created_at_idx ON public.job_applications (ip_hash, created_at DESC);