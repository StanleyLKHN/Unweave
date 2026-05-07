// =========================================================================
// Agent runtime: streams text from Claude, runs tools, loops until done.
//
// This is the "engine room". Most workshop changes happen in prompt.ts and
// tools.ts — you should rarely need to edit this file. Read it once to see
// how the tool loop works, then leave it alone.
// =========================================================================

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

import { MODEL, MAX_TOKENS, MAX_TOOL_TURNS, SYSTEM_PROMPT, BRAND_KB } from './prompt'
import { TOOL_DEFINITIONS, runTool, type ToolContext } from './tools'
import { appendTurn, loadHistory } from './sessions'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Events the runtime emits. The route handler turns these into SSE lines.
export type AgentEvent =
  | { type: 'meta'; sessionId: string; isNewSession: boolean }
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; name: string; label: string }
  | { type: 'tool_result'; name: string; summary: string }
  | { type: 'done'; escalated: boolean }
  | { type: 'error'; message: string }

const TOOL_LABELS: Record<string, string> = {
  list_active_preorders:   'Checking active pre-orders…',
  lookup_product:          'Looking up the garment…',
  check_preorder_progress: 'Checking pre-order count…',
  check_order_status:      'Verifying your order…',
  log_preorder_interest:   'Saving your interest…',
  escalate_to_human:       'Flagging for a teammate…',
}

export async function* runAgent(args: {
  supabase: SupabaseClient
  sessionId: string
  isNewSession: boolean
  customerEmail: string | null
  userMessage: string
}): AsyncGenerator<AgentEvent> {
  const { supabase, sessionId, isNewSession, customerEmail, userMessage } = args

  yield { type: 'meta', sessionId, isNewSession }

  // 1. Persist the user turn before doing anything that can fail. If Claude
  //    errors out, we still have a record the customer wrote in.
  await appendTurn(supabase, sessionId, 'user', [{ type: 'text', text: userMessage }])

  // 2. Build the conversation we send to Claude: the trimmed history, ending
  //    with the user message we just stored.
  const history = await loadHistory(supabase, sessionId)
  const messages: Anthropic.MessageParam[] = history

  const ctx: ToolContext = { supabase, customerEmail, sessionId }
  let escalated = false

  // 3. Tool loop. Each iteration is one Claude call. We stop on `end_turn`
  //    or after MAX_TOOL_TURNS, whichever comes first.
  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        // Cache the brand identity + KB across turns. ~50% input savings on
        // turn 2+ within the 5-min cache window.
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: BRAND_KB,      cache_control: { type: 'ephemeral' } },
      ],
      tools: TOOL_DEFINITIONS,
      messages,
    })

    // 3a. Stream text deltas to the client as they arrive. Tool-use deltas
    //     are not streamed; we wait for the final message to execute them.
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', delta: event.delta.text }
      }
    }

    const final = await stream.finalMessage()

    // 3b. Persist the assistant turn verbatim so the next request can replay
    //     tool_use blocks back to Claude — required for multi-turn tool use.
    await appendTurn(supabase, sessionId, 'assistant', final.content)
    messages.push({ role: 'assistant', content: final.content })

    // 3c. End of turn — Claude is done speaking.
    if (final.stop_reason !== 'tool_use') {
      yield { type: 'done', escalated }
      return
    }

    // 3d. Tool use — run each tool_use block and feed results back.
    const toolUses = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const tu of toolUses) {
      yield { type: 'tool_call', name: tu.name, label: TOOL_LABELS[tu.name] ?? `Running ${tu.name}…` }

      const out = await runTool(tu.name, tu.input, ctx)
      if (tu.name === 'escalate_to_human') escalated = true

      yield { type: 'tool_result', name: tu.name, summary: out.summary }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: out.result,
      })
    }

    // 3e. Append tool results as a user turn — Anthropic's convention.
    await appendTurn(supabase, sessionId, 'user', toolResults)
    messages.push({ role: 'user', content: toolResults })
  }

  // Hit the safety cap — the model kept asking for tools. Tell the client
  // we ran out of budget rather than silently truncating.
  yield {
    type: 'error',
    message: `Agent exceeded ${MAX_TOOL_TURNS} tool turns without finishing. Try rephrasing.`,
  }
}

// SSE serialiser. One JSON object per event, framed for EventSource clients.
export function eventToSSE(event: AgentEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}
