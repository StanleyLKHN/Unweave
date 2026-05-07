// =========================================================================
// Agent 2 runtime
//
// One-shot agent: takes no user input, just runs to completion and emits
// status events the dashboard renders as a live progress feed. The final
// "done" event carries the new report id so the page can refresh to it.
// =========================================================================

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

import { MODEL, MAX_TOKENS, MAX_TOOL_TURNS, SYSTEM_PROMPT } from './prompt'
import { TOOL_DEFINITIONS, isLocalTool, runLocalTool, type ToolContext } from './tools'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Agent2Event =
  | { type: 'status'; label: string }
  | { type: 'search'; query: string }
  | { type: 'tool_use'; name: string; label: string }
  | { type: 'tool_result'; name: string; summary: string }
  | { type: 'done'; reportId: string; productCount: number; trendCount: number }
  | { type: 'error'; message: string }

const STATUS_LABEL: Record<string, string> = {
  list_products: 'Pulling the active catalog…',
  save_report:   'Saving the finished report…',
}

export async function* runAgent2(args: {
  supabase: SupabaseClient
  trigger: 'manual' | 'cron'
}): AsyncGenerator<Agent2Event> {
  const { supabase, trigger } = args

  const reportRef: ToolContext['reportRef'] = { id: null, productCount: 0, trendCount: 0 }
  const ctx: ToolContext = { supabase, reportRef }

  yield {
    type: 'status',
    label: trigger === 'cron' ? 'Weekly run starting…' : 'Booting up the trend agent…',
  }

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: 'Generate this week\'s Content & Trend Intelligence report. Follow the system prompt.',
    },
  ]

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      messages,
    })

    // Emit a status event the moment a server-side tool block opens — gives
    // students a visible "the agent is searching the web" beat.
    let inputJsonAcc = ''
    let inputJsonToolName = ''

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        const block = event.content_block
        if (block.type === 'server_tool_use' && block.name === 'web_search') {
          inputJsonToolName = 'web_search'
          inputJsonAcc = ''
        } else if (block.type === 'tool_use') {
          yield { type: 'tool_use', name: block.name, label: STATUS_LABEL[block.name] ?? `Running ${block.name}…` }
        } else if (block.type === 'web_search_tool_result') {
          const content = block.content
          const count = Array.isArray(content) ? content.length : 0
          yield { type: 'tool_result', name: 'web_search', summary: count ? `${count} results` : 'no results' }
        }
      } else if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
        // Web-search query is streamed as JSON deltas — accumulate, then
        // surface the actual search string the moment we have it.
        inputJsonAcc += event.delta.partial_json
        if (inputJsonToolName === 'web_search') {
          const m = inputJsonAcc.match(/"query"\s*:\s*"([^"]*)"/)
          if (m) {
            yield { type: 'search', query: m[1] }
            inputJsonToolName = ''
            inputJsonAcc = ''
          }
        }
      }
    }

    const final = await stream.finalMessage()
    messages.push({ role: 'assistant', content: final.content })

    if (final.stop_reason !== 'tool_use') {
      // Either save_report was already called (reportRef.id is set) or the
      // agent gave up without producing one.
      if (reportRef.id) {
        yield {
          type: 'done',
          reportId: reportRef.id,
          productCount: reportRef.productCount,
          trendCount: reportRef.trendCount,
        }
        return
      }
      yield { type: 'error', message: 'Agent finished without saving a report.' }
      return
    }

    // Run any LOCAL tool calls. Server tools (web_search) were already
    // resolved by Anthropic and their results are in final.content already.
    const localCalls = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && isLocalTool(b.name),
    )

    if (localCalls.length === 0) {
      // Server tool turn only — keep looping; Claude will continue.
      continue
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const tu of localCalls) {
      const out = await runLocalTool(tu.name, tu.input, ctx)
      yield { type: 'tool_result', name: tu.name, summary: out.summary }
      toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: out.result })
    }
    messages.push({ role: 'user', content: toolResults })
  }

  yield { type: 'error', message: `Tool turn budget (${MAX_TOOL_TURNS}) exhausted.` }
}

export function eventToSSE(event: Agent2Event): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}
