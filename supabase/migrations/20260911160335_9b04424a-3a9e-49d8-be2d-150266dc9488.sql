CREATE INDEX IF NOT EXISTS content_articles_published_order_idx
  ON public.content_articles (published, "position" ASC, created_at DESC);

CREATE OR REPLACE FUNCTION public.list_site_articles()
RETURNS TABLE (
  id uuid,
  slug text,
  group_id text,
  kind text,
  title text,
  summary text,
  service text,
  link_url text,
  "position" integer,
  published boolean,
  cover_url text,
  authors text,
  author_contact text,
  file_path text,
  file_name text,
  read_count integer,
  rating_sum integer,
  rating_count integer,
  article_date date,
  created_at timestamptz,
  translations jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.slug, a.group_id, a.kind, a.title, a.summary, a.service, a.link_url,
         a."position", a.published, a.cover_url, a.authors, a.author_contact,
         a.file_path, a.file_name, a.read_count, a.rating_sum, a.rating_count,
         a.article_date, a.created_at,
         COALESCE(
           (SELECT jsonb_object_agg(l.key, l.value - 'body' - 'doc_body' - 'doc_md' - 'table_data' - 'chart_data')
              FROM jsonb_each(COALESCE(a.translations, '{}'::jsonb)) AS l(key, value)
             WHERE jsonb_typeof(l.value) = 'object'),
           '{}'::jsonb
         ) AS translations
    FROM public.content_articles a
   WHERE a.published = true
   ORDER BY a."position" ASC, a.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_site_articles() TO anon, authenticated, service_role;