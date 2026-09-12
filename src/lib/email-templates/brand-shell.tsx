import React from 'react'
import { Hr, Img, Text } from '@react-email/components'

import { EMAIL_LOGO_URL, brandFooterText } from '@/lib/email-brand'

/** Logomarca exibida no topo de todos os e-mails automáticos. */
export const BrandLogo = () => (
  <Img
    src={EMAIL_LOGO_URL}
    alt="Liberato Consulting"
    width="180"
    style={{ display: 'block', margin: '0 0 20px' }}
  />
)

/** Rodapé institucional (razão social, CNPJ, endereço e contatos). */
export const BrandFooter = ({ text }: { text?: string | undefined }) => (
  <>
    <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
    <Text style={{ fontSize: '12px', lineHeight: '18px', color: '#6b7280', margin: '0' }}>
      {text || brandFooterText(undefined)}
    </Text>
  </>
)
