CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

CREATE TABLE public.tool_user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  revenue_range text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_user_profiles TO authenticated;
GRANT ALL ON public.tool_user_profiles TO service_role;
ALTER TABLE public.tool_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tool users read own profile" ON public.tool_user_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tool users create own profile" ON public.tool_user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tool users update own profile" ON public.tool_user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tool profiles" ON public.tool_user_profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tool_user_profiles_updated_at BEFORE UPDATE ON public.tool_user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.management_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Guia',
  cover_url text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.management_tools TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.management_tools TO authenticated;
GRANT ALL ON public.management_tools TO service_role;
ALTER TABLE public.management_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in users read published tools" ON public.management_tools FOR SELECT TO authenticated USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create tools" ON public.management_tools FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update tools" ON public.management_tools FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tools" ON public.management_tools FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER management_tools_updated_at BEFORE UPDATE ON public.management_tools FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tool_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id uuid NOT NULL REFERENCES public.management_tools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.tool_downloads TO authenticated;
GRANT ALL ON public.tool_downloads TO service_role;
ALTER TABLE public.tool_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tool users read own downloads" ON public.tool_downloads FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tool users record own downloads" ON public.tool_downloads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX tool_downloads_user_created_idx ON public.tool_downloads(user_id, created_at DESC);
CREATE INDEX management_tools_published_position_idx ON public.management_tools(published, position);