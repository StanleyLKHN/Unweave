import { Resend } from 'resend'
import { createClient } from '../../../../lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { messageId, email, reply } = await req.json()
  const supabase = await createClient()

  await resend.emails.send({
    from: 'Unweave <onboarding@resend.dev>',
    to: email,
    subject: 'Reply from Unweave',
    html: `<p>${reply}</p>`,
  })

  await supabase
    .from('customer_messages')
    .update({ status: 'sent' })
    .eq('id', messageId)

  return Response.json({ success: true })
}   