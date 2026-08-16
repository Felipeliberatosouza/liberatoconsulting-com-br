ALTER TABLE public.content_articles ALTER COLUMN read_count SET DEFAULT 20;
UPDATE public.content_articles SET read_count = 20;