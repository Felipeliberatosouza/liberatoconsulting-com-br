ALTER TABLE public.management_tools ADD COLUMN IF NOT EXISTS welcome_attachment boolean NOT NULL DEFAULT false;
ALTER TABLE public.tool_user_profiles ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE public.tool_user_profiles ADD COLUMN IF NOT EXISTS welcome_sent_at timestamptz;
INSERT INTO public.email_templates (slug, label, subject, body, enabled)
SELECT
  'tools_welcome',
  'Boas-vindas — Ferramentas gratuitas',
  'Bem-vindo(a) à biblioteca gratuita da Liberato Consulting, {{nome}}!',
  concat_ws(chr(10) || chr(10),
    'Olá {{nome}}, é uma alegria ter você e a {{empresa}} conosco.',
    'Na Liberato Consulting unimos consultoria de gestão e inteligência artificial para gerar impacto real no seu negócio: mais margem de lucro, processos mais simples, decisões baseadas em dados e um time com autonomia para sustentar os ganhos depois do projeto.',
    'Os nossos materiais nascem de projetos reais e ajudam você a começar hoje mesmo, sem custo.',
    'Segue em anexo o material {{material}}, disponível também neste link: {{link}}',
    'A partir de agora você também passa a receber a nossa Newsletter, o Boletim Semanal e os nossos insights sobre gestão e o mercado brasileiro.',
    'Conte com a gente quando quiser conversar sobre os resultados da sua empresa.'
  ),
  true
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE slug = 'tools_welcome');