// =========================================================================
// /api/agents/follow-up
//
// Cron-triggered. Finds escalations the team hasn't replied to within 24h
// and re-pings the admin email. Best-effort — failures don't retry, the
// next cron run picks them up.
// =========================================================================

import { Resend } from 'resend'
import { createClient } from '../../../../lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  // Optional shared-secret check. Set CRON_SECRET in your env and configure
  // the cron caller to pass `Authorization: Bearer <secret>`.
  const expected = process.env.CRON_SECRET
  if (expected) {
    const got = req.headers.get('authorization')
    if (got !== `Bearer ${expected}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createClient()

  const { data: overdue } = await supabase
    .from('customer_messages')
    .select('id, customer_email, body, escalation_reason, escalation_priority, follow_up_at')
    .eq('status', 'needs_human')
    .lt('follow_up_at', new Date().toISOString())

  if (!overdue || overdue.length === 0) {
    return Response.json({ message: 'No follow-ups needed', count: 0 })
  }

  for (const msg of overdue) {
    const flag = msg.escalation_priority === 'high' ? '🚨' : '⏰'
    await resend.emails.send({
      from: 'Unweave Agent <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL!,
      subject: `${flag} Reminder: ${msg.customer_email} still waiting`,
      html: `
        <h2>Reminder — escalation has not been replied to</h2>
        <p><strong>From:</strong> ${msg.customer_email}</p>
        <p><strong>Reason:</strong> ${msg.escalation_reason ?? msg.body}</p>
        <p><strong>Priority:</strong> ${msg.escalation_priority ?? 'normal'}</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/messages">Reply in Admin →</a></p>
      `,
    })

    await supabase
      .from('customer_messages')
      .update({ status: 'follow_up_sent' })
      .eq('id', msg.id)
  }

  return Response.json({ message: `Sent ${overdue.length} reminders`, count: overdue.length })
}
