import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  /** Nome da pessoa ou da empresa homenageada. */
  name?: string
  /** "pessoa" ou "empresa" */
  target?: 'pessoa' | 'empresa'
  company?: string
  years?: number | null
  /** Assunto vindo do modelo editável no painel. */
  subject?: string
  /** Texto vindo do modelo editável no painel. */
  body?: string
}

const Email = ({ name, target = 'pessoa', company, years, subject, body }: Props) => {
  const isCompany = target === 'empresa'
  const title =
    subject ||
    (isCompany
      ? `Parabéns pelos ${years ? `${years} anos da ` : ''}${name ?? 'sua empresa'}!`
      : `Feliz aniversário, ${name ?? ''}!`)

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          {body ? (
            body
              .split(/\n{2,}/)
              .map((p, i) => (
                <Text key={i} style={text}>
                  {p}
                </Text>
              ))
          ) : isCompany ? (
            <Text style={text}>
              A equipe da Liberato Consulting parabeniza a {name} por mais um ano de
              história. Que o próximo ciclo traga crescimento, boas decisões e
              resultados consistentes.
            </Text>
          ) : (
            <Text style={text}>
              A equipe da Liberato Consulting deseja um feliz aniversário
              {company ? `, com votos de sucesso também na ${company}` : ''}. Que o novo
              ano pessoal e profissional seja repleto de conquistas.
            </Text>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            Liberato Consulting — gestão estratégica, empreendedorismo e pesquisas de
            mercado sobre o Brasil. liberatoconsulting.com.br
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f5f5f4', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { margin: '0 auto', padding: '32px', maxWidth: '560px', backgroundColor: '#ffffff' }
const heading = { fontSize: '22px', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#1f2937' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#6b7280' }

export const template: TemplateEntry = {
  component: Email,
  subject: (data) =>
    data['subject'] ||
    (data['target'] === 'empresa'
      ? `Parabéns, ${data['name'] ?? 'equipe'}!`
      : `Feliz aniversário, ${data['name'] ?? ''}!`),
  displayName: 'Aniversário (CRM)',
  previewData: { name: 'Maria Souza', target: 'pessoa', company: 'Acme S.A.' },
}
