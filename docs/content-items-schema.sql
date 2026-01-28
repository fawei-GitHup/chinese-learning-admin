-- =============================================================================
-- CONTENT_ITEMS TABLE SCHEMA FOR CHINESE MEDICAL LEARNING ADMIN
-- =============================================================================
-- This creates a unified content_items table to hold all content types
-- (lexicon, grammar, scenarios) with type discrimination
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONTENT_ITEMS TABLE
-- Unified table for all content types with JSONB content storage
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NULL,

  -- Content type discriminator
  type TEXT NOT NULL CHECK (type IN ('lexicon', 'grammar', 'scenarios')),

  -- Core metadata
  slug TEXT NOT NULL,                    -- URL-friendly identifier (unique per type)
  locale TEXT NOT NULL DEFAULT 'zh-CN',  -- Language locale (e.g., 'zh-CN', 'en-US')
  status TEXT NOT NULL DEFAULT 'draft'   -- draft | published | archived
    CHECK (status IN ('draft', 'published', 'archived')),

  -- Content data stored as JSONB
  -- Structure depends on type:
  -- lexicon: { term, pinyin, english, category, difficulty, definition, example_sentence, ... }
  -- grammar: { title, pattern, explanation, difficulty, examples[], clinic_templates[], ... }
  -- scenarios: { title, category, difficulty, description, key_phrases[], doctor_questions[], ... }
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- SEO metadata
  seo_json JSONB NOT NULL DEFAULT '{
    "title": "",
    "description": "",
    "canonical": null,
    "ogImage": null
  }'::jsonb,

  -- Geo/Structured data
  geo_json JSONB NOT NULL DEFAULT '{
    "snippet": "",
    "keyPoints": [],
    "faq": [],
    "llmHint": null
  }'::jsonb
);

-- Unique constraint on type + slug to prevent conflicts
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_type_slug
  ON public.content_items(type, slug);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_locale ON public.content_items(locale);
CREATE INDEX IF NOT EXISTS idx_content_items_type_status ON public.content_items(type, status);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON public.content_items(slug);

-- Updated_at trigger
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.content_items IS 'Unified content table for lexicon, grammar, and scenarios';
COMMENT ON COLUMN public.content_items.type IS 'Content type: lexicon | grammar | scenarios';
COMMENT ON COLUMN public.content_items.content_json IS 'Type-specific content data in JSONB format';
COMMENT ON COLUMN public.content_items.seo_json IS 'SEO metadata: { title, description, canonical?, ogImage? }';
COMMENT ON COLUMN public.content_items.geo_json IS 'Geographic/structured data: { snippet, keyPoints[], faq[], llmHint? }';

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Public can read published content" ON public.content_items;
DROP POLICY IF EXISTS "Admins can read all content" ON public.content_items;
DROP POLICY IF EXISTS "Admins can insert content" ON public.content_items;
DROP POLICY IF EXISTS "Admins can update content" ON public.content_items;
DROP POLICY IF EXISTS "Only admins can delete content" ON public.content_items;

-- Policy A: Public read for published items (anon + authenticated)
CREATE POLICY "Public can read published content"
  ON public.content_items
  FOR SELECT
  USING (status = 'published');

-- Policy B: Admins/Editors can read all items (including drafts)
CREATE POLICY "Admins can read all content"
  ON public.content_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor());

-- Policy C: Admins/Editors can insert new items
CREATE POLICY "Admins can insert content"
  ON public.content_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor());

-- Policy D: Admins/Editors can update items
CREATE POLICY "Admins can update content"
  ON public.content_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

-- Policy E: Only Admins can delete items
CREATE POLICY "Only admins can delete content"
  ON public.content_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Grant statements
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.content_items TO anon, authenticated;
GRANT ALL ON public.content_items TO authenticated;

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================
/*
To migrate from existing tables (medical_lexicon, medical_grammar, medical_scenarios):

1. Run data migration script:
   INSERT INTO content_items (type, slug, locale, status, content_json, seo_json, geo_json, created_at, updated_at, published_at)
   SELECT
     'lexicon',
     (publishing->>'slug'),
     'zh-CN',
     (publishing->>'status'),
     jsonb_build_object(
       'term', term,
       'pinyin', pinyin,
       'english', english,
       'category', category,
       'difficulty', difficulty,
       'definition', definition,
       'example_sentence', example_sentence,
       'example_pinyin', example_pinyin,
       'example_translation', example_translation,
       'audio_url', audio_url,
       'related_terms', related_terms,
       'notes', notes
     ),
     (publishing->'seo'),
     (publishing->'geo'),
     created_at,
     updated_at,
     published_at
   FROM medical_lexicon;

   -- Similar for grammar and scenarios...

2. After migration, drop old tables:
   DROP TABLE medical_lexicon CASCADE;
   DROP TABLE medical_grammar CASCADE;
   DROP TABLE medical_scenarios CASCADE;
*/