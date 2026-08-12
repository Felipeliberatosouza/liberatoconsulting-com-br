ALTER TABLE public.economic_indicators
  ADD COLUMN IF NOT EXISTS segment text NOT NULL DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'todas',
  ADD COLUMN IF NOT EXISTS uf text NOT NULL DEFAULT 'todos';