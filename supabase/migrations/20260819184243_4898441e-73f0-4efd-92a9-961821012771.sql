ALTER TABLE public.economic_indicators
  ADD COLUMN IF NOT EXISTS polarity text NOT NULL DEFAULT 'auto';

ALTER TABLE public.economic_indicators
  DROP CONSTRAINT IF EXISTS economic_indicators_polarity_check;

ALTER TABLE public.economic_indicators
  ADD CONSTRAINT economic_indicators_polarity_check
  CHECK (polarity IN ('auto','higher-better','lower-better','neutral'));