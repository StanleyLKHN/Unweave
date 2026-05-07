// =========================================================================
// Agent 2 tools
//
// Three LOCAL tools — we implement all of them here, including web search,
// which calls Tavily's REST API. Going through Tavily (instead of letting
// Anthropic do it server-side) shows how to wire ANY external API as a tool:
// describe it, validate input via input_schema, fetch, return structured text.
// =========================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'

import { MAX_WEB_SEARCHES } from './prompt'
import { products as staticProducts } from '../products-data'

export type ToolContext = {
  supabase: SupabaseClient
  // Filled in by save_report and read by the route after the agent finishes.
  reportRef: { id: string | null; productCount: number; trendCount: number }
  // Per-run budget so the agent can't burn through Tavily quota in a loop.
  searchBudget: { used: number; max: number }
}

type ToolInput = Record<string, unknown>
type ToolResult = { result: string; summary: string }

type LocalTool = {
  definition: Anthropic.Tool
  handler: (input: ToolInput, ctx: ToolContext) => Promise<ToolResult>
}

// --------------------------------------------------------------------------
// web_search — Tavily-backed
// --------------------------------------------------------------------------
const webSearch: LocalTool = {
  definition: {
    name: 'web_search',
    description:
      'Search the live web for current fashion trend signal via Tavily. Use this 3–6 times per report with focused queries — broader is worse than narrower. Returns title, url, and a content snippet for each result; cite the urls in your trend_highlights.source_urls.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'A focused search query, ~3–8 words. Example: "linen colour trend SS26".' },
        depth: { type: 'string', enum: ['basic', 'advanced'], description: 'Use "advanced" for editorial / runway analysis where you need deeper content; "basic" otherwise. Defaults to "basic".' },
        max_results: { type: 'integer', minimum: 1, maximum: 10, description: 'How many results to return. Default 5.' },
      },
      required: ['query'],
    },
  },
  async handler(input, { searchBudget }) {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return { result: 'TAVILY_API_KEY is not set on the server. Tell the operator to configure it, then save_report with whatever you already have.', summary: 'tavily not configured' }
    }
    if (searchBudget.used >= searchBudget.max) {
      return { result: `Search budget exhausted (${searchBudget.max} queries used). Stop searching and call save_report with what you have.`, summary: 'budget exhausted' }
    }
    searchBudget.used += 1

    const { query, depth, max_results } = input as { query: string; depth?: 'basic' | 'advanced'; max_results?: number }

    let payload: { query: string; results: Array<{ title: string; url: string; content: string }> }
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: depth ?? 'basic',
          max_results: max_results ?? 5,
          topic: 'general',
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return { result: `Tavily error (${res.status}): ${text.slice(0, 300)}`, summary: 'tavily error' }
      }
      payload = await res.json()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'fetch failed'
      return { result: `Tavily request failed: ${msg}`, summary: 'tavily request failed' }
    }

    if (!payload.results?.length) {
      return { result: `No results for "${query}".`, summary: `0 results for "${query}"` }
    }

    const formatted = payload.results
      .map(r => `• ${r.title}\n  ${r.url}\n  ${r.content.slice(0, 400)}`)
      .join('\n\n')

    return {
      result: `Results for "${query}":\n\n${formatted}`,
      summary: `${payload.results.length} results`,
    }
  },
}

// --------------------------------------------------------------------------
// list_products
//
// Reads from the static catalog file rather than Supabase. The brand's
// catalog is small and changes via PR, not at runtime, so a file is the
// honest source of truth. Demonstrates that a "tool" can wrap any data
// source — DB, file, REST API, in-memory state.
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
  async handler() {
    if (staticProducts.length === 0) {
      return { result: 'No products in catalog.', summary: 'catalog empty' }
    }
    const trimmed = staticProducts.map(p => ({
      slug: p.slug,
      name: p.name,
      material: p.material,
      price: p.price,
      status: p.status,
      category: p.category,
      description: p.description,
      preorder: `${p.preorder_count}/${p.preorder_target}`,
    }))
    return {
      result: JSON.stringify(trimmed, null, 2),
      summary: `${trimmed.length} products`,
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

    // Enrich each product_content row with the human-readable name so the
    // /trends page can render without a join. Source: same static catalog
    // list_products read from.
    const slugToName = new Map(staticProducts.map(p => [p.slug, p.name]))

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

const TOOLS: LocalTool[] = [webSearch, listProducts, saveReport]

export const TOOL_DEFINITIONS: Anthropic.Tool[] = TOOLS.map(t => t.definition)

const HANDLERS = new Map(TOOLS.map(t => [t.definition.name, t.handler]))

export const SEARCH_BUDGET_DEFAULT = MAX_WEB_SEARCHES

export async function runTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const handler = HANDLERS.get(name)
  if (!handler) return { result: `Unknown tool: ${name}`, summary: 'unknown tool' }
  try {
    return await handler((input ?? {}) as ToolInput, ctx)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return { result: `Tool ${name} failed: ${message}`, summary: 'tool error' }
  }
}
