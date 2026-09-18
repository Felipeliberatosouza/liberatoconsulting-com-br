import React from 'react'
import { Button } from '@react-email/components'

import { BrandEmailLayout, EmailParagraphs, EMAIL_STYLES } from './brand-shell'

interface Props {
  /** Assunto vindo do modelo editável no painel (já com variáveis preenchidas). */
  subject: string
  /** Texto vindo do modelo editável no painel (já com variáveis preenchidas). */
  body: string
  /** Rótulo do botão de confirmação, no idioma do destinatário. */
  buttonLabel: string
  confirmationUrl: string
  lang?: string
  brandFooter?: string | undefined
  logoUrl?: string | undefined
}

export const AuthSignupEmail = ({
  subject,
  body,
  buttonLabel,
  confirmationUrl,
  lang = 'pt-BR',
  brandFooter,
  logoUrl,
}: Props) => (
  <BrandEmailLayout lang={lang} subject={subject} brandFooter={brandFooter} logoUrl={logoUrl}>
    <EmailParagraphs body={body} />
    <Button style={EMAIL_STYLES.button} href={confirmationUrl}>{buttonLabel}</Button>
  </BrandEmailLayout>
)

export default AuthSignupEmail

