ALTER TABLE public.bulletin_dispatches
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'enviado',
  ADD COLUMN IF NOT EXISTS segment text NOT NULL DEFAULT '';