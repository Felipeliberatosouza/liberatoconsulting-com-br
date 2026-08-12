CREATE TABLE public.brazil_scope_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key text NOT NULL,
  section_id text NOT NULL,
  lang text NOT NULL DEFAULT 'pt',
  segment text NOT NULL DEFAULT 'geral',
  region text NOT NULL DEFAULT 'todas',
  uf text NOT NULL DEFAULT 'todos',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_key, section_id, lang)
);

GRANT SELECT ON public.brazil_scope_content TO anon;
GRANT SELECT ON public.brazil_scope_content TO authenticated;
GRANT ALL ON public.brazil_scope_content TO service_role;

ALTER TABLE public.brazil_scope_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scope content public read" ON public.brazil_scope_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER brazil_scope_content_updated_at
  BEFORE UPDATE ON public.brazil_scope_content
  FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();