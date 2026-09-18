import React from 'react'
import { Hr, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BrandEmailLayout, EMAIL_STYLES } from './brand-shell'

interface Props {
  name?: string
  company?: string
  country?: string
  email?: string
  phone?: string
  serviceTitle?: string
  serviceSlug?: string
  message?: string
  language?: string
  sourcePath?: string
  /** Rodapé institucional montado no envio. */
  brandFooter?: string
  logoUrl?: string
}

const Row = ({ label, value }: { label: string; value?: string | undefined }) =>
  value ? (
    <Text style={row}>
      <span style={rowLabel}>{label}: </span>
      <span>{value}</span>
    </Text>
  ) : null

const Email = ({
  name,
  company,
  country,
  email,
  phone,
  serviceTitle,
  serviceSlug,
  message,
  language,
  sourcePath,
  brandFooter,
  logoUrl,
}: Props) => (
  <BrandEmailLayout subject="Novo contato pelo site" brandFooter={brandFooter} logoUrl={logoUrl}>
        <Text style={EMAIL_STYLES.text}>
          A equipe Liberato recebeu uma solicitação de {name ?? 'um visitante'} pelo
          site oficial liberatoconsulting.com.br. Responda diretamente a este e-mail
          para continuar a conversa com o contato informado.
        </Text>
        <Hr style={hr} />
        <Section>
          <Row label="Nome" value={name} />
          <Row label="Empresa" value={company} />
          <Row label="País" value={country} />
          <Row label="E-mail" value={email} />
          <Row label="Telefone" value={phone} />
          <Row label="Serviço" value={serviceTitle || serviceSlug} />
          <Row label="Idioma" value={language} />
          <Row label="Origem" value={sourcePath} />
        </Section>
        {message ? (
          <>
            <Hr style={hr} />
            <Text style={rowLabel}>Mensagem</Text>
            <Text style={messageStyle}>{message}</Text>
          </>
        ) : null}
  </BrandEmailLayout>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Novo contato do site — ${data['name'] ?? 'formulário'}${
      data['company'] ? ` (${data['company']})` : ''
    }`,
  displayName: 'Aviso de novo contato',
  previewData: {
    name: 'Maria Souza',
    company: 'Acme Indústria',
    country: 'Brasil',
    email: 'maria@acme.com.br',
    serviceTitle: 'Planejamento estratégico',
    message: 'Gostaria de entender melhor o escopo e prazos.',
    language: 'pt',
    sourcePath: '/services/planejamento-estrategico',
  },
  to: 'contato@liberatoconsulting.com.br',
} satisfies TemplateEntry

const hr = { borderColor: '#eeeeee', margin: '16px 0' }
const row = { ...EMAIL_STYLES.text, margin: '0 0 6px' }
const rowLabel = { fontWeight: 'bold' as const, color: '#E8630A' }
const messageStyle = {
  ...EMAIL_STYLES.text,
  whiteSpace: 'pre-wrap' as const,
  margin: '0',
}
