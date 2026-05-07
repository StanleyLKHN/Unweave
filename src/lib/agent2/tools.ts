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
// tavily_image_search — Tavily (image results)
//
// Tavily's /search endpoint can return an `images` array when called with
// `include_images: true`. We use that to pull a single fun palm-tree picture
// for the report header. Different shape from web_search: we only need the
// first URL, so we don't go through the snippet-formatting path.
// --------------------------------------------------------------------------
const tavilyImageSearch: LocalTool = {
  definition: {
    name: 'tavily_image_search',
    description:
      'Fetch ONE image URL via Tavily image search. Use exactly once near the end of the run to grab a palm-tree picture for the report header. Pass the returned URL into save_report.palm_image_url. Does not consume the web_search budget.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Image query, e.g. "palm tree".' },
      },
      required: ['query'],
    },
  },
  async handler(input) {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return { result: 'TAVILY_API_KEY is not set on the server. Skip and omit palm_image_url in save_report.', summary: 'tavily not configured' }
    }
    const { query } = input as { query: string }
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic',
          max_results: 1,
          include_images: true,
          topic: 'general',
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        return { result: `Tavily error (${res.status}): ${text.slice(0, 300)}`, summary: 'tavily error' }
      }
      const payload = await res.json() as { images?: Array<string | { url: string }> }
      const first = payload.images?.[0]
      const url = typeof first === 'string' ? first : first?.url
      if (!url) {
        return { result: `No images found for "${query}". Omit palm_image_url in save_report.`, summary: '0 images' }
      }
      return { result: `Image URL for "${query}": ${url}\nPass this URL as palm_image_url in save_report.`, summary: 'image found' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'fetch failed'
      return { result: `Tavily request failed: ${msg}`, summary: 'tavily request failed' }
    }
  },
}

// --------------------------------------------------------------------------
// generate_product_image — Replicate (Flux Schnell)
//
// Calls Replicate's sync endpoint with `Prefer: wait`. Flux Schnell finishes
// in ~3-5s so the request returns the final URL inline. The image is hosted
// on replicate.delivery indefinitely, so we just pass the URL through to
// save_report — no Supabase Storage round-trip.
//
// Workshop note: same external-API pattern as web_search (REST + bearer
// token + JSON in/out). Different vendor, different deliverable, identical
// integration shape. That's the lesson — tools compose vendors, no lock-in.
// --------------------------------------------------------------------------
const generateProductImage: LocalTool = {
  definition: {
    name: 'generate_product_image',
    description:
      'Generate ONE editorial product image via Flux Schnell. Use after web_search and before save_report — once per product. Craft a prompt that bridges the garment\'s actual attributes (material, silhouette, colour) with the dominant trend you identified. Treat this like directing a magazine shoot: setting, light, mood, composition.',
    input_schema: {
      type: 'object',
      properties: {
        product_slug: { type: 'string', description: 'Which product this image is for. Used for status display only — does not affect generation.' },
        prompt: { type: 'string', description: 'Full image prompt. ~30–60 words. Lead with the garment, then setting, then light/mood. Avoid trademarked names. Avoid the word "logo".' },
        aspect_ratio: { type: 'string', enum: ['1:1', '4:5', '3:4', '16:9'], description: 'Default 4:5 (Instagram portrait).' },
      },
      required: ['product_slug', 'prompt'],
    },
  },
  async handler(input) {
    const apiToken = process.env.REPLICATE_API_TOKEN
    if (!apiToken) {
      return { result: 'REPLICATE_API_TOKEN is not set on the server. Tell the operator to configure it, then carry on without an image (pass image_url:null in product_content).', summary: 'replicate not configured' }
    }

    const { prompt, aspect_ratio } = input as { prompt: string; aspect_ratio?: string }

    let res: Response
    try {
      res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: aspect_ratio ?? '4:5',
            output_format: 'webp',
            output_quality: 85,
            num_outputs: 1,
            num_inference_steps: 4,
            disable_safety_checker: false,
          },
        }),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'fetch failed'
      return { result: `Replicate request failed: ${msg}`, summary: 'replicate request failed' }
    }

    if (!res.ok) {
      const text = await res.text()
      return { result: `Replicate error (${res.status}): ${text.slice(0, 300)}`, summary: 'replicate error' }
    }

    const payload = await res.json() as { status?: string; output?: string[] | string; error?: string }

    if (payload.status && payload.status !== 'succeeded') {
      return { result: `Generation did not finish in time (status: ${payload.status}). Try again or skip this product.`, summary: 'generation timeout' }
    }
    if (payload.error) {
      return { result: `Replicate error: ${payload.error}`, summary: 'replicate error' }
    }

    const url = Array.isArray(payload.output) ? payload.output[0] : payload.output
    if (!url) {
      return { result: 'No image URL in Replicate response.', summary: 'no output' }
    }

    return {
      result: `Image generated. URL: ${url}\nPass this URL as image_url in the corresponding product_content entry of save_report.`,
      summary: 'image generated',
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
  image_url?: string
  image_prompt?: string
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
  palm_image_url?: string
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
        palm_image_url: { type: 'string', description: 'Image URL returned by tavily_image_search. Renders at the top of the report. Optional — omit if the search returned nothing.' },
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
              image_url: { type: 'string', description: 'URL returned by generate_product_image for this product. Omit if image generation failed.' },
              image_prompt: { type: 'string', description: 'The prompt you used in generate_product_image, so it is recorded with the report.' },
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
        palm_image_url: payload.palm_image_url ?? null,
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
      image_url: p.image_url ?? null,
      image_prompt: p.image_prompt ?? null,
    }))

    // The trend_reports row IS saved at this point. Even if product_content
    // fails (typically: schema migration not run), we still set reportRef
    // so the runtime treats the run as successful and the UI refreshes.
    reportRef.id = report.id as string
    reportRef.trendCount = payload.trend_highlights.length

    let savedProducts = 0
    let contentError: string | null = null
    if (rows.length) {
      const { error: contentErr } = await supabase.from('product_content').insert(rows)
      if (contentErr) {
        contentError = contentErr.message
      } else {
        savedProducts = rows.length
      }
    }
    reportRef.productCount = savedProducts

    if (contentError) {
      return {
        result: `Saved report ${report.id} (${payload.trend_highlights.length} trends, ${citations.length} citations) but product_content insert failed: ${contentError}. Likely cause: image_url/image_prompt columns missing — run scripts/agent2-images.sql.`,
        summary: `report saved · product_content failed (${contentError.slice(0, 60)})`,
      }
    }

    return {
      result: `Saved report ${report.id}. ${savedProducts} product entries, ${payload.trend_highlights.length} trends, ${citations.length} citations.`,
      summary: `report saved (${savedProducts} products, ${payload.trend_highlights.length} trends)`,
    }
  },
}

// --------------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------------

const TOOLS: LocalTool[] = [webSearch, listProducts, generateProductImage, tavilyImageSearch, saveReport]

export const TOOL_DEFINITIONS: Anthropic.Tool[] = TOOLS.map(t => t.definition)

// Cron runs skip the palm picture — it's a manual-only fun touch.
export function buildToolDefinitions(trigger: 'manual' | 'cron'): Anthropic.Tool[] {
  return TOOLS
    .filter(t => trigger === 'manual' || t.definition.name !== 'tavily_image_search')
    .map(t => t.definition)
}

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
