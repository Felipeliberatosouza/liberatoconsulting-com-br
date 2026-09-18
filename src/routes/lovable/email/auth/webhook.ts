import * as React from 'react'
import { createAuthEmailHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { AuthSignupEmail } from '@/lib/email-templates/auth-signup'
import { AuthActionEmail } from '@/lib/email-templates/auth-action'

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
            signup: {
              subject: 'Confirme seu cadastro na Liberato Consulting',
              render: async (data) => {
                try {
                  const { getSignupEmailContent } = await import('@/lib/auth-email-content.server')
                  const content = await getSignupEmailContent(data.email, data.url)
                  return React.createElement(AuthSignupEmail, {
                    subject: content.subject,
                    body: content.body,
                    buttonLabel: content.buttonLabel,
                    confirmationUrl: data.url,
                    lang: content.htmlLang,
                    brandFooter: content.brandFooter,
                    logoUrl: content.logoUrl,
                  })
                } catch {
                  const brand = await loadBrand()
                  return React.createElement(AuthSignupEmail, {
                    subject: 'Confirme seu cadastro na Liberato Consulting',
                    body: 'Recebemos seu cadastro. Para ativar sua conta, confirme seu e-mail usando o botão abaixo.',
                    buttonLabel: 'Confirmar meu e-mail',
                    confirmationUrl: data.url,
                    ...brand,
                  })
                }
              },
            },
            invite: {
              subject: 'Convite para acessar a Liberato Consulting',
              render: async (data) => React.createElement(AuthActionEmail, { kind: 'invite', confirmationUrl: data.url, ...(await loadBrand()) }),
            },
            magiclink: {
              subject: 'Seu link de acesso à Liberato Consulting',
              render: async (data) => React.createElement(AuthActionEmail, { kind: 'magiclink', confirmationUrl: data.url, ...(await loadBrand()) }),
            },
            recovery: {
              subject: 'Redefina sua senha da Liberato Consulting',
              render: async (data) => React.createElement(AuthActionEmail, { kind: 'recovery', confirmationUrl: data.url, ...(await loadBrand()) }),
            },
            email_change: {
              subject: 'Confirme a alteração do seu e-mail',
              render: async (data) => React.createElement(AuthActionEmail, { kind: 'email_change', confirmationUrl: data.url, ...(await loadBrand()) }),
            },
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
