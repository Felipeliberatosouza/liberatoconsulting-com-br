ALTER TABLE public.consultants ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS consultants_slug_key ON public.consultants (slug) WHERE slug <> '';

DROP FUNCTION IF EXISTS public.list_public_consultants();

CREATE OR REPLACE FUNCTION public.list_public_consultants()
 RETURNS TABLE(id uuid, slug text, full_name text, photo_url text, headline text, education text, experience text, clients text, works text, specialties jsonb, segments jsonb, orcid_url text, lattes_url text, website_url text, years_experience integer, certifications jsonb, highlights jsonb, academic_logos jsonb, client_logos jsonb, sort_order integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.id, c.slug, c.full_name, c.photo_url, c.headline, c.education, c.experience,
         c.clients, c.works, c.specialties, c.segments, c.orcid_url, c.lattes_url,
         c.website_url, c.years_experience, c.certifications, c.highlights,
         c.academic_logos, c.client_logos, c.position AS sort_order
  FROM public.consultants c
  WHERE c.published = true
  ORDER BY c.position ASC, c.full_name ASC
$function$;