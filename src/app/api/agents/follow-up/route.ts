import { Resend } from 'resend'
import { createClient } from '../../../../lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  try {
    const supabase = await createClient()

    // Find all messages where follow_up_at has passed and status is still 'draft'
    const { data: overdueMessages } = await supabase
      .from('customer_messages')
      .select('*')
      .eq('status', 'draft')
      .lt('follow_up_at', new Date().toISOString())

    if (!overdueMessages || overdueMessages.length === 0) {
      return Response.json({ message: 'No follow-ups needed', count: 0 })
    }

    // Send reminder email for each overdue message
    for (const msg of overdueMessages) {
      await resend.emails.send({
        from: 'Unweave Agent <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL!,
        subject: `⏰ Follow-up needed: ${msg.customer_email}`,
        html: `
          <h2>Follow-up reminder</h2>
          <p>This message has not been replied to yet.</p>
          <p><strong>From:</strong> ${msg.customer_email}</p>
          <p><strong>Message:</strong> ${msg.body}</p>
          <hr/>
          <h3>Agent draft:</h3>
          <p>${msg.draft_reply}</p>
          <hr/>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/messages">Reply in Admin →</a></p>
        `,
      })

      // Mark as follow_up_sent so we don't spam
      await supabase
        .from('customer_messages')
        .update({ status: 'follow_up_sent' })
        .eq('id', msg.id)
    }

    return Response.json({
      message: `Sent ${overdueMessages.length} follow-up reminders`,
      count: overdueMessages.length,
    })

  } catch (error) {
    console.error('Follow-up error:', error)
    return Response.json({ error: 'Failed to process follow-ups' }, { status: 500 })
  }
}