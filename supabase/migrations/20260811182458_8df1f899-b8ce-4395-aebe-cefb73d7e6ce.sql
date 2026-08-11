ALTER TABLE public.content_articles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS authors text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS author_contact text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS read_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_sum integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.article_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  file_path text,
  file_name text,
  language text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.article_submissions TO service_role;
GRANT SELECT ON public.article_submissions TO authenticated;
ALTER TABLE public.article_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions admin read" ON public.article_submissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "content admin all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'content' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'content' AND public.has_role(auth.uid(), 'admin'));