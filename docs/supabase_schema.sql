-- =============================================================================
-- SUPABASE SCHEMA FOR CHINESE MEDICAL LEARNING ADMIN
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates the three main content tables with the unified publishing JSONB
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) MEDICAL LEXICON TABLE
-- Stores medical vocabulary terms with pinyin, definitions, and categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_lexicon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NULL,

  -- Core fields
  term TEXT NOT NULL,                    -- Chinese term (e.g., "头痛")
  pinyin TEXT NOT NULL,                  -- Pinyin with tones (e.g., "tóu tòng")
  english TEXT NOT NULL,                 -- English translation
  category TEXT NOT NULL,                -- Category (e.g., "symptoms", "body_parts", "treatments")
  difficulty TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced
  
  -- Extended content
  definition TEXT,                       -- Detailed definition/explanation
  example_sentence TEXT,                 -- Example sentence in Chinese
  example_pinyin TEXT,                   -- Pinyin for example sentence
  example_translation TEXT,              -- English translation of example
  audio_url TEXT,                        -- URL to pronunciation audio
  related_terms TEXT[],                  -- Array of related term IDs
  notes TEXT,                            -- Additional notes for learners

  -- Unified publishing JSONB (SEO + GEO + JSON-LD)
  publishing JSONB NOT NULL DEFAULT '{
    "slug": "",
    "status": "draft",
    "seo": {
      "title": "",
      "description": "",
      "canonical": null,
      "ogImage": null
    },
    "geo": {
      "snippet": "",
      "keyPoints": [],
      "faq": [],
      "llmHint": null
    },
    "jsonld": {
      "enabled": false,
      "type": "DefinedTerm"
    }
  }'::jsonb
);

-- Index for fast lookups by category and status
CREATE INDEX IF NOT EXISTS idx_lexicon_category ON public.medical_lexicon(category);
CREATE INDEX IF NOT EXISTS idx_lexicon_status ON public.medical_lexicon((publishing->>'status'));
CREATE INDEX IF NOT EXISTS idx_lexicon_slug ON public.medical_lexicon((publishing->>'slug'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_lexicon_updated_at
  BEFORE UPDATE ON public.medical_lexicon
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2) MEDICAL GRAMMAR TABLE
-- Stores grammar patterns with clinic-specific templates and examples
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_grammar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NULL,

  -- Core fields
  title TEXT NOT NULL,                   -- Grammar point title (e.g., "把 (bǎ) construction")
  pattern TEXT NOT NULL,                 -- Pattern structure (e.g., "S + 把 + O + V + complement")
  explanation TEXT NOT NULL,             -- Detailed explanation in markdown
  difficulty TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced
  
  -- Examples array stored as JSONB
  -- Each example: { "chinese": "...", "pinyin": "...", "english": "..." }
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Clinic-specific templates
  -- Each template: { "scenario": "...", "template": "...", "variables": [...] }
  clinic_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Common errors
  common_errors TEXT[],                  -- Array of common mistakes to avoid
  
  -- Related grammar points
  related_grammar TEXT[],                -- Array of related grammar IDs
  
  -- Tags for filtering
  tags TEXT[],                           -- e.g., ["sentence_structure", "formal", "clinic"]

  -- Unified publishing JSONB
  publishing JSONB NOT NULL DEFAULT '{
    "slug": "",
    "status": "draft",
    "seo": {
      "title": "",
      "description": "",
      "canonical": null,
      "ogImage": null
    },
    "geo": {
      "snippet": "",
      "keyPoints": [],
      "faq": [],
      "llmHint": null
    },
    "jsonld": {
      "enabled": false,
      "type": "HowTo"
    }
  }'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grammar_difficulty ON public.medical_grammar(difficulty);
CREATE INDEX IF NOT EXISTS idx_grammar_status ON public.medical_grammar((publishing->>'status'));
CREATE INDEX IF NOT EXISTS idx_grammar_slug ON public.medical_grammar((publishing->>'slug'));

CREATE TRIGGER update_medical_grammar_updated_at
  BEFORE UPDATE ON public.medical_grammar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3) MEDICAL SCENARIOS TABLE
-- Stores interactive medical conversation scenarios with dialogue flows
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NULL,

  -- Core fields
  title TEXT NOT NULL,                   -- Scenario title (e.g., "Taking Patient History")
  category TEXT NOT NULL,                -- Category (e.g., "consultation", "emergency", "pharmacy")
  difficulty TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced
  description TEXT,                      -- Brief description of the scenario
  
  -- Key phrases for this scenario
  key_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each phrase: { "chinese": "...", "pinyin": "...", "english": "...", "usage": "..." }
  
  -- Doctor questions bank
  doctor_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each question: { "chinese": "...", "pinyin": "...", "english": "...", "context": "..." }
  
  -- Patient response templates
  patient_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each template: { "template": "...", "variables": [...], "example": "..." }
  
  -- Full dialogue flow
  dialogue JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each turn: { "speaker": "doctor"|"patient", "chinese": "...", "pinyin": "...", "english": "...", "notes": "..." }
  
  -- Safety notes (important medical/cultural notes)
  safety_note TEXT,
  
  -- Cultural notes
  cultural_notes TEXT,
  
  -- Related scenarios
  related_scenarios TEXT[],              -- Array of related scenario IDs
  
  -- Tags
  tags TEXT[],                           -- e.g., ["history_taking", "vital_signs", "formal"]

  -- Unified publishing JSONB
  publishing JSONB NOT NULL DEFAULT '{
    "slug": "",
    "status": "draft",
    "seo": {
      "title": "",
      "description": "",
      "canonical": null,
      "ogImage": null
    },
    "geo": {
      "snippet": "",
      "keyPoints": [],
      "faq": [],
      "llmHint": null
    },
    "jsonld": {
      "enabled": false,
      "type": "Course"
    }
  }'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_category ON public.medical_scenarios(category);
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty ON public.medical_scenarios(difficulty);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON public.medical_scenarios((publishing->>'status'));
CREATE INDEX IF NOT EXISTS idx_scenarios_slug ON public.medical_scenarios((publishing->>'slug'));

CREATE TRIGGER update_medical_scenarios_updated_at
  BEFORE UPDATE ON public.medical_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR REFERENCE
-- =============================================================================
COMMENT ON TABLE public.medical_lexicon IS 'Medical vocabulary terms for Chinese language learning';
COMMENT ON TABLE public.medical_grammar IS 'Grammar patterns with clinic-specific templates';
COMMENT ON TABLE public.medical_scenarios IS 'Interactive medical conversation scenarios';

COMMENT ON COLUMN public.medical_lexicon.publishing IS 'Unified publishing config: { slug, status, seo: {title, description, canonical?, ogImage?}, geo: {snippet, keyPoints[], faq?[], llmHint?}, jsonld: {enabled, type} }';
COMMENT ON COLUMN public.medical_grammar.publishing IS 'Unified publishing config: { slug, status, seo: {title, description, canonical?, ogImage?}, geo: {snippet, keyPoints[], faq?[], llmHint?}, jsonld: {enabled, type} }';
COMMENT ON COLUMN public.medical_scenarios.publishing IS 'Unified publishing config: { slug, status, seo: {title, description, canonical?, ogImage?}, geo: {snippet, keyPoints[], faq?[], llmHint?}, jsonld: {enabled, type} }';
