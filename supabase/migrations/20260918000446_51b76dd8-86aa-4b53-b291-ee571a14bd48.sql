INSERT INTO public.email_templates (slug, label, subject, body, enabled)
SELECT * FROM (VALUES
 ('auth_signup_pt','Confirmação de conta — Português','Confirme seu cadastro na Liberato Consulting','Olá! Recebemos seu cadastro na Liberato Consulting.

Para ativar sua conta e acessar a área de materiais e ferramentas de gestão, confirme seu e-mail ({{email}}) clicando no botão abaixo.

Se você não criou esta conta, pode ignorar esta mensagem com segurança.',true),
 ('auth_signup_en','Confirmação de conta — Inglês','Confirm your Liberato Consulting account','Hello! We received your registration at Liberato Consulting.

To activate your account and access the management tools and materials area, confirm your email ({{email}}) by clicking the button below.

If you did not create this account, you can safely ignore this message.',true),
 ('auth_signup_es','Confirmação de conta — Espanhol','Confirme su registro en Liberato Consulting','¡Hola! Recibimos su registro en Liberato Consulting.

Para activar su cuenta y acceder al área de materiales y herramientas de gestión, confirme su correo ({{email}}) haciendo clic en el botón de abajo.

Si usted no creó esta cuenta, puede ignorar este mensaje con seguridad.',true),
 ('auth_signup_zh','Confirmação de conta — Chinês','确认您的 Liberato Consulting 账户','您好！我们收到了您在 Liberato Consulting 的注册申请。

请点击下方按钮确认您的邮箱（{{email}}），以激活账户并访问管理工具与资料专区。

如果这不是您本人的注册，请忽略此邮件。',true)
) AS t(slug,label,subject,body,enabled)
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates e WHERE e.slug = t.slug);