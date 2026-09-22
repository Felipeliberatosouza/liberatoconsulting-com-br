CREATE TABLE public.project_scope_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL DEFAULT '',
  respondent_name text NOT NULL DEFAULT '',
  respondent_role text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  comments jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'pt',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_scope_submissions TO authenticated;
GRANT INSERT ON public.project_scope_submissions TO anon;
GRANT ALL ON public.project_scope_submissions TO service_role;
ALTER TABLE public.project_scope_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a scope form" ON public.project_scope_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read scope submissions" ON public.project_scope_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update scope submissions" ON public.project_scope_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete scope submissions" ON public.project_scope_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER project_scope_submissions_updated_at BEFORE UPDATE ON public.project_scope_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  client_name text NOT NULL DEFAULT '',
  service_slug text NOT NULL DEFAULT '',
  service_title text NOT NULL DEFAULT '',
  scope_submission_id uuid REFERENCES public.project_scope_submissions(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  consultant_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_diagnostics TO authenticated;
GRANT ALL ON public.project_diagnostics TO service_role;
ALTER TABLE public.project_diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage diagnostics" ON public.project_diagnostics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER project_diagnostics_updated_at BEFORE UPDATE ON public.project_diagnostics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_diagnostic_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_slug text NOT NULL UNIQUE,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_diagnostic_templates TO authenticated;
GRANT ALL ON public.project_diagnostic_templates TO service_role;
ALTER TABLE public.project_diagnostic_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage diagnostic templates" ON public.project_diagnostic_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER project_diagnostic_templates_updated_at BEFORE UPDATE ON public.project_diagnostic_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();