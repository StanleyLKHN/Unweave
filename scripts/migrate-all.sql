-- =========================================================================
-- Combined migration for Agent 1 (Customer Assistant) + Agent 2 (Trends).
-- Paste into Supabase SQL editor and Run. Idempotent.
-- =========================================================================

-- Agent 1: chat memory --------------------------------------------------

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email  TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_email   ON chat_sessions(customer_email) WHERE customer_email IS NOT NULL;

CREATE TABLE IF NOT EXISTS preorder_interest (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email  TEXT NOT NULL,
  product_slug    TEXT NOT NULL,
  note            TEXT,
  session_id      UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preorder_interest_email ON preorder_interest(customer_email);

ALTER TABLE customer_messages
  ADD COLUMN IF NOT EXISTS chat_session_id     UUID REFERENCES chat_sessions(id),
  ADD COLUMN IF NOT EXISTS escalation_reason   TEXT,
  ADD COLUMN IF NOT EXISTS escalation_priority TEXT;

-- Agent 2: trend reports ------------------------------------------------

CREATE TABLE IF NOT EXISTS trend_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  model               TEXT NOT NULL,
  summary             TEXT NOT NULL,
  trend_highlights    JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand_implications  TEXT NOT NULL DEFAULT '',
  next_week_focus     TEXT NOT NULL DEFAULT '',
  citations           JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_response        JSONB
);

CREATE INDEX IF NOT EXISTS idx_trend_reports_generated ON trend_reports(generated_at DESC);

CREATE TABLE IF NOT EXISTS product_content (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             UUID NOT NULL REFERENCES trend_reports(id) ON DELETE CASCADE,
  product_slug          TEXT NOT NULL,
  product_name          TEXT NOT NULL,
  social_caption        TEXT NOT NULL DEFAULT '',
  email_blurb           TEXT NOT NULL DEFAULT '',
  expanded_description  TEXT NOT NULL DEFAULT '',
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_content_report ON product_content(report_id);
CREATE INDEX IF NOT EXISTS idx_product_content_slug   ON product_content(product_slug);
