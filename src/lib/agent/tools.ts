// =========================================================================
// Tools the Customer Assistant can call.
//
// Each tool has TWO halves:
//   • a `definition` — the schema Claude sees, including a *good* description
//   • a `handler`    — the server-side function that actually does the work
//
// Workshop students: to give the agent a new capability, add an entry here.
// You don't need to touch the runtime.
// =========================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'

export type ToolContext = {
  supabase: SupabaseClient
  customerEmail: string | null
  sessionId: string
}

// Tool inputs are validated by Claude against `input_schema` before they
// reach us, so the handler can cast safely. Using `unknown` here forces
// each handler to declare the exact shape it expects.
type ToolInput = Record<string, unknown>
type ToolResult = { result: string; summary: string; meta?: Record<string, unknown> }
type Tool = {
  definition: Anthropic.Tool
  handler: (input: ToolInput, ctx: ToolContext) => Promise<ToolResult>
}

// --------------------------------------------------------------------------
// list_active_preorders
// --------------------------------------------------------------------------
const listActivePreorders: Tool = {
  definition: {
    name: 'list_active_preorders',
    description:
      'List all garments that are currently open for pre-order. Returns name, slug, material, price, and progress toward the 10-unit production trigger. Use this when the customer asks what is available, what is open, or what is closest to going into production.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  async handler(_input, { supabase }) {
    const { data, error } = await supabase
      .from('products')
      .select('slug, name, material, price, preorder_count, preorder_target, status')
      .eq('status', 'preorder')
      .order('preorder_count', { ascending: false })

    if (error) return { result: `Error: ${error.message}`, summary: 'lookup failed' }
    if (!data || data.length === 0) return { result: 'Nothing is open for pre-order right now.', summary: 'no active pre-orders' }

    const lines = data.map(p =>
      `- ${p.name} (slug: ${p.slug}) · ${p.material} · $${p.price} · ${p.preorder_count}/${p.preorder_target} pre-orders`
    )
    return {
      result: lines.join('\n'),
      summary: `${data.length} active pre-orders`,
      meta: { count: data.length },
    }
  },
}

// --------------------------------------------------------------------------
// lookup_product
// --------------------------------------------------------------------------
const lookupProduct: Tool = {
  definition: {
    name: 'lookup_product',
    description:
      'Get the full record for a single garment by its slug. Use this when the customer asks about a specific piece by name, or when you need material, price, or description detail to answer accurately.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The product slug, e.g. "oatmeal-trench" or "refined-column-dress".' },
      },
      required: ['slug'],
    },
  },
  async handler(input, { supabase }) {
    const { slug } = input as { slug: string }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) return { result: `No product found with slug "${slug}".`, summary: `unknown slug ${slug}` }

    return {
      result: JSON.stringify({
        name: data.name,
        material: data.material,
        price: data.price,
        description: data.description,
        category: data.category,
        is_zero_waste: data.is_zero_waste,
        status: data.status,
        preorder: `${data.preorder_count}/${data.preorder_target}`,
      }, null, 2),
      summary: `looked up ${data.name}`,
    }
  },
}

// --------------------------------------------------------------------------
// check_preorder_progress
// --------------------------------------------------------------------------
const checkPreorderProgress: Tool = {
  definition: {
    name: 'check_preorder_progress',
    description:
      'Get how close a single garment is to its 10-unit production trigger. Cheaper than lookup_product when the customer only wants the count.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The product slug.' },
      },
      required: ['slug'],
    },
  },
  async handler(input, { supabase }) {
    const { slug } = input as { slug: string }
    const { data, error } = await supabase
      .from('products')
      .select('name, preorder_count, preorder_target, status')
      .eq('slug', slug)
      .single()

    if (error || !data) return { result: `No product found with slug "${slug}".`, summary: `unknown slug ${slug}` }
    return {
      result: `${data.name}: ${data.preorder_count}/${data.preorder_target} pre-orders, status="${data.status}".`,
      summary: `${data.name} ${data.preorder_count}/${data.preorder_target}`,
    }
  },
}

