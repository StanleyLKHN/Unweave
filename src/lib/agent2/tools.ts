// =========================================================================
// Agent 2 tools
//
// Two LOCAL tools that we implement here:
//   • list_products — gives the agent the current catalog
//   • save_report   — the structured deliverable: agent dumps everything in
//                     one schema-validated call, we persist to two tables
//
// One SERVER tool we just declare — Anthropic runs it on their side:
//   • web_search    — live fashion trend research
// =========================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'

import { MAX_WEB_SEARCHES } from './prompt'

export type ToolContext = {
  supabase: SupabaseClient
  // Filled in by save_report and read by the route after the agent finishes.
  reportRef: { id: string | null; productCount: number; trendCount: number }
}

type ToolInput = Record<string, unknown>
type ToolResult = { result: string; summary: string }

type LocalTool = {
  definition: Anthropic.Tool
  handler: (input: ToolInput, ctx: ToolContext) => Promise<ToolResult>
}

// --------------------------------------------------------------------------
// list_products
// --------------------------------------------------------------------------
const listProducts: LocalTool = {
  definition: {
    name: 'list_products',
    description:
      'Return the full active catalog: name, slug, material, price, status, description, and pre-order progress. Call this first — every report references real products by slug.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  async handler(_input, { supabase }) {
    const { data, error } = await supabase
      .from('products')
      .select('slug, name, material, price, status, description, category, preorder_count, preorder_target')
      .order('created_at', { ascending: false })

    if (error) return { result: `Error: ${error.message}`, summary: 'catalog fetch failed' }
    if (!data || data.length === 0) return { result: 'No products in catalog.', summary: 'catalog empty' }

    return {
      result: JSON.stringify(data, null, 2),
      summary: `${data.length} products`,
    }
  },
}

// --------------------------------------------------------------------------
// save_report
// --------------------------------------------------------------------------
type ProductContentInput = {
  product_slug: string
  social_caption?: string
  email_blurb?: string
  expanded_description?: string
}

type SaveReportInput = {
  summary: string
  trend_highlights: Array<{
    title: string
    description: string
    source_urls?: string[]
  }>
  brand_implications: string
  next_week_focus: string
  product_content: ProductContentInput[]
}

const saveReport: LocalTool = {
  definition: {
    name: 'save_report',
    description:
      'Persist the finished weekly report. Call this exactly once, at the end, with the FULL payload. The schema is strict — fields cannot be added or removed.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: '2–3 sentence executive summary.' },
        trend_highlights: {
          type: 'array',
          minItems: 3,
          maxItems: 5,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              source_urls: { type: 'array', items: { type: 'string' }, description: 'URLs from web_search that back this trend.' },
            },
            required: ['title', 'description'],
          },
        },
        brand_implications: { type: 'string', description: 'One paragraph. How trends apply to Unweave specifically.' },
        next_week_focus: { type: 'string', description: 'One paragraph. Which product, which angle, what to push.' },
        product_content: {
          type: 'array',
          description: 'One entry per active product slug. Cover all of them.',
          items: {
            type: 'object',
            properties: {
              product_slug: { type: 'string' },
              social_caption: { type: 'string', description: '1–2 lines for Instagram. No hashtags.' },
              email_blurb: { type: 'string', description: '2–3 sentences for the weekly newsletter.' },
              expanded_description: { type: 'string', description: '~80 words for the product page, bridging into the trend.' },
            },
            required: ['product_slug', 'social_caption', 'email_blurb', 'expanded_description'],
          },
        },
      },
      required: ['summary', 'trend_highlights', 'brand_implications', 'next_week_focus', 'product_content'],
    },
  },

  async handler(input, { supabase, reportRef }) {
    const payload = input as unknown as SaveReportInput

    // Need to enrich each product_content row with the human-readable name,
    // so the /trends page can render without a join.
    const slugs = payload.product_content.map(p => p.product_slug)
    const { data: products } = await supabase
      .from('products')
      .select('slug, name')
      .in('slug', slugs)
    const slugToName = new Map((products ?? []).map(p => [p.slug, p.name as string]))

    // Deduplicated citations across all trend highlights.
    const citations = Array.from(
      new Set(payload.trend_highlights.flatMap(t => t.source_urls ?? []).filter(Boolean)),
    )

    const { data: report, error: reportErr } = await supabase
      .from('trend_reports')
      .insert({
        model: 'claude-sonnet-4-6',
        summary: payload.summary,
        trend_highlights: payload.trend_highlights,
        brand_implications: payload.brand_implications,
        next_week_focus: payload.next_week_focus,
        citations,
      })
      .select('id')
      .single()

    if (reportErr || !report) {
      return { result: `Failed to save report: ${reportErr?.message}`, summary: 'save failed' }
    }

    const rows = payload.product_content.map(p => ({
      report_id: report.id,
      product_slug: p.product_slug,
      product_name: slugToName.get(p.product_slug) ?? p.product_slug,
      social_caption: p.social_caption ?? '',
      email_blurb: p.email_blurb ?? '',
      expanded_description: p.expanded_description ?? '',
    }))

    if (rows.length) {
      const { error: contentErr } = await supabase.from('product_content').insert(rows)
      if (contentErr) {
        return { result: `Saved report but failed to save product_content: ${contentErr.message}`, summary: 'partial save' }
      }
    }

    reportRef.id = report.id as string
    reportRef.productCount = rows.length
    reportRef.trendCount = payload.trend_highlights.length

    return {
      result: `Saved report ${report.id}. ${rows.length} product entries, ${payload.trend_highlights.length} trends, ${citations.length} citations.`,
      summary: `report saved (${rows.length} products, ${payload.trend_highlights.length} trends)`,
    }
  },
}

// --------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------

const LOCAL_TOOLS: LocalTool[] = [listProducts, saveReport]

// Anthropic-side tool union: our local tools + the server-side web_search.
// max_uses caps how many searches the model can run in one report.
export const TOOL_DEFINITIONS: Anthropic.ToolUnion[] = [
  ...LOCAL_TOOLS.map(t => t.definition),
  {
    type: 'web_search_20260209',
    name: 'web_search',
    max_uses: MAX_WEB_SEARCHES,
  },
]

const HANDLERS = new Map(LOCAL_TOOLS.map(t => [t.definition.name, t.handler]))

export function isLocalTool(name: string): boolean {
  return HANDLERS.has(name)
}

export async function runLocalTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const handler = HANDLERS.get(name)
  if (!handler) return { result: `Unknown local tool: ${name}`, summary: 'unknown tool' }
  try {
    return await handler((input ?? {}) as ToolInput, ctx)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return { result: `Tool ${name} failed: ${message}`, summary: 'tool error' }
  }
}
