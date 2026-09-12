import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BrandFooter, BrandLogo } from './brand-shell'

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
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Novo contato: ${name ?? 'sem nome'}${company ? ` — ${company}` : ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandLogo />
        <Heading style={heading}>Novo contato pelo site</Heading>
        <Text style={intro}>
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
        <Hr style={hr} />
        <Text style={footer}>
          Liberato Consulting · liberatoconsulting.com.br ·
          contato@liberatoconsulting.com.br. Este aviso individual foi gerado após o
          envio do formulário no site oficial.
        </Text>
      </Container>
    </Body>
  </Html>
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

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const heading = { fontSize: '20px', color: '#111111', margin: '0 0 4px' }
const intro = { fontSize: '14px', color: '#555555', margin: '0' }
const hr = { borderColor: '#eeeeee', margin: '16px 0' }
const row = { fontSize: '14px', color: '#111111', margin: '0 0 6px' }
const rowLabel = { fontWeight: 'bold' as const, color: '#E8630A' }
const messageStyle = {
  fontSize: '14px',
  color: '#111111',
  whiteSpace: 'pre-wrap' as const,
  margin: '0',
}
const footer = { fontSize: '12px', color: '#888888', margin: '0' }
