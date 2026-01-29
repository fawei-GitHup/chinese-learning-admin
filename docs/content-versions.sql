-- =============================================================================
-- CONTENT_VERSIONS TABLE SCHEMA FOR CHINESE MEDICAL LEARNING ADMIN
-- =============================================================================
-- This creates a version history table to track content changes and enable rollback
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONTENT_VERSIONS TABLE
-- Stores historical versions of content items for versioning and rollback
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Reference to the content item
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,

  -- Version tracking
  version_number INT NOT NULL,

  -- Snapshot of content at this version
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB NOT NULL,
  seo_json JSONB,
  geo_json JSONB,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),

  -- Actor who created this version
  created_by UUID REFERENCES public.profiles(id),

  -- Optional description of what changed
  change_summary TEXT,

  -- Ensure unique version numbers per content item
  UNIQUE(content_id, version_number)
);

-- -----------------------------------------------------------------------------
-- INDEXES for efficient queries
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON public.content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_created_at ON public.content_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_version ON public.content_versions(content_id, version_number DESC);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Anyone can view versions" ON public.content_versions;
DROP POLICY IF EXISTS "Authenticated users can insert versions" ON public.content_versions;
DROP POLICY IF EXISTS "Only admins can delete versions" ON public.content_versions;

-- Policy A: Anyone can view versions (including anonymous for public content)
CREATE POLICY "Anyone can view versions"
  ON public.content_versions
  FOR SELECT
  USING (true);

-- Policy B: Authenticated users can insert versions
CREATE POLICY "Authenticated users can insert versions"
  ON public.content_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy C: Only admins can delete versions (prevent accidental deletion)
CREATE POLICY "Only admins can delete versions"
  ON public.content_versions
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.content_versions IS 'Version history for content items, enabling review and rollback';
COMMENT ON COLUMN public.content_versions.content_id IS 'Foreign key to content_items table';
COMMENT ON COLUMN public.content_versions.version_number IS 'Sequential version number (1, 2, 3, ...)';
COMMENT ON COLUMN public.content_versions.title IS 'Title at this version (from content_json)';
COMMENT ON COLUMN public.content_versions.slug IS 'URL slug at this version';
COMMENT ON COLUMN public.content_versions.content IS 'Full content_json snapshot at this version';
COMMENT ON COLUMN public.content_versions.seo_json IS 'SEO metadata snapshot at this version';
COMMENT ON COLUMN public.content_versions.geo_json IS 'GEO metadata snapshot at this version';
COMMENT ON COLUMN public.content_versions.status IS 'Content status at this version';
COMMENT ON COLUMN public.content_versions.created_by IS 'User who created this version (from profiles)';
COMMENT ON COLUMN public.content_versions.change_summary IS 'Optional description of changes in this version';

-- =============================================================================
-- HELPER FUNCTION: Get next version number for a content item
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_next_version_number(p_content_id UUID)
RETURNS INT AS $$
DECLARE
  v_next INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next
  FROM public.content_versions
  WHERE content_id = p_content_id;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_next_version_number IS 'Returns the next version number for a content item';

-- =============================================================================
-- HELPER FUNCTION: Create a version snapshot
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_content_version(
  p_content_id UUID,
  p_change_summary TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_content_item RECORD;
  v_version_number INT;
  v_title TEXT;
BEGIN
  -- Get the current content item
  SELECT * INTO v_content_item
  FROM public.content_items
  WHERE id = p_content_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content item not found: %', p_content_id;
  END IF;

  -- Get next version number
  v_version_number := public.get_next_version_number(p_content_id);

  -- Extract title from content_json based on type
  v_title := COALESCE(
    v_content_item.content_json->>'title',
    v_content_item.content_json->>'term',
    v_content_item.slug
  );

  -- Insert version snapshot
  INSERT INTO public.content_versions (
    content_id,
    version_number,
    title,
    slug,
    content,
    seo_json,
    geo_json,
    status,
    created_by,
    change_summary
  ) VALUES (
    p_content_id,
    v_version_number,
    v_title,
    v_content_item.slug,
    v_content_item.content_json,
    v_content_item.seo_json,
    v_content_item.geo_json,
    v_content_item.status,
    p_created_by,
    p_change_summary
  ) RETURNING id INTO v_version_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_content_version IS 'Creates a version snapshot of a content item';

-- =============================================================================
-- HELPER FUNCTION: Rollback to a specific version
-- =============================================================================
CREATE OR REPLACE FUNCTION public.rollback_to_version(
  p_content_id UUID,
  p_version_id UUID,
  p_actor UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_version RECORD;
BEGIN
  -- Get the version to rollback to
  SELECT * INTO v_version
  FROM public.content_versions
  WHERE id = p_version_id AND content_id = p_content_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found: % for content: %', p_version_id, p_content_id;
  END IF;

  -- First, create a version of current state before rollback
  PERFORM public.create_content_version(
    p_content_id,
    format('Pre-rollback snapshot (before rollback to v%s)', v_version.version_number),
    p_actor
  );

  -- Update the content item with version data
  UPDATE public.content_items
  SET
    slug = v_version.slug,
    content_json = v_version.content,
    seo_json = v_version.seo_json,
    geo_json = v_version.geo_json,
    status = v_version.status,
    updated_at = now()
  WHERE id = p_content_id;

  -- Create a new version after rollback
  PERFORM public.create_content_version(
    p_content_id,
    format('Rolled back to version %s', v_version.version_number),
    p_actor
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.rollback_to_version IS 'Rolls back a content item to a specific version';

-- =============================================================================
-- TRIGGER: Auto-create version on content update (optional)
-- =============================================================================
-- Uncomment if you want automatic versioning on every update
/*
CREATE OR REPLACE FUNCTION public.trigger_create_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF OLD.content_json IS DISTINCT FROM NEW.content_json
     OR OLD.seo_json IS DISTINCT FROM NEW.seo_json
     OR OLD.geo_json IS DISTINCT FROM NEW.geo_json
     OR OLD.slug IS DISTINCT FROM NEW.slug
     OR OLD.status IS DISTINCT FROM NEW.status
  THEN
    PERFORM public.create_content_version(
      NEW.id,
      'Auto-versioned on update'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER content_items_version_trigger
  AFTER UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_version();
*/

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.content_versions TO anon, authenticated;
GRANT INSERT ON public.content_versions TO authenticated;
GRANT DELETE ON public.content_versions TO authenticated; -- only admins via RLS
GRANT EXECUTE ON FUNCTION public.get_next_version_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_content_version TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_to_version TO authenticated;

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================
/*
To apply this migration:

1. Copy the entire script above.
2. Open Supabase Dashboard > SQL Editor.
3. Paste and run the script.
4. Verify the table was created with:
   SELECT * FROM public.content_versions LIMIT 0;

To create initial versions for existing content:
  INSERT INTO public.content_versions (content_id, version_number, title, slug, content, seo_json, geo_json, status, change_summary)
  SELECT 
    id,
    1,
    COALESCE(content_json->>'title', content_json->>'term', slug),
    slug,
    content_json,
    seo_json,
    geo_json,
    status,
    'Initial version (migrated)'
  FROM public.content_items;
*/
