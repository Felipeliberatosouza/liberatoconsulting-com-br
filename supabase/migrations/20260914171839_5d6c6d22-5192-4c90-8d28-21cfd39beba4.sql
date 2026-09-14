ALTER TABLE public.consultants
  ADD COLUMN IF NOT EXISTS years_experience integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS academic_logos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS client_logos jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP FUNCTION IF EXISTS public.list_public_consultants();

CREATE OR REPLACE FUNCTION public.list_public_consultants()
RETURNS TABLE (
  id uuid,
  full_name text,
  photo_url text,
  headline text,
  education text,
  experience text,
  clients text,
  works text,
  specialties jsonb,
  segments jsonb,
  orcid_url text,
  lattes_url text,
  website_url text,
  years_experience integer,
  certifications jsonb,
  highlights jsonb,
  academic_logos jsonb,
  client_logos jsonb,
  sort_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.full_name, c.photo_url, c.headline, c.education, c.experience,
         c.clients, c.works, c.specialties, c.segments, c.orcid_url, c.lattes_url,
         c.website_url, c.years_experience, c.certifications, c.highlights,
         c.academic_logos, c.client_logos, c.position AS sort_order
  FROM public.consultants c
  WHERE c.published = true
  ORDER BY c.position ASC, c.full_name ASC
$$;

GRANT EXECUTE ON FUNCTION public.list_public_consultants() TO anon, authenticated, service_role;