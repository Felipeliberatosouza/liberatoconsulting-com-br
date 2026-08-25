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

interface Props {
  fullName?: string
  email?: string
  phone?: string
  area?: string
  linkedin?: string
  resumeName?: string
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
  fullName,
  email,
  phone,
  area,
  linkedin,
  resumeName,
  language,
  sourcePath,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Nova candidatura: ${fullName ?? 'sem nome'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Nova candidatura — Trabalhe Conosco</Heading>
        <Text style={intro}>
          {fullName ?? 'Uma pessoa candidata'} enviou uma candidatura pelo site oficial
          liberatoconsulting.com.br. O arquivo está disponível no painel administrativo,
          em Candidaturas, e você pode responder diretamente a este e-mail.
        </Text>
        <Hr style={hr} />
        <Section>
          <Row label="Nome" value={fullName} />
          <Row label="E-mail" value={email} />
          <Row label="Telefone" value={phone} />
          <Row label="Área de interesse" value={area} />
          <Row label="LinkedIn" value={linkedin} />
          <Row label="Currículo" value={resumeName} />
          <Row label="Idioma" value={language} />
          <Row label="Origem" value={sourcePath} />
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Liberato Consulting · liberatoconsulting.com.br ·
          contato@liberatoconsulting.com.br. Este aviso individual foi gerado após o
          envio do formulário Trabalhe Conosco.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Nova candidatura — ${data['fullName'] ?? 'Trabalhe Conosco'}`,
  displayName: 'Aviso de nova candidatura',
  previewData: {
    fullName: 'João Pereira',
    email: 'joao@exemplo.com',
    phone: '+55 (11) 9999-9999',
    area: 'Consultoria em estratégia',
    linkedin: 'https://linkedin.com/in/joaopereira',
    resumeName: 'joao-pereira-cv.pdf',
    language: 'pt',
    sourcePath: '/careers',
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
const footer = { fontSize: '12px', color: '#888888', margin: '0' }
