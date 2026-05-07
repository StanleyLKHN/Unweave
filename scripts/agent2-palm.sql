-- =========================================================================
-- Agent 2 — palm picture: schema extension. Idempotent.
-- Adds palm_image_url to trend_reports. Just for fun.
-- =========================================================================

ALTER TABLE trend_reports
  ADD COLUMN IF NOT EXISTS palm_image_url TEXT;
