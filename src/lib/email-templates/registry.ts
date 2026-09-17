import type { ComponentType } from 'react'

import { template as leadNotification } from './lead-notification'
import { template as applicationNotification } from './application-notification'
import { template as crmBirthday } from './crm-birthday'
import { template as toolsWelcome } from './tools-welcome'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'lead-notification': leadNotification,
  'application-notification': applicationNotification,
  'crm-birthday': crmBirthday,
  'tools-welcome': toolsWelcome,
}
