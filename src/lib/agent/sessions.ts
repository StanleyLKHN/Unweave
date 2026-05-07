// =========================================================================
// Chat session: persists across page reloads via cookie + Supabase row.
//
// The session id is the unit of memory. Without it, the agent forgets the
// customer between page navigations. With it, the conversation survives
// even a closed laptop — until the cookie expires.
// =========================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'

import { HISTORY_LIMIT } from './prompt'

const COOKIE_NAME = 'unweave_chat_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30   // 30 days

export type StoredMessage = {
  role: 'user' | 'assistant'
  content: Anthropic.MessageParam['content']
}

export async function getOrCreateSession(
  supabase: SupabaseClient,
  cookieSessionId: string | null,
  customerEmail: string | null,
): Promise<{ sessionId: string; isNew: boolean }> {
  if (cookieSessionId) {
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, customer_email')
      .eq('id', cookieSessionId)
      .maybeSingle()

    if (data) {
      // Backfill email if the visitor identified themselves mid-conversation.
      if (customerEmail && !data.customer_email) {
        await supabase
          .from('chat_sessions')
          .update({ customer_email: customerEmail, last_active_at: new Date().toISOString() })
          .eq('id', cookieSessionId)
      } else {
        await supabase
          .from('chat_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', cookieSessionId)
      }
      return { sessionId: data.id, isNew: false }
    }
  }

  const { data } = await supabase
    .from('chat_sessions')
    .insert({ customer_email: customerEmail })
    .select('id')
    .single()

  if (!data) throw new Error('Failed to create chat session')
  return { sessionId: data.id, isNew: true }
}

export async function loadHistory(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<Anthropic.MessageParam[]> {
  const { data } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT)

  if (!data) return []
  return data
    .reverse()
    .map(row => ({
      role: row.role as 'user' | 'assistant',
      content: row.content as Anthropic.MessageParam['content'],
    }))
}

export async function appendTurn(
  supabase: SupabaseClient,
  sessionId: string,
  role: 'user' | 'assistant',
  content: Anthropic.MessageParam['content'],
): Promise<void> {
  await supabase
    .from('chat_messages')
    .insert({ session_id: sessionId, role, content })
}

// Cookie helpers — kept here so the route handler stays clean.
export function readSessionCookie(req: Request): string | null {
  const header = req.headers.get('cookie')
  if (!header) return null
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function sessionCookieHeader(sessionId: string): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'SameSite=Lax',
    'HttpOnly',
  ]
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}
