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

import { BrandFooter, BrandLogo } from './brand-shell'

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
}

export const AuthSignupEmail = ({
  subject,
  body,
  buttonLabel,
  confirmationUrl,
  lang = 'pt-BR',
  brandFooter,
}: Props) => (
  <Html lang={lang} dir="ltr">
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <BrandLogo />
        <Heading style={heading}>{subject}</Heading>
        {body
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((paragraph, index) => (
            <Text key={index} style={text}>
              {paragraph}
            </Text>
          ))}
        <Button style={button} href={confirmationUrl}>
          {buttonLabel}
        </Button>
        <BrandFooter text={brandFooter} />
      </Container>
    </Body>
  </Html>
)

export default AuthSignupEmail

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
