DROP POLICY IF EXISTS "scope content public read" ON public.brazil_scope_content;
CREATE POLICY "scope content public read" ON public.brazil_scope_content
  FOR SELECT TO anon, authenticated
  USING (lang IN ('pt','en','es','zh') AND length(title) > 0);

DROP POLICY IF EXISTS "Public can read brazil topic content" ON public.brazil_topic_content;
CREATE POLICY "Public can read brazil topic content" ON public.brazil_topic_content
  FOR SELECT TO anon, authenticated
  USING (lang IN ('pt','en','es','zh') AND length(title) > 0);

DROP POLICY IF EXISTS "Anyone can submit a scope form" ON public.project_scope_submissions;
CREATE POLICY "Anyone can submit a scope form" ON public.project_scope_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(company)) BETWEEN 1 AND 200
    AND length(btrim(respondent_name)) BETWEEN 1 AND 200
    AND length(respondent_role) <= 200
    AND length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(phone) BETWEEN 8 AND 30
    AND lang IN ('pt','en','es','zh')
    AND jsonb_typeof(answers) = 'object'
    AND jsonb_typeof(comments) = 'object'
    AND pg_column_size(answers) < 100000
    AND pg_column_size(comments) < 50000
    AND notes = ''
  );