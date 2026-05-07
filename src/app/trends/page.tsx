// =========================================================================
// /trends — Content & Trend Intelligence dashboard
//
// Server component: pulls the most recent report on initial load and hands
// it to the client dashboard, which handles the "Generate new report"
// streaming flow.
// =========================================================================

import { createClient } from '../../lib/supabase/server'
import TrendDashboard, { type Report, type ProductContent } from './TrendDashboard'

export const dynamic = 'force-dynamic'   // always show the latest report

export default async function TrendsPage() {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('trend_reports')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: productContent } = report
    ? await supabase
        .from('product_content')
        .select('*')
        .eq('report_id', report.id)
        .order('product_name', { ascending: true })
    : { data: [] }

  return (
    <TrendDashboard
      initialReport={(report as Report | null) ?? null}
      initialProductContent={(productContent ?? []) as ProductContent[]}
    />
  )
}