// --------------------------------------------------------------------------
// check_order_status
// --------------------------------------------------------------------------
const checkOrderStatus: Tool = {
  definition: {
    name: 'check_order_status',
    description:
      'Verify a customer\'s order by short ID and email. Returns the current status. The short ID is the first 8 characters of the order UUID (what we show on receipts). Both pieces are required — never look up an order on email alone, that leaks data across customers.',
    input_schema: {
      type: 'object',
      properties: {
        short_id: { type: 'string', description: 'First 8 characters of the order id, e.g. "a1b2c3d4".' },
        email: { type: 'string', description: 'Email the order was placed under.' },
      },
      required: ['short_id', 'email'],
    },
  },
  async handler(input, { supabase }) {
    const { short_id, email } = input as { short_id: string; email: string }
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, created_at')
      .eq('customer_email', email)
      .ilike('id', `${short_id}%`)
      .limit(1)
      .maybeSingle()

    if (!data) {
      return {
        result: `No order matches short_id "${short_id}" for that email. Do not invent details — tell the customer you cannot verify and offer to escalate.`,
        summary: 'order not found',
      }
    }
    return {
      result: `Order ${short_id} — status: ${data.status}, total: $${data.total}, placed ${new Date(data.created_at).toDateString()}.`,
      summary: `verified order ${short_id}`,
    }
  },
}

// --------------------------------------------------------------------------
// log_preorder_interest
// --------------------------------------------------------------------------
const logPreorderInterest: Tool = {
  definition: {
    name: 'log_preorder_interest',
    description:
      'Save the customer\'s intent to be notified about a garment without forcing them through checkout. Use this when the customer says things like "let me know when it ships" or "tell me when this is ready". Requires an email — if you don\'t have one, ask for it first.',
    input_schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        slug: { type: 'string' },
        note: { type: 'string', description: 'Optional context, e.g. preferred size or colour.' },
      },
      required: ['email', 'slug'],
    },
  },
  async handler(input, { supabase, sessionId }) {
    const { email, slug, note } = input as { email: string; slug: string; note?: string }
    const { error } = await supabase.from('preorder_interest').insert({
      customer_email: email,
      product_slug: slug,
      note: note ?? null,
      session_id: sessionId,
    })
    if (error) return { result: `Failed to save interest: ${error.message}`, summary: 'save failed' }
    return { result: `Saved. We'll email ${email} when ${slug} progresses.`, summary: `interest logged for ${slug}` }
  },
}

// --------------------------------------------------------------------------
// escalate_to_human
// --------------------------------------------------------------------------
const escalateToHuman: Tool = {
  definition: {
    name: 'escalate_to_human',
    description:
      'Mark this conversation as needing a human teammate, and trigger an admin alert email. Use sparingly — only the cases listed in your escalation rules. After calling this, write one short final sentence to the customer telling them a teammate will follow up.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'One sentence: why this needs a human.' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'], description: 'high for distress, complaints, or urgent shipping issues.' },
      },
      required: ['reason', 'priority'],
    },
  },
  async handler(input, { supabase, customerEmail, sessionId }) {
    const { reason, priority } = input as { reason: string; priority: 'low' | 'normal' | 'high' }
    // Mark session escalated.
    await supabase.from('chat_sessions').update({ status: 'escalated' }).eq('id', sessionId)

    // Drop a row in customer_messages so the existing admin inbox surfaces it.
    const { data: msg } = await supabase
      .from('customer_messages')
      .insert({
        customer_email: customerEmail || `anon-${sessionId.slice(0, 8)}@unweave.local`,
        subject: `Escalation: ${reason}`.slice(0, 200),
        body: reason,
        status: 'needs_human',
        chat_session_id: sessionId,
        escalation_reason: reason,
        escalation_priority: priority,
        follow_up_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    return {
      result: 'Escalation recorded. A teammate will be notified by email.',
      summary: `escalated · ${priority}`,
      meta: { messageId: msg?.id, reason, priority },
    }
  },
}

export const TOOLS: Tool[] = [
  listActivePreorders,
  lookupProduct,
  checkPreorderProgress,
  checkOrderStatus,
  logPreorderInterest,
  escalateToHuman,
]

export const TOOL_DEFINITIONS = TOOLS.map(t => t.definition)
const HANDLERS = new Map(TOOLS.map(t => [t.definition.name, t.handler]))

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
