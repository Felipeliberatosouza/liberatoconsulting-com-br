ALTER TABLE public.economic_indicators
  ADD COLUMN IF NOT EXISTS previous_value text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS previous_period text NOT NULL DEFAULT '';