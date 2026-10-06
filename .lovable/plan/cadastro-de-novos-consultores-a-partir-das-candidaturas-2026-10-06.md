# Cadastro de novos consultores a partir das Candidaturas

## Fluxo

```text
Candidaturas ──[Aprovar e enviar link]──> e-mail "Aprovação de candidatura"
      │                                        │
      │                          link único /novoconsultor?c=<código>
      ▼                                        ▼
Cadastros de consultores  <──────────  formulário único (perfil público + dados pessoais)
      │  (administrador revisa e edita)
      ▼
[Aprovar cadastro] ──> cria consultor (não publicado) + usuário do painel com papel Consultor
      │
      ▼
e-mail "Contrato para assinatura" (contrato preenchido com os dados aprovados)
      │
      ▼
Consultor assina no painel ──> acesso liberado e perfil disponível para publicação
```

## 1. Tela Candidaturas
- Nova coluna "Ações" com o botão **Aprovar e enviar link** em cada candidatura.
- Ao clicar: gera um convite com código único (válido por 30 dias), envia o e-mail e mostra o status (Link enviado em dd/mm, Cadastro recebido, Aprovado).
- Botão para reenviar o link.

## 2. Página pública /novoconsultor
- Abre somente com um código de convite válido; sem código ou com código vencido/usado, mostra uma mensagem.
- Um único formulário com todas as informações das duas telas atuais:
  - **Perfil público (Consultores):** nome, foto, título, formação, experiência, clientes, trabalhos, especialidades, segmentos, anos de experiência, certificações, destaques, logos acadêmicos e de clientes, ORCID, Lattes, site.
  - **Dados pessoais e contratuais (Usuários):** e-mail, celular, data de nascimento, CPF, RG, nacionalidade, estado civil, endereço completo, dados bancários e Pix.
- Já vem com nome, e-mail e celular da candidatura.
- Sem indexação em buscadores. O link pode ser usado até o envio; depois fica bloqueado.

## 3. Nova área no painel: "Cadastros de consultores"
- Lista dos formulários recebidos (nome, e-mail, data, status: Recebido, Aprovado, Recusado).
- Ao abrir: todos os campos **editáveis** pelo administrador, com os botões:
  - **Aprovar cadastro:** cria o consultor (não publicado, até a assinatura) e o acesso ao painel com papel Consultor, preenche os dados pessoais, e envia o e-mail do contrato.
  - **Recusar** (com observação interna).
- Atalho também a partir de Candidaturas e de Projetos/Visão geral.

## 4. E-mails automáticos (Configurações → E-mails automáticos)
Dois novos modelos editáveis, no padrão Liberato e com tradução automática como os demais:
- **Aprovação de candidatura:** texto de aprovação e botão "Preencher meu cadastro" com o link único.
- **Contrato para assinatura:** texto de boas-vindas, o contrato de Consultor já preenchido com os dados aprovados, e um botão para baixar o contrato em PDF e outro para entrar no painel e assinar.

## 5. Acesso do consultor
- O consultor recebe o acesso ao painel (definição de senha pelo e-mail de convite já existente).
- No primeiro acesso, a assinatura do contrato continua obrigatória (fluxo atual).
- Após a assinatura, o perfil fica disponível para o administrador publicar no site.

## Limites
- O envio de e-mails não permite anexos. O contrato vai como **botão de download do PDF** (link seguro e temporário) e também com o texto completo no corpo do e-mail.

## Detalhes técnicos
- Nova tabela `consultant_onboarding` (application_id, token único, status, expires_at, sent_at, submitted_at, payload jsonb com perfil e dados pessoais, review_note, consultant_id, user_id). GRANT e RLS somente para administradores; o envio público passa por server function que valida o token.
- Server functions: `sendOnboardingInvite`, `getOnboardingByToken` (público, só campos do próprio convite), `submitOnboarding` (público, validado com zod e limites), `listOnboardings`, `saveOnboarding`, `approveOnboarding`, `rejectOnboarding` (admin).
- `approveOnboarding` reutiliza as rotinas existentes de criação de consultor e de usuário/perfil e gera o PDF do contrato com `fillContract` + gerador de PDF já usado no projeto, salvo no bucket privado `contracts`.
- Novos slugs em `email_templates`: `consultant_approval` e `consultant_contract`, enviados com a moldura de e-mail compartilhada.
- Rotas: `src/routes/novoconsultor.tsx` (pública, noindex) e `src/routes/admin.cadastros-consultores.tsx`; item novo no AdminShell e no painel inicial.
