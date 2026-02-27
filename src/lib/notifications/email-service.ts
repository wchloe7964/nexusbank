/**
 * Email & SMS notification service.
 *
 * Abstracts delivery behind a provider-agnostic interface.
 * All notifications are logged to `email_log` / `sms_log` tables for auditing.
 * Provider adapters at the bottom of this file handle actual delivery.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface SendEmailOptions {
  to: string
  subject: string
  body: string
  userId?: string
  templateName?: string
  metadata?: Record<string, unknown>
}

export interface SendSmsOptions {
  to: string
  body: string
  userId?: string
  templateName?: string
}

/**
 * Send an email and log it.
 * Returns the email log ID.
 */
export async function sendEmail(options: SendEmailOptions): Promise<string> {
  const admin = createAdminClient()

  // 1. Create log entry
  const { data: logEntry, error: logError } = await admin
    .from('email_log')
    .insert({
      user_id: options.userId || null,
      template_name: options.templateName || null,
      to_address: options.to,
      subject: options.subject,
      body_preview: options.body.slice(0, 200),
      status: 'queued',
      metadata: options.metadata || {},
    })
    .select('id')
    .single()

  if (logError || !logEntry) {
    console.error('Failed to create email log:', logError)
    return ''
  }

  // 2. Send via provider
  try {
    await deliverEmail(options)

    // 3. Mark as sent
    await admin
      .from('email_log')
      .update({ status: 'sent', sent_at: new Date().toISOString(), provider: process.env.RESEND_API_KEY ? 'resend' : 'internal' })
      .eq('id', logEntry.id)
  } catch (err) {
    // Mark as failed
    await admin
      .from('email_log')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      })
      .eq('id', logEntry.id)
  }

  return logEntry.id
}

/**
 * Send an SMS and log it.
 */
export async function sendSms(options: SendSmsOptions): Promise<string> {
  const admin = createAdminClient()

  const { data: logEntry, error: logError } = await admin
    .from('sms_log')
    .insert({
      user_id: options.userId || null,
      template_name: options.templateName || null,
      to_number: options.to,
      body: options.body,
      status: 'queued',
    })
    .select('id')
    .single()

  if (logError || !logEntry) {
    console.error('Failed to create SMS log:', logError)
    return ''
  }

  try {
    await deliverSms(options)

    await admin
      .from('sms_log')
      .update({ status: 'sent', sent_at: new Date().toISOString(), provider: process.env.RESEND_API_KEY ? 'resend' : 'internal' })
      .eq('id', logEntry.id)
  } catch (err) {
    await admin
      .from('sms_log')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      })
      .eq('id', logEntry.id)
  }

  return logEntry.id
}

/**
 * Render a template with variable substitution.
 * Variables use {{name}} syntax.
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
}

/**
 * Send a templated notification (email + optional SMS).
 * Looks up the template, renders it, and dispatches.
 */
export async function sendTemplatedNotification(
  templateName: string,
  userId: string,
  vars: Record<string, string>
): Promise<void> {
  const admin = createAdminClient()

  // Get user profile for email/phone
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, notification_email, notification_sms, phone_number')
    .eq('id', userId)
    .single()

  // Get user email from auth
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const email = authUser?.user?.email
  if (!email) return

  const fullVars = { ...vars, name: profile?.full_name || 'Customer' }

  // Fetch all matching templates
  const { data: templates } = await admin
    .from('notification_templates')
    .select('*')
    .eq('name', templateName)
    .eq('is_active', true)

  if (!templates?.length) return

  for (const tmpl of templates) {
    if (tmpl.channel === 'email' && profile?.notification_email !== false) {
      const subject = renderTemplate(tmpl.subject_template, fullVars)
      const body = renderTemplate(tmpl.body_template, fullVars)
      await sendEmail({ to: email, subject, body, userId, templateName })
    }

    if (tmpl.channel === 'sms' && profile?.notification_sms && profile?.phone_number) {
      const body = renderTemplate(tmpl.body_template, fullVars)
      await sendSms({ to: profile.phone_number, body, userId, templateName })
    }
  }
}

// ── Provider Adapters ──────────────────────────────────────────────────────────
// Configure via RESEND_API_KEY / TWILIO_SID environment variables.

// Dynamic loader that avoids static analysis by bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryLoadModule(name: string): Promise<any | null> {
  try {
    // Use indirect eval to bypass Turbopack/webpack static analysis
    return await new Function('m', 'return import(m)')(name)
  } catch {
    return null
  }
}

async function deliverEmail(options: SendEmailOptions): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    const mod = await tryLoadModule('resend')
    if (mod?.Resend) {
      const resend = new mod.Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'NexusBank <no-reply@nexusbank.co.uk>',
        to: options.to,
        subject: options.subject,
        text: options.body,
      })
      return
    }
  }
  // Logged to email_log table (external delivery via provider when configured)
  void options
}

async function deliverSms(options: SendSmsOptions): Promise<void> {
  if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
    const mod = await tryLoadModule('twilio')
    if (mod?.default) {
      const client = mod.default(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: options.to,
        body: options.body,
      })
      return
    }
  }
  // Logged to sms_log table (external delivery via provider when configured)
  void options
}
