CREATE TABLE public.service_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  group_id text NOT NULL DEFAULT '',
  groups jsonb NOT NULL DEFAULT '[]'::jsonb,
  family_id text NOT NULL DEFAULT '',
  family_title text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  lead text NOT NULL DEFAULT '',
  problem text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  duration_corporate text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT '',
  price_sme text NOT NULL DEFAULT '',
  price_corporate text NOT NULL DEFAULT '',
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits text NOT NULL DEFAULT '',
  ai text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_products TO authenticated;
GRANT ALL ON public.service_products TO service_role;

ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service products admin read"
  ON public.service_products
  FOR SELECT
  TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "service products admin write"
  ON public.service_products
  FOR ALL
  TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER service_products_updated_at
  BEFORE UPDATE ON public.service_products
  FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();