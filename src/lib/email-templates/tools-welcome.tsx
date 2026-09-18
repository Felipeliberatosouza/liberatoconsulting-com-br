import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BrandFooter, BrandLogo } from './brand-shell'

interface Props {
  /** Assunto vindo do modelo editável no painel. */
  subject?: string
  /** Texto vindo do modelo editável no painel, já com as variáveis preenchidas. */
  body?: string
  /** Nome do material indicado para o e-mail de boas-vindas. */
  material?: string
  /** Link temporário de download do material. */
  link?: string
  /** Materiais marcados no painel, cada um com o seu link temporário. */
  materials?: Array<{ title: string; link: string }>
  brandFooter?: string
}

const Email = ({ subject, body, material, link, materials, brandFooter }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{subject || 'Bem-vindo à biblioteca gratuita da Liberato Consulting'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandLogo />
        <Heading style={heading}>
          {subject || 'Bem-vindo à biblioteca gratuita da Liberato Consulting'}
        </Heading>
        {(body ?? '')
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((paragraph, index) => (
            <Text key={index} style={text}>
              {paragraph}
            </Text>
          ))}
        {link ? (
          <Button style={button} href={link}>
            {material ? `Baixar ${material}` : 'Baixar material'}
          </Button>
        ) : null}
        <BrandFooter text={brandFooter} />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data['subject'] || 'Bem-vindo à biblioteca gratuita da Liberato Consulting',
  displayName: 'Boas-vindas — Ferramentas gratuitas',
  previewData: {
    subject: 'Bem-vindo(a) à biblioteca gratuita da Liberato Consulting, Maria!',
    body: 'Olá Maria, é uma alegria ter você e a Acme conosco.\n\nSegue em anexo o material Guia de Margem, disponível também neste link.',
    material: 'Guia de Margem',
    link: 'https://liberatoconsulting.com.br/ferramentas',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '600px' }
const heading = { fontSize: '20px', color: '#111111', margin: '0 0 12px' }
const text = { fontSize: '14px', lineHeight: '22px', color: '#333333', margin: '0 0 14px' }
const button = {
  backgroundColor: '#E8630A',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '999px',
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
