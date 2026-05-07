-- =========================================================================
-- Customer Assistant agent: conversation memory schema
-- Run this in the Supabase SQL editor once.
-- Idempotent — safe to re-run.
-- =========================================================================

-- One row per chat conversation. A returning customer (same cookie) reuses
-- their session; a new visitor gets a fresh one.
CREATE TABLE IF NOT EXISTS chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email  TEXT,
  status          TEXT NOT NULL DEFAULT 'active',  -- active | escalated | closed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full transcript: user messages, assistant text, tool calls and tool results.
-- `content` is the raw Anthropic block array so we can replay it back to Claude
-- on the next turn without lossy reformatting.
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,          -- 'user' | 'assistant'
  content     JSONB NOT NULL,         -- Anthropic content blocks
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_email   ON chat_sessions(customer_email) WHERE customer_email IS NOT NULL;

-- Pre-order interest: captured by the agent when a customer expresses intent
-- without committing (e.g. "let me know when the trench ships"). Lightweight
-- alternative to forcing checkout.
CREATE TABLE IF NOT EXISTS preorder_interest (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email  TEXT NOT NULL,
  product_slug    TEXT NOT NULL,
  note            TEXT,
  session_id      UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preorder_interest_email ON preorder_interest(customer_email);

-- Link escalations back to the chat session that produced them.
ALTER TABLE customer_messages
  ADD COLUMN IF NOT EXISTS chat_session_id   UUID REFERENCES chat_sessions(id),
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
  ADD COLUMN IF NOT EXISTS escalation_priority TEXT;


-- Link