import React from 'react'
import { Button, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BrandEmailLayout, EmailParagraphs, EMAIL_STYLES } from './brand-shell'

interface Props {
  subject?: string
  body?: string
  /** Botões exibidos após o texto (ex.: preencher cadastro, baixar contrato). */
  buttons?: Array<{ label: string; href: string }>
  /** Texto adicional, como o contrato completo. */
  appendix?: string
  brandFooter?: string
  logoUrl?: string
}

const Email = ({ subject, body, buttons, appendix, brandFooter, logoUrl }: Props) => (
  <BrandEmailLayout subject={subject || 'Liberato Consulting'} brandFooter={brandFooter} logoUrl={logoUrl}>
    <EmailParagraphs body={body ?? ''} />
    {(buttons ?? []).map((b) =>
      b.href ? (
        <Text key={b.href} style={EMAIL_STYLES.text}>
          <Button style={EMAIL_STYLES.button} href={b.href}>
            {b.label}
          </Button>
        </Text>
      ) : null,
    )}
    {appendix ? <EmailParagraphs body={appendix} /> : null}
  </BrandEmailLayout>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => data['subject'] || 'Liberato Consulting',
  displayName: 'Novo consultor — aprovação e contrato',
  previewData: {
    subject: 'Maria, sua candidatura foi aprovada — Liberato Consulting',
    body: 'Olá, Maria.\n\nSua candidatura foi aprovada.',
    buttons: [{ label: 'Preencher meu cadastro', href: 'https://liberatoconsulting.com.br/novoconsultor' }],
  },
} satisfies TemplateEntry
