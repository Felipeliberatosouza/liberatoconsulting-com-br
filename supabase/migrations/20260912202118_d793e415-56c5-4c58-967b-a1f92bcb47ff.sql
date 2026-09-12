CREATE TABLE public.service_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.service_products(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  ai_rationale text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_pricing TO authenticated;
GRANT ALL ON public.service_pricing TO service_role;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Panel users manage service pricing" ON public.service_pricing
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  service_title text NOT NULL DEFAULT '',
  client_name text NOT NULL DEFAULT '',
  company_type text NOT NULL DEFAULT 'sme',
  country text NOT NULL DEFAULT 'BR',
  currency text NOT NULL DEFAULT 'BRL',
  language text NOT NULL DEFAULT 'pt',
  start_date date,
  end_date date,
  remote_only boolean NOT NULL DEFAULT false,
  discount_pct numeric NOT NULL DEFAULT 0,
  total_brl numeric NOT NULL DEFAULT 0,
  total_currency numeric NOT NULL DEFAULT 0,
  fx_rate numeric NOT NULL DEFAULT 1,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Panel users manage quotes" ON public.quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_service_pricing_updated_at BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();