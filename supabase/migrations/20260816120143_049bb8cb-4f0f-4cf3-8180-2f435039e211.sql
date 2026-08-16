CREATE TABLE public.brazil_topic_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id TEXT NOT NULL,
  topic_index INTEGER NOT NULL,
  lang TEXT NOT NULL DEFAULT 'pt',
  topic_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (section_id, topic_index, lang)
);

GRANT SELECT ON public.brazil_topic_content TO anon;
GRANT SELECT ON public.brazil_topic_content TO authenticated;
GRANT ALL ON public.brazil_topic_content TO service_role;

ALTER TABLE public.brazil_topic_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read brazil topic content"
ON public.brazil_topic_content FOR SELECT
USING (true);