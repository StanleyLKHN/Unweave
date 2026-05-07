// =========================================================================
// GET /api/agents/agent2/cron
//
// Weekly cron entry point. Same agent, no streaming — runs to completion
// and returns a summary JSON. Wire it up to Vercel Cron (or any scheduler)
// to fire on a weekly cadence, e.g. Mondays 8am.
//
// Set CRON_SECRET in env and configure the caller to send
// `Authorization: Bearer <secret>`.
// =========================================================================

import { Resend } from 'resend'
import { createClient } from '../../../../../lib/supabase/server'
import { runAgent2 } from '../../../../../lib/agent2/runtime'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET
  if (expected) {
    const got = req.headers.get('authorization')
    if (got !== `Bearer ${expected}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createClient()
  let reportId: string | null = null
  let productCount = 0
  let trendCount = 0
  const errors: string[] = []

  try {
    for await (const event of runAgent2({ supabase, trigger: 'cron' })) {
      if (event.type === 'done') {
        reportId = event.reportId
        productCount = event.productCount
        trendCount = event.trendCount
      } else if (event.type === 'error') {
        errors.push(event.message)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[agent2/cron] error:', err)
    errors.push(msg)
  }

  if (reportId) {
    // Notify admin. Reuses the formatter from the manual route — duplicated
    // intentionally so the two routes are independently readable for the
    // workshop. (DRY-ing it across routes is a five-minute follow-up.)
    const { data: report } = await supabase
      .from('trend_reports')
      .select('summary, generated_at')
      .eq('id', reportId)
      .single()

    if (report) {
      try {
        await resend.emails.send({
          from: 'Unweave Trends <onboarding@resend.dev>',
          to: process.env.ADMIN_EMAIL!,
          subject: `Weekly trend report — ${new Date(report.generated_at).toDateString()}`,
          html: `
            <h2>Weekly Trend Intelligence</h2>
            <p>${report.summary}</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/trends">Open the dashboard →</a></p>
          `,
        })
      } catch (e) {
        console.error('[agent2/cron] email failed:', e)
      }
    }
  }

  return Response.json({
    ok: !!reportId,
    reportId,
    productCount,
    trendCount,
    errors,
  })
}
