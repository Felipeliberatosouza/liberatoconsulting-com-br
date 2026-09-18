import React from 'react'
import { Button, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { BrandEmailLayout, EmailParagraphs, EMAIL_STYLES } from './brand-shell'

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
  logoUrl?: string
}

const Email = ({ subject, body, material, link, materials, brandFooter, logoUrl }: Props) => {
  const title = subject || 'Bem-vindo à biblioteca gratuita da Liberato Consulting'
  return (
    <BrandEmailLayout subject={title} brandFooter={brandFooter} logoUrl={logoUrl}>
        <EmailParagraphs body={body ?? ''} />
        {(materials?.length
          ? materials
          : link
            ? [{ title: material || 'material', link }]
            : []
        ).map((item) =>
          item.link ? (
            <Text key={`${item.title}-${item.link}`} style={EMAIL_STYLES.text}>
              <Button style={EMAIL_STYLES.button} href={item.link}>
                {`Baixar ${item.title}`}
              </Button>
            </Text>
          ) : null,
        )}
    </BrandEmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data['subject'] || 'Bem-vindo à biblioteca gratuita da Liberato Consulting',
  displayName: 'Boas-vindas — Ferramentas gratuitas',
  previewData: {
    subject: 'Bem-vindo(a) à biblioteca gratuita da Liberato Consulting, Maria!',
    body: 'Olá Maria, é uma alegria ter você e a Acme conosco.\n\nPreparamos o material Guia de Margem para você.',
    material: 'Guia de Margem',
    link: 'https://liberatoconsulting.com.br/ferramentas',
  },
} satisfies TemplateEntry

