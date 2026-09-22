INSERT INTO public.email_templates (slug, label, subject, body, enabled) VALUES
('auth_recovery', 'Recuperação de senha', 'Redefina sua senha da Liberato Consulting',
 'Olá! Recebemos uma solicitação para redefinir a senha da conta {{email}}.

Clique no botão abaixo para escolher uma nova senha. Por segurança, este link expira em breve e só pode ser usado uma vez.

Se você não solicitou a troca de senha, ignore esta mensagem: sua senha atual continua válida.', true),
('auth_magiclink', 'Link de acesso à conta', 'Seu link de acesso à Liberato Consulting',
 'Olá! Use o botão abaixo para acessar sua conta ({{email}}) na Liberato Consulting.

Por segurança, este link expira em breve e só pode ser usado uma vez.

Se você não solicitou este acesso, ignore esta mensagem.', true),
('auth_invite', 'Convite de acesso', 'Convite para acessar a Liberato Consulting',
 'Olá! Você recebeu um convite para acessar a Liberato Consulting com o e-mail {{email}}.

Clique no botão abaixo para aceitar o convite e criar sua senha de acesso.', true),
('auth_email_change', 'Alteração de e-mail da conta', 'Confirme a alteração do seu e-mail',
 'Olá! Recebemos uma solicitação para alterar o e-mail da sua conta na Liberato Consulting.

Clique no botão abaixo para confirmar a alteração.

Se você não solicitou esta mudança, ignore esta mensagem.', true)
ON CONFLICT (slug) DO NOTHING;