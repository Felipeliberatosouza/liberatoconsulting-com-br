import * as React from 'react'
import { createAuthEmailHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { AuthSignupEmail } from '@/lib/email-templates/auth-signup'
import { AuthActionEmail } from '@/lib/email-templates/auth-action'
import type { AuthEmailKind } from '@/lib/auth-email-content.server'

// Configuration
const SITE_NAME = "Liberato Consulting"
const SENDER_DOMAIN = "notify.liberatoconsulting.com.br"
const ROOT_DOMAIN = "liberatoconsulting.com.br"
const FROM_DOMAIN = "liberatoconsulting.com.br"

async function loadBrand() {
  const [{ getEmailBrandFooter }, { loadEmailBrand }] = await Promise.all([
    import('@/lib/email-brand.server'),
    import('@/lib/company-footer.server'),
  ])
  const [brandFooter, brand] = await Promise.all([
    getEmailBrandFooter(),
    loadEmailBrand(`https://${ROOT_DOMAIN}`),
  ])
  return { brandFooter, logoUrl: brand.logoUrl }
}

/**
 * Todos os e-mails de conta usam o modelo em português salvo no painel
 * (Configurações → E-mails automáticos), traduzido para o idioma do
 * destinatário e renderizado com a moldura da marca.
 */
function accountEmail(kind: AuthEmailKind, fallback: { subject: string; body: string; button: string }) {
  return async (data: { email: string; url: string }) => {
    try {
      const { getAuthEmailContent } = await import('@/lib/auth-email-content.server')
      const content = await getAuthEmailContent(kind, data.email, data.url)
      return {
        subject: content.subject,
        element: React.createElement(AuthSignupEmail, {
          subject: content.subject,
          body: content.body,
          buttonLabel: content.buttonLabel,
          confirmationUrl: data.url,
          lang: content.htmlLang,
          brandFooter: content.brandFooter,
          logoUrl: content.logoUrl,
        }),
      }
    } catch {
      const brand = await loadBrand()
      return {
        subject: fallback.subject,
        element: React.createElement(AuthSignupEmail, {
          subject: fallback.subject,
          body: fallback.body,
          buttonLabel: fallback.button,
          confirmationUrl: data.url,
          ...brand,
        }),
      }
    }
  }
}

// The SDK handler owns verification, dispatch, and retry semantics; this file
// owns only the email decisions: subjects, templates, and per-type props.
export const Route = createFileRoute("/lovable/email/auth/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const handler = createAuthEmailHandler({
          apiKey: process.env['LOVABLE_API_KEY']!,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          senderDomain: SENDER_DOMAIN,
          sendUrl: process.env['LOVABLE_SEND_URL'],
          emails: {
            signup: accountEmail('signup', {
              subject: 'Confirme seu cadastro na Liberato Consulting',
              body: 'Recebemos seu cadastro. Para ativar sua conta, confirme seu e-mail usando o botão abaixo.',
              button: 'Confirmar meu e-mail',
            }),
            invite: accountEmail('invite', {
              subject: 'Convite para acessar a Liberato Consulting',
              body: 'Você recebeu um convite para acessar a Liberato Consulting. Use o botão abaixo para aceitar o convite e criar sua conta.',
              button: 'Aceitar convite',
            }),
            magiclink: accountEmail('magiclink', {
              subject: 'Seu link de acesso à Liberato Consulting',
              body: 'Use o botão abaixo para acessar sua conta. Por segurança, este link expira em breve.',
              button: 'Acessar minha conta',
            }),
            recovery: accountEmail('recovery', {
              subject: 'Redefina sua senha da Liberato Consulting',
              body: 'Recebemos uma solicitação para redefinir sua senha. Use o botão abaixo para escolher uma nova senha.',
              button: 'Redefinir minha senha',
            }),
            email_change: accountEmail('email_change', {
              subject: 'Confirme a alteração do seu e-mail',
              body: 'Recebemos uma solicitação para alterar o e-mail da sua conta. Use o botão abaixo para confirmar a mudança.',
              button: 'Confirmar alteração',
            }),
            reauthentication: {
              subject: 'Confirme sua identidade',
              render: async (data) => React.createElement(AuthActionEmail, { kind: 'reauthentication', token: data.token ?? '', ...(await loadBrand()) }),
            },
          },
        })
        return handler(request)
      },
    },
  },
})
