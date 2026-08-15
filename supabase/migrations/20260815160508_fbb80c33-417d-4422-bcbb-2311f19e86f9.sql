ALTER TABLE public.economic_indicators
  ADD COLUMN IF NOT EXISTS forecast_value text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS forecast_period text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS forecast_source_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS forecast_source_url text NOT NULL DEFAULT '';