import React from 'react'
import { Button, Text } from '@react-email/components'

import { BrandEmailLayout, EMAIL_STYLES } from './brand-shell'

type AuthActionKind = 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'reauthentication'

const COPY: Record<AuthActionKind, { subject: string; body: string; button?: string }> = {
  invite: {
    subject: 'Convite para acessar a Liberato Consulting',
    body: 'Você recebeu um convite para acessar a Liberato Consulting. Use o botão abaixo para aceitar o convite e criar sua conta.',
    button: 'Aceitar convite',
  },
  magiclink: {
    subject: 'Seu link de acesso à Liberato Consulting',
    body: 'Use o botão abaixo para acessar sua conta. Por segurança, este link expira em breve.',
    button: 'Acessar minha conta',
  },
  recovery: {
    subject: 'Redefina sua senha da Liberato Consulting',
    body: 'Recebemos uma solicitação para redefinir sua senha. Use o botão abaixo para escolher uma nova senha.',
    button: 'Redefinir minha senha',
  },
  email_change: {
    subject: 'Confirme a alteração do seu e-mail',
    body: 'Recebemos uma solicitação para alterar o e-mail da sua conta. Use o botão abaixo para confirmar a mudança.',
    button: 'Confirmar alteração',
  },
  reauthentication: {
    subject: 'Confirme sua identidade',
    body: 'Use o código abaixo para confirmar sua identidade. Por segurança, ele expira em breve.',
  },
}

export function AuthActionEmail({
  kind,
  confirmationUrl,
  token,
  brandFooter,
  logoUrl,
}: {
  kind: AuthActionKind
  confirmationUrl?: string
  token?: string
  brandFooter?: string
  logoUrl?: string
}) {
  const copy = COPY[kind]
  return (
    <BrandEmailLayout subject={copy.subject} brandFooter={brandFooter} logoUrl={logoUrl}>
      <Text style={EMAIL_STYLES.text}>{copy.body}</Text>
      {kind === 'reauthentication' ? (
        <Text style={codeStyle}>{token}</Text>
      ) : confirmationUrl && copy.button ? (
        <Button style={EMAIL_STYLES.button} href={confirmationUrl}>{copy.button}</Button>
      ) : null}
      <Text style={noteStyle}>Se você não solicitou esta ação, ignore esta mensagem com segurança.</Text>
    </BrandEmailLayout>
  )
}

const codeStyle = {
  ...EMAIL_STYLES.text,
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  letterSpacing: '2px',
}

const noteStyle = { ...EMAIL_STYLES.text, fontSize: '12px', lineHeight: '18px', color: '#6b7280', marginTop: '24px' }