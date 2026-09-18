import React, { type ReactNode } from 'react'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Text } from '@react-email/components'

import { EMAIL_LOGO_URL, brandFooterText } from '@/lib/email-brand'

/** Logomarca exibida no topo de todos os e-mails automáticos. */
export const EMAIL_STYLES = {
  main: { margin: '0', backgroundColor: '#f5f5f4', fontFamily: 'Arial, Helvetica, sans-serif' },
  container: { margin: '0 auto', padding: '32px', maxWidth: '560px', backgroundColor: '#ffffff' },
  heading: { fontSize: '22px', lineHeight: '28px', color: '#0f172a', margin: '0 0 16px' },
  text: { fontSize: '15px', lineHeight: '24px', color: '#1f2937', margin: '0 0 14px' },
  button: {
    backgroundColor: '#E8630A',
    color: '#ffffff',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: 'bold' as const,
    borderRadius: '999px',
    padding: '12px 22px',
    textDecoration: 'none',
    display: 'inline-block',
  },
} as const

export function emailParagraphs(body: string): string[] {
  return body
    .replace(/\\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export const BrandLogo = ({ logoUrl = EMAIL_LOGO_URL }: { logoUrl?: string | undefined }) => (
  <Img
    src={logoUrl}
    alt="Liberato Consulting"
    width="180"
    style={{ display: 'block', width: '180px', height: 'auto', margin: '0 0 24px' }}
  />
)

/** Rodapé institucional (razão social, CNPJ, endereço e contatos). */
export const BrandFooter = ({ text }: { text?: string | undefined }) => (
  <>
    <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
    <Text style={{ fontSize: '12px', lineHeight: '18px', color: '#6b7280', margin: '0' }}>
      {text || brandFooterText(undefined)}
    </Text>
  </>
)

export function BrandEmailLayout({
  lang = 'pt-BR',
  subject,
  logoUrl,
  brandFooter,
  children,
}: {
  lang?: string
  subject: string
  logoUrl?: string | undefined
  brandFooter?: string | undefined
  children: ReactNode
}) {
  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={EMAIL_STYLES.main}>
        <Container style={EMAIL_STYLES.container}>
          <BrandLogo logoUrl={logoUrl} />
          <Heading style={EMAIL_STYLES.heading}>{subject}</Heading>
          {children}
          <BrandFooter text={brandFooter} />
        </Container>
      </Body>
    </Html>
  )
}

export function EmailParagraphs({ body }: { body: string }) {
  return emailParagraphs(body).map((paragraph, index) => (
    <Text key={index} style={{ ...EMAIL_STYLES.text, whiteSpace: 'pre-line' as const }}>
      {paragraph}
    </Text>
  ))
}
