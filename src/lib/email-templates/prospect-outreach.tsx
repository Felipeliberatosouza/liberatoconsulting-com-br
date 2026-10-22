import React from 'react'
import { Img, Text } from '@react-email/components'
import { BrandEmailLayout, EMAIL_STYLES, EmailParagraphs, emailParagraphs } from './brand-shell'

interface Props {
  subject?: string
  body?: string
  /** Parágrafo sobre notícia recente do setor (ou macroeconomia) do cliente. */
  insight?: string
  bannerUrl?: string
  attachmentNote?: string
  appendix?: string
  brandFooter?: string
  logoUrl?: string
}

/** E-mail de prospecção: texto real em HTML + banner leve (CID) + resumo em PDF anexo. */
export const ProspectOutreachEmail = ({ subject, body, insight, bannerUrl, attachmentNote, appendix, brandFooter, logoUrl }: Props) => {
  const parts = emailParagraphs(body ?? '')
  const head = parts.slice(0, 2).join('\n\n')
  const tail = parts.slice(2).join('\n\n')
  return (
    <BrandEmailLayout subject={subject || 'Liberato Consulting'} brandFooter={brandFooter} logoUrl={logoUrl}>
      <EmailParagraphs body={head} />
      {insight ? (
        <Text style={{ ...EMAIL_STYLES.text, borderLeft: '4px solid #E8630A', backgroundColor: '#FCEBDD', padding: '12px 14px' }}>
          {insight}
        </Text>
      ) : null}
      {bannerUrl ? (
        <Img
          src={bannerUrl}
          alt="Liberato Consulting — estratégia, produtividade e IA aplicada à gestão"
          width="560"
          height="299"
          style={{ display: 'block', width: '100%', maxWidth: '560px', height: 'auto', margin: '6px 0 18px', borderRadius: '6px' }}
        />
      ) : null}
      {tail ? <EmailParagraphs body={tail} /> : null}
      {attachmentNote ? <Text style={EMAIL_STYLES.text}>{attachmentNote}</Text> : null}
      {appendix ? <EmailParagraphs body={appendix} /> : null}
    </BrandEmailLayout>
  )
}
