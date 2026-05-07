// =========================================================================
// /api/agents/customer-reply
//
// Streams the agent's response back as Server-Sent Events. Also:
//   • mints/reuses a chat session via cookie
//   • persists the full transcript in chat_messages
//   • sends an admin alert email ONLY when the agent escalates
//
// The heavy lifting lives in src/lib/agent/*. This file is a thin glue.
// =========================================================================

import { Resend } from 'resend'
import { createClient } from '../../../../lib/supabase/server'
import { runAgent, eventToSSE, type AgentEvent } from '../../../../lib/agent/runtime'
import { getOrCreateSession, readSessionCookie, sessionCookieHeader } from '../../../../lib/agent/sessions'

const resend = new Resend(process.env.RESEND_API_KEY)

const MAX_MESSAGE_LENGTH = 2000

export async function POST(req: Request) {
  let body: { message?: string; customerEmail?: string | null }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const message = (body.message ?? '').trim()
  if (!message) return Response.json({ error: 'Empty message' }, { status: 400 })
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` }, { status: 400 })
  }

  const customerEmail = body.customerEmail?.trim() || null
  const supabase = await createClient()
  const cookieSessionId = readSessionCookie(req)
  const { sessionId, isNew } = await getOrCreateSession(supabase, cookieSessionId, customerEmail)

  // Stream the agent's events as SSE.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: AgentEvent) => controller.enqueue(encoder.encode(eventToSSE(event)))

      let escalated = false

      try {
        for await (const event of runAgent({ supabase, sessionId, isNewSession: isNew, customerEmail, userMessage: message })) {
          if (event.type === 'done' && event.escalated) escalated = true
          send(event)
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[customer-reply] agent error:', err)
        send({ type: 'error', message: errMsg })
      } finally {
        controller.close()
      }

      // Fire admin email AFTER the stream closes — don't block the customer
      // waiting for SMTP. Best-effort: log but don't crash on failure.
      if (escalated) sendAdminEscalationAlert(supabase, sessionId, customerEmail).catch(e =>
        console.error('[customer-reply] admin alert failed:', e),
      )
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...(isNew ? { 'Set-Cookie': sessionCookieHeader(sessionId) } : {}),
    },
  })
}

// --- escalation email --------------------------------------------------

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendAdminEscalationAlert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  customerEmail: string | null,
) {
  // Pull the last few transcript entries for context.
  const { data: rows } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(10)

  const transcript = (rows ?? [])
    .reverse()
    .map(r => {
      const blocks = Array.isArray(r.content) ? r.content : []
      const text = blocks
        .map((b: { type: string; text?: string; name?: string }) => {
          if (b.type === 'text') return b.text ?? ''
          if (b.type === 'tool_use') return `[tool: ${b.name}]`
          if (b.type === 'tool_result') return '[tool result]'
          return ''
        })
        .filter(Boolean)
        .join(' ')
      return `<p><strong>${r.role}:</strong> ${escapeHtml(text)}</p>`
    })
    .join('')

  await resend.emails.send({
    from: 'Unweave Agent <onboarding@resend.dev>',
    to: process.env.ADMIN_EMAIL!,
    subject: `Escalation needed — ${customerEmail ?? 'anonymous'}`,
    html: `
      <h2>Customer escalation</h2>
      <p><strong>From:</strong> ${escapeHtml(customerEmail ?? 'anonymous')}</p>
      <p><strong>Session:</strong> ${sessionId}</p>
      <hr/>
      <h3>Recent transcript</h3>
      ${transcript || '<p><em>(empty)</em></p>'}
      <hr/>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/messages">Reply in Admin →</a></p>
    `,
  })
}
