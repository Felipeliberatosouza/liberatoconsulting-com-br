ALTER TABLE public.consultants
  ADD COLUMN IF NOT EXISTS orcid_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS lattes_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url text NOT NULL DEFAULT '';

DROP FUNCTION IF EXISTS public.list_public_consultants();

CREATE FUNCTION public.list_public_consultants()
RETURNS TABLE(id uuid, full_name text, photo_url text, headline text, education text, experience text, clients text, works text, specialties jsonb, segments jsonb, orcid_url text, lattes_url text, website_url text, sort_order integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select c.id, c.full_name, c.photo_url, c.headline, c.education, c.experience,
         c.clients, c.works, c.specialties, c.segments,
         c.orcid_url, c.lattes_url, c.website_url, c.position as sort_order
  from public.consultants c
  where c.published
  order by c.position asc, c.full_name asc
$$;

REVOKE EXECUTE ON FUNCTION public.list_public_consultants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_public_consultants() TO service_role;