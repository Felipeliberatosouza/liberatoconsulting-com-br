import React from 'react'
import { Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BrandEmailLayout, EmailParagraphs, EMAIL_STYLES } from './brand-shell'

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
  /** Rodapé institucional montado no envio. */
  brandFooter?: string
  logoUrl?: string
}

const Email = ({ name, target = 'pessoa', company, years, subject, body, brandFooter, logoUrl }: Props) => {
  const isCompany = target === 'empresa'
  const title =
    subject ||
    (isCompany
      ? `Parabéns pelos ${years ? `${years} anos da ` : ''}${name ?? 'sua empresa'}!`
      : `Feliz aniversário, ${name ?? ''}!`)

  return (
    <BrandEmailLayout subject={title} brandFooter={brandFooter} logoUrl={logoUrl}>
          {body ? (
            <EmailParagraphs body={body} />
          ) : isCompany ? (
            <Text style={EMAIL_STYLES.text}>
              A equipe da Liberato Consulting parabeniza a {name} por mais um ano de
              história. Que o próximo ciclo traga crescimento, boas decisões e
              resultados consistentes.
            </Text>
          ) : (
            <Text style={EMAIL_STYLES.text}>
              A equipe da Liberato Consulting deseja um feliz aniversário
              {company ? `, com votos de sucesso também na ${company}` : ''}. Que o novo
              ano pessoal e profissional seja repleto de conquistas.
            </Text>
          )}
    </BrandEmailLayout>
  )
}


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
