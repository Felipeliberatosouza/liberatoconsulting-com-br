CREATE TABLE public.company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL DEFAULT '',
  trade_name text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  state_registration text NOT NULL DEFAULT '',
  municipal_registration text NOT NULL DEFAULT '',
  founded_on date,
  address_street text NOT NULL DEFAULT '',
  address_number text NOT NULL DEFAULT '',
  address_complement text NOT NULL DEFAULT '',
  address_district text NOT NULL DEFAULT '',
  address_city text NOT NULL DEFAULT '',
  address_state text NOT NULL DEFAULT '',
  address_zip text NOT NULL DEFAULT '',
  address_country text NOT NULL DEFAULT 'Brasil',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  logo_url text,
  partners jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company admin all" ON public.company_profile FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER company_profile_updated_at BEFORE UPDATE ON public.company_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts admin all" ON public.contract_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "contracts read authenticated" ON public.contract_templates FOR SELECT TO authenticated
  USING (active = true);
CREATE TRIGGER contract_templates_updated_at BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  audience text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  signer_name text NOT NULL DEFAULT '',
  signer_cpf text NOT NULL DEFAULT '',
  signed_body text NOT NULL DEFAULT '',
  ip_hash text,
  signed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contract_signatures TO authenticated;
GRANT ALL ON public.contract_signatures TO service_role;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signatures admin read" ON public.contract_signatures FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "signatures read own" ON public.contract_signatures FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "signatures insert own" ON public.contract_signatures FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.economic_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  value text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  reference_period text NOT NULL DEFAULT '',
  trend text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  source_name text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by_ai boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.economic_indicators TO authenticated;
GRANT SELECT ON public.economic_indicators TO anon;
GRANT ALL ON public.economic_indicators TO service_role;
ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "indicators public read" ON public.economic_indicators FOR SELECT TO anon, authenticated
  USING (published = true);
CREATE POLICY "indicators admin all" ON public.economic_indicators FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER economic_indicators_updated_at BEFORE UPDATE ON public.economic_indicators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email templates admin all" ON public.email_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS authors text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS author_contact text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS full_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sources text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS reference_date date;

INSERT INTO public.economic_indicators (slug, label, value, unit, reference_period, source_name, source_url, position) VALUES
  ('pib', 'PIB (variação anual)', '3,4', '%', '2025', 'IBGE', 'https://www.ibge.gov.br/', 1),
  ('inflacao', 'Inflação (IPCA 12 meses)', '4,5', '%', '2025', 'IBGE', 'https://www.ibge.gov.br/', 2),
  ('selic', 'Taxa Selic', '10,5', '% a.a.', '2025', 'Banco Central do Brasil', 'https://www.bcb.gov.br/', 3),
  ('cambio', 'Câmbio (USD/BRL)', '5,40', 'R$', '2025', 'Banco Central do Brasil', 'https://www.bcb.gov.br/', 4),
  ('desemprego', 'Taxa de desemprego', '6,8', '%', '2025', 'IBGE / PNAD Contínua', 'https://www.ibge.gov.br/', 5),
  ('ide', 'Investimento estrangeiro direto', '65', 'US$ bi', '2025', 'Banco Central do Brasil', 'https://www.bcb.gov.br/', 6),
  ('balanca', 'Balança comercial', '74', 'US$ bi', '2025', 'MDIC / Comex Stat', 'https://comexstat.mdic.gov.br/', 7),
  ('risco-pais', 'Risco-país (EMBI+)', '210', 'pontos', '2025', 'J.P. Morgan / Ipeadata', 'http://www.ipeadata.gov.br/', 8);

INSERT INTO public.email_templates (slug, label, subject, body) VALUES
  ('welcome_newsletter', 'Boas-vindas à newsletter', 'Bem-vindo à newsletter da Liberato Consulting', 'Olá {{nome}},\n\nObrigado por assinar nossa newsletter. Você receberá análises sobre gestão, empreendedorismo e o mercado brasileiro.\n\nLiberato Consulting'),
  ('lead_received', 'Confirmação de contato (lead)', 'Recebemos o seu contato', 'Olá {{nome}},\n\nRecebemos a sua mensagem sobre {{servico}} e nossa equipe responderá em breve.\n\nLiberato Consulting'),
  ('application_received', 'Confirmação de candidatura', 'Recebemos o seu currículo', 'Olá {{nome}},\n\nRecebemos a sua candidatura para {{area}}. Entraremos em contato caso haja aderência.\n\nLiberato Consulting'),
  ('team_welcome', 'Acesso criado (equipe)', 'Seu acesso à área administrativa', 'Olá {{nome}},\n\nSeu acesso à área administrativa da Liberato Consulting foi criado. Use o e-mail {{email}} para entrar.\n\nLiberato Consulting'),
  ('change_approved', 'Alteração aprovada', 'Sua alteração foi aprovada', 'Olá {{nome}},\n\nSua alteração "{{titulo}}" foi aprovada e já está publicada.\n\nLiberato Consulting'),
  ('change_rejected', 'Alteração recusada', 'Sua alteração precisa de ajustes', 'Olá {{nome}},\n\nSua alteração "{{titulo}}" não foi aprovada. Observação: {{observacao}}\n\nLiberato Consulting');

INSERT INTO public.contract_templates (audience, title, body) VALUES
  ('autor', 'Contrato de colaboração — Autor de artigos', 'Pelo presente instrumento, {{nome}}, CPF {{cpf}}, doravante AUTOR, e LIBERATO CONSULTING, doravante CONTRATANTE, ajustam a produção de conteúdos autorais para os canais da CONTRATANTE, observadas as cláusulas de originalidade, cessão de direitos autorais patrimoniais para uso institucional, confidencialidade e remuneração acordada por conteúdo aprovado.'),
  ('consultor', 'Contrato de prestação de serviços — Consultor', 'Pelo presente instrumento, {{nome}}, CPF {{cpf}}, doravante CONSULTOR, e LIBERATO CONSULTING, doravante CONTRATANTE, ajustam a prestação de serviços de consultoria e produção técnica, observadas as cláusulas de confidencialidade, não concorrência, propriedade intelectual dos entregáveis e remuneração acordada por projeto.');