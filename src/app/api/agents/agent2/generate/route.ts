// =========================================================================
// POST /api/agents/agent2/generate
//
// Kicks off Agent 2 (Content & Trend Intelligence). Streams progress as SSE
// so the /trends dashboard can show live status: searching the web,
// drafting copy, saving, done.
// =========================================================================

import { Resend } from 'resend'
import { createClient } from '../../../../../lib/supabase/server'
import { runAgent2, eventToSSE, type Agent2Event } from '../../../../../lib/agent2/runtime'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  const supabase = await createClient()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (event: Agent2Event) => controller.enqueue(encoder.encode(eventToSSE(event)))
      let reportId: string | null = null

      try {
        for await (const event of runAgent2({ supabase, trigger: 'manual' })) {
          if (event.type === 'done') reportId = event.reportId
          send(event)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[agent2/generate] error:', err)
        send({ type: 'error', message })
      } finally {
        controller.close()
      }

      // Email the new report to the admin once the stream is done. Best-effort.
      if (reportId) {
        sendReportEmail(supabase, reportId).catch(err =>
          console.error('[agent2/generate] email failed:', err),
        )
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// --- email delivery ----------------------------------------------------

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function sendReportEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
) {
  const { data: report } = await supabase
    .from('trend_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!report) return

  const trendsHtml = (report.trend_highlights as Array<{ title: string; description: string; source_urls?: string[] }>)
    .map(t => `
      <h4>${escapeHtml(t.title)}</h4>
      <p>${escapeHtml(t.description)}</p>
      ${(t.source_urls ?? []).length ? `<p style="font-size:12px;color:#7A5C45">Sources: ${t.source_urls!.map(u => `<a href="${escapeHtml(u)}">${escapeHtml(u)}</a>`).join(', ')}</p>` : ''}
    `)
    .join('')

  await resend.emails.send({
    from: 'Unweave Trends <onboarding@resend.dev>',
    to: process.env.ADMIN_EMAIL!,
    subject: `Weekly trend report — ${new Date(report.generated_at).toDateString()}`,
    html: `
      <h2>Weekly Trend Intelligence</h2>
      <p>${escapeHtml(report.summary)}</p>
      <h3>Trend highlights</h3>
      ${trendsHtml}
      <h3>Brand implications</h3>
      <p>${escapeHtml(report.brand_implications)}</p>
      <h3>Next week focus</h3>
      <p>${escapeHtml(report.next_week_focus)}</p>
      <hr/>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/trends">Open the dashboard →</a></p>
    `,
  })
}
