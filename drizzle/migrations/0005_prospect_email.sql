CREATE TABLE public.prospect_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  company text NOT NULL DEFAULT '',
  ip text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.prospect_unsubscribes TO authenticated;
GRANT ALL ON public.prospect_unsubscribes TO service_role;
ALTER TABLE public.prospect_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read unsubscribes" ON public.prospect_unsubscribes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete unsubscribes" ON public.prospect_unsubscribes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_templates (slug, label, subject, body, enabled) VALUES
 ('prospect_outreach', 'Prospecção — apresentação da Liberato Consulting a leads', '{{nome}}, uma ideia para a {{empresa}}', 'Olá, {{nome}}!

Sou da Liberato Consulting, consultoria que une inteligência artificial e gestão estratégica para ajudar empresas como a {{empresa}} a crescer com mais margem, processos eficientes e decisões baseadas em dados.

Gostaria de apresentar, em uma conversa rápida de 20 minutos, como podemos apoiar a {{empresa}} nos próximos meses.

Conheça mais: https://liberatoconsulting.com.br

Atenciosamente,
Equipe Liberato Consulting', true)
ON CONFLICT (slug) DO NOTHING;