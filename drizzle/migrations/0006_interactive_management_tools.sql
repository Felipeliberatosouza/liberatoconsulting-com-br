CREATE TABLE public.interactive_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Finanças',
  spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  pricing_mode text NOT NULL DEFAULT 'free',
  ai_cost_brl numeric(12,4) NOT NULL DEFAULT 0,
  markup_pct numeric(8,2) NOT NULL DEFAULT 200,
  price_brl numeric(12,2) NOT NULL DEFAULT 0,
  verification jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.interactive_tools TO authenticated;
GRANT ALL ON public.interactive_tools TO service_role;
ALTER TABLE public.interactive_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read published tools" ON public.interactive_tools FOR SELECT TO authenticated USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.interactive_tool_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid,
  step text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_brl numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.interactive_tool_ai_usage TO service_role;
ALTER TABLE public.interactive_tool_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.interactive_tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL,
  user_id uuid NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.interactive_tool_runs TO authenticated;
GRANT ALL ON public.interactive_tool_runs TO service_role;
ALTER TABLE public.interactive_tool_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own runs" ON public.interactive_tool_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.interactive_tool_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount_brl numeric(12,2) NOT NULL,
  billing_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  asaas_payment_id text UNIQUE,
  invoice_url text,
  bank_slip_url text,
  pix_payload text,
  pix_image text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.interactive_tool_orders TO authenticated;
GRANT ALL ON public.interactive_tool_orders TO service_role;
ALTER TABLE public.interactive_tool_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.interactive_tool_orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.billing_profiles (
  user_id uuid PRIMARY KEY,
  full_name text NOT NULL,
  cpf_cnpj text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  postal_code text NOT NULL DEFAULT '',
  address_number text NOT NULL DEFAULT '',
  asaas_customer_id text,
  phone_verified_at timestamptz,
  phone_code_hash text,
  phone_code_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.billing_profiles TO service_role;
ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;