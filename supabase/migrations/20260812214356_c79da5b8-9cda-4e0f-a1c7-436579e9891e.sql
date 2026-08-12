CREATE TABLE public.consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  photo_url text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  education text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  clients text NOT NULL DEFAULT '',
  works text NOT NULL DEFAULT '',
  specialties jsonb NOT NULL DEFAULT '[]'::jsonb,
  segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  contact_email text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultants TO authenticated;
GRANT ALL ON public.consultants TO service_role;

ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'::app_role
  )
$$;

CREATE POLICY "Equipe autenticada pode ver consultores"
ON public.consultants FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam consultores"
ON public.consultants FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER consultants_updated_at
BEFORE UPDATE ON public.consultants
FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();

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
  sort_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.full_name, c.photo_url, c.headline, c.education, c.experience,
         c.clients, c.works, c.specialties, c.segments, c.position AS sort_order
  FROM public.consultants c
  WHERE c.published = true
  ORDER BY c.position ASC, c.full_name ASC
$$;

GRANT EXECUTE ON FUNCTION public.list_public_consultants() TO anon, authenticated, service_role;