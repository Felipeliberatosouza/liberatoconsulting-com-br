CREATE TABLE public.project_satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'executado',
  company text NOT NULL DEFAULT '',
  respondent_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  score1 integer,
  score2 integer,
  score3 integer,
  reason text NOT NULL DEFAULT '',
  comment text NOT NULL DEFAULT '',
  lang text NOT NULL DEFAULT 'pt',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.project_satisfaction_surveys TO authenticated;
GRANT ALL ON public.project_satisfaction_surveys TO service_role;
ALTER TABLE public.project_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read surveys" ON public.project_satisfaction_surveys FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete surveys" ON public.project_satisfaction_surveys FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_templates (slug, label, subject, body, enabled) VALUES
 ('scope_invite', 'Envio do Escopo Inicial ao cliente', '{{nome}}, conte-nos sobre a necessidade da {{empresa}} — Liberato Consulting', 'Olá, {{nome}}!

Para prepararmos uma proposta adequada à {{empresa}}, pedimos que responda ao nosso Escopo Inicial. São 10 perguntas objetivas e leva poucos minutos.

Acesse: {{link}}

As informações são tratadas com confidencialidade.

Equipe Liberato Consulting', true),
 ('satisfaction_invite', 'Envio da Pesquisa de Satisfação ao cliente', '{{nome}}, sua opinião sobre a Liberato Consulting', 'Olá, {{nome}}!

Queremos saber como foi a sua experiência com a Liberato Consulting. A pesquisa tem apenas 3 perguntas e leva menos de 1 minuto.

Acesse: {{link}}

Obrigado pela confiança.

Equipe Liberato Consulting', true)
ON CONFLICT (slug) DO NOTHING;