ALTER TABLE public.content_articles
  ADD COLUMN IF NOT EXISTS article_date date,
  ADD COLUMN IF NOT EXISTS chart_data text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS table_data text NOT NULL DEFAULT '';

UPDATE public.content_articles SET article_date = created_at::date WHERE article_date IS NULL;

ALTER TABLE public.article_submissions
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cpf text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS role_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS institution text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS group_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service text NOT NULL DEFAULT '';