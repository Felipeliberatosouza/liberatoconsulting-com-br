CREATE TABLE public.project_presentations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  service_title text NOT NULL DEFAULT '',
  format text NOT NULL,
  website text NOT NULL DEFAULT '',
  sector text NOT NULL DEFAULT '',
  used_quote boolean NOT NULL DEFAULT false,
  used_scope boolean NOT NULL DEFAULT false,
  used_diagnostic boolean NOT NULL DEFAULT false,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.project_presentations TO authenticated;
GRANT ALL ON public.project_presentations TO service_role;
ALTER TABLE public.project_presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage presentations" ON public.project_presentations
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));