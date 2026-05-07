// =========================================================================
// Agent 2 runtime
//
// One-shot agent: takes no user input, runs to completion, emits status
// events the dashboard renders as a live progress feed. The final "done"
// event carries the new report id so the page can refresh to it.
//
// All three tools (web_search, list_products, save_report) are local — the
// runtime treats them uniformly. Same loop you'd use in any tool-use agent.
// =========================================================================

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

import { MODEL, MAX_TOKENS, MAX_TOOL_TURNS, buildSystemPrompt } from './prompt'
import { buildToolDefinitions, runTool, SEARCH_BUDGET_DEFAULT, type ToolContext } from './tools'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type Agent2Event =
  | { type: 'status'; label: string }
  | { type: 'search'; query: string }
  | { type: 'tool_use'; name: string; label: string }
  | { type: 'tool_result'; name: string; summary: string }
  | { type: 'done'; reportId: string; productCount: number; trendCount: number }
  | { type: 'error'; message: string }

const STATUS_LABEL: Record<string, string> = {
  list_products:           'Pulling the active catalog…',
  save_report:             'Saving the finished report…',
  web_search:              'Searching the web…',
  generate_product_image:  'Generating image…',
  tavily_image_search:     'Fetching a palm picture…',
}

export async function* runAgent2(args: {
  supabase: SupabaseClient
  trigger: 'manual' | 'cron'
}): AsyncGenerator<Agent2Event> {
  const { supabase, trigger } = args

  const ctx: ToolContext = {
    supabase,
    reportRef: { id: null, productCount: 0, trendCount: 0 },
    searchBudget: { used: 0, max: SEARCH_BUDGET_DEFAULT },
  }

  yield {
    type: 'status',
    label: trigger === 'cron' ? 'Weekly run starting…' : 'Booting up the trend agent…',
  }

  const systemPrompt = buildSystemPrompt(trigger)
  const tools = buildToolDefinitions(trigger)

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: 'Generate this week\'s Content & Trend Intelligence report. Follow the system prompt.',
    },
  ]

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    let final: Anthropic.Message
    try {
      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        tools,
        messages,
      })

      // Surface tool inputs for nice UI: when a tool_use block opens we know
      // its name; when its input arrives as JSON deltas we parse the search
      // query so the dashboard can show "Searching: 'linen ss26'" live.
      let inputJson = ''
      let activeTool = ''

      for await (const event of stream) {
        if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
          activeTool = event.content_block.name
          inputJson = ''
          yield { type: 'tool_use', name: activeTool, label: STATUS_LABEL[activeTool] ?? `Running ${activeTool}…` }
        } else if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta' && activeTool === 'web_search') {
          inputJson += event.delta.partial_json
          const m = inputJson.match(/"query"\s*:\s*"([^"]*)"/)
          if (m) {
            yield { type: 'search', query: m[1] }
            activeTool = ''   // emit the search event only once per call
          }
        }
      }

      final = await stream.finalMessage()
    } catch (err) {
      // If save_report already succeeded, a later API failure (rate limit,
      // depleted credits, network blip) shouldn't be presented as a failed
      // run — the deliverable is already in the database.
      if (ctx.reportRef.id) {
        yield {
          type: 'done',
          reportId: ctx.reportRef.id,
          productCount: ctx.reportRef.productCount,
          trendCount: ctx.reportRef.trendCount,
        }
        return
      }
      throw err
    }

    messages.push({ role: 'assistant', content: final.content })

    if (final.stop_reason !== 'tool_use') {
      // Either save_report was already called (reportRef.id is set) or the
      // agent gave up without producing one.
      if (ctx.reportRef.id) {
        yield {
          type: 'done',
          reportId: ctx.reportRef.id,
          productCount: ctx.reportRef.productCount,
          trendCount: ctx.reportRef.trendCount,
        }
        return
      }
      yield { type: 'error', message: 'Agent finished without saving a report.' }
      return
    }

    // Run every tool call from this turn, then feed results back.
    const calls = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const tu of calls) {
      const out = await runTool(tu.name, tu.input, ctx)
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
