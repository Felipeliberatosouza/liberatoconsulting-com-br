import * as React from 'react'
import { render } from '@react-email/render'
import { createFileRoute } from '@tanstack/react-router'
import { AuthSignupEmail } from '@/lib/email-templates/auth-signup'
import { AuthActionEmail } from '@/lib/email-templates/auth-action'

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: AuthSignupEmail,
  invite: AuthActionEmail,
  magiclink: AuthActionEmail,
  recovery: AuthActionEmail,
  email_change: AuthActionEmail,
  reauthentication: AuthActionEmail,
}

// Configuration
const SITE_NAME = "Liberato Consulting"
const ROOT_DOMAIN = "liberatoconsulting.com.br"

// Sample data for preview mode ONLY (not used in actual email sending).
// URLs are baked in at scaffold time from the project's real data.
// The sample email uses a fixed placeholder (RFC 6761 .test TLD) so the Go backend
// can always find-and-replace it with the actual recipient when sending test emails,
// even if the project's domain has changed since the template was scaffolded.
const SAMPLE_PROJECT_URL = "https://liberatoconsulting-com-br.lovable.app"
const SAMPLE_EMAIL = "user@example.test"
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    subject: 'Confirme seu cadastro na Liberato Consulting',
    body: `Recebemos seu cadastro. Para ativar sua conta, confirme seu e-mail (${SAMPLE_EMAIL}) usando o botão abaixo.`,
    buttonLabel: 'Confirmar meu e-mail',
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    kind: 'magiclink',
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    kind: 'recovery',
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    kind: 'invite',
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    kind: 'email_change',
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    kind: 'reauthentication',
    token: '123456',
  },
}

export const Route = createFileRoute("/lovable/email/auth/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']

        if (!apiKey) {
          return Response.json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        }

        // Verify the caller is authorized with LOVABLE_API_KEY
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let type: string
        try {
          const body = await request.json()
          type = body.type
        } catch {
          return Response.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }

        const EmailTemplate = EMAIL_TEMPLATES[type]

        if (!EmailTemplate) {
          return Response.json(
            { error: `Unknown email type: ${type}` },
            { status: 400 }
          )
        }

        const sampleData = SAMPLE_DATA[type] || {}
        const html = await render(React.createElement(EmailTemplate, sampleData))

        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      },
    },
  },
})
