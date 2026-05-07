-- =========================================================================
-- Agent 2 — image generation: schema extension
-- Adds image_url + image_prompt to product_content. Idempotent.
-- =========================================================================

ALTER TABLE product_content
  ADD COLUMN IF NOT EXISTS image_url    TEXT,
  ADD COLUMN IF NOT EXISTS image_prompt TEXT;
