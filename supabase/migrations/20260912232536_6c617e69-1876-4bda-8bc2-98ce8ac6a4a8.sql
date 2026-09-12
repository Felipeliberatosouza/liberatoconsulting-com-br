INSERT INTO public.email_templates (slug, label, subject, body, enabled)
VALUES
 ('birthday_company', 'Aniversário da empresa (CRM)', 'Parabéns, {{nome}}!', 'A equipe da Liberato Consulting parabeniza a {{nome}} por mais um ano de história. Que o próximo ciclo traga crescimento, boas decisões e resultados consistentes.', true),
 ('birthday_person', 'Aniversário de pessoa (CRM)', 'Feliz aniversário, {{nome}}!', 'A equipe da Liberato Consulting deseja um feliz aniversário a {{nome}}. Que o novo ano pessoal e profissional seja repleto de conquistas.', true)
ON CONFLICT (slug) DO NOTHING;