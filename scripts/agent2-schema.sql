-- =========================================================================
-- Agent 2 — Content & Trend Intelligence: schema
-- Run this in the Supabase SQL editor once. Idempotent.
-- =========================================================================

-- One row per generated weekly report.
CREATE TABLE IF NOT EXISTS trend_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  model               TEXT NOT NULL,
  -- Top-of-report executive summary (2–3 sentences).
  summary             TEXT NOT NULL,
  -- Array of {title, description, source_urls, evidence}.
  trend_highlights    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- What it means for Unweave specifically.
  brand_implications  TEXT NOT NULL DEFAULT '',
  -- One paragraph: what to push next week.
  next_week_focus     TEXT NOT NULL DEFAULT '',
  -- Citations (deduped urls) for transparency.
  citations           JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Optional: full assistant content blocks for debugging / replay.
  raw_response        JSONB
);

CREATE INDEX IF NOT EXISTS idx_trend_reports_generated ON trend_reports(generated_at DESC);

-- One row per (report × product). Each carries three pieces of marketing copy.
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
