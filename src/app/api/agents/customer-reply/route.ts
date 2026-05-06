import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createClient } from '../../../../lib/supabase/server'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const resend = new Resend(process.env.RESEND_API_KEY)

const SYSTEM_PROMPT = `You are the customer service voice of Unweave.

Unweave is a zero-waste fashion label. We only produce garments after 10 pre-orders are placed. No stock, no surplus.

Tone: warm, knowledgeable, unhurried. Never pushy. Never use exclamation marks.
Keep replies concise — 2-4 sentences max.
If you have order context — reference it specifically in your reply.
If asked about production — explain the pre-order model simply.`

export async function POST(req: Request) {
  try {
    const { message, customerEmail, subject } = await req.json()
    const supabase = await createClient()

    // 1. Save incoming message
    const { data: saved } = await supabase
      .from('customer_messages')
      .insert({
        customer_email: customerEmail || 'anonymous@unweave.com',
        subject: subject || 'Chat message',
        body: message,
        status: 'new',
      })
      .select()
      .single()

    // 2. Fetch order history + product context
    let orderContext = ''
    if (customerEmail) {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id, status, total, created_at,
          order_items (
            quantity, price,
            products (name, material, status, preorder_count, preorder_target)
          )
        `)
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false })
        .limit(3)

      if (orders && orders.length > 0) {
        orderContext = '\n\nCustomer order history:\n'
        orders.forEach(order => {
          orderContext += `- Order #${order.id.slice(0, 8)}, status: ${order.status}, total: $${order.total}\n`
          order.order_items?.forEach((item: any) => {
            const p = item.products
            if (p) {
              orderContext += `  Product: ${p.name} (${p.material}), `
              orderContext += `production status: ${p.status}`
              if (p.preorder_count && p.preorder_target) {
                orderContext += `, ${p.preorder_count}/${p.preorder_target} pre-orders`
              }
              orderContext += '\n'
            }
          })
        })
      }
    }

    // 3. Call Claude with full context
    const response = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT + orderContext,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Thank you for your message. We will get back to you shortly.'

    // 4. Save draft + set follow-up trigger (24h)
    const followUpAt = new Date(Date.now() + 30 * 1000)
    if (saved?.id) {
      await supabase
        .from('customer_messages')
        .update({
          draft_reply: reply,
          status: 'draft',
          follow_up_at: followUpAt.toISOString(),
        })
        .eq('id', saved.id)
    }

    // 5. Email alert to admin
    await resend.emails.send({
      from: 'Unweave Agent <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL!,
      subject: `New message from ${customerEmail || 'anonymous'} — draft ready`,
      html: `
        <h2>New customer message</h2>
        <p><strong>From:</strong> ${customerEmail || 'anonymous'}</p>
        <p><strong>Message:</strong> ${message}</p>
        <hr/>
        <h3>Agent draft reply:</h3>
        <p>${reply}</p>
        <hr/>
        <p><strong>Follow-up trigger set for:</strong> ${followUpAt.toLocaleString()}</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/messages">View in Admin →</a></p>
      `,
    })

    return Response.json({ reply })

  } catch (error) {
    console.error('Agent error:', error)
    return Response.json(
      { reply: 'Thank you for your message. We will get back to you shortly.' },
      { status: 500 }
    )
  }
}