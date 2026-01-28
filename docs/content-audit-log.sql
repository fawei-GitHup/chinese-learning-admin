-- =============================================================================
-- CONTENT_AUDIT_LOG TABLE SCHEMA FOR CHINESE MEDICAL LEARNING ADMIN
-- =============================================================================
-- This creates an audit log table to track publish/unpublish/edit actions
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CONTENT_AUDIT_LOG TABLE
-- Unified audit log for all content actions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Content identification
  content_type TEXT NOT NULL CHECK (content_type IN ('lexicon', 'grammar', 'scenarios', 'content_item')),
  content_id UUID NOT NULL,

  -- Action performed
  action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish', 'edit', 'create', 'delete', 'status_change')),

  -- Actor (user who performed the action)
  actor UUID NOT NULL, -- references auth.users.id

  -- Optional diff of changes (JSONB)
  diff JSONB NULL,

  -- Optional metadata for status transitions
  previous_status TEXT NULL,
  new_status TEXT NULL,

  -- Optional note for manual annotations
  note TEXT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_log_content ON public.content_audit_log(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.content_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.content_audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.content_audit_log(created_at DESC);

-- Foreign key to auth.users (optional, for referential integrity)
-- ALTER TABLE public.content_audit_log ADD CONSTRAINT fk_audit_log_actor FOREIGN KEY (actor) REFERENCES auth.users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON public.content_audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.content_audit_log;
DROP POLICY IF EXISTS "Only admins can delete audit logs" ON public.content_audit_log;

-- Policy A: Authenticated users can read audit logs (admins & editors & viewers)
CREATE POLICY "Authenticated users can read audit logs"
  ON public.content_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy B: Authenticated users can insert audit logs (triggered by actions)
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.content_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy C: Only admins can delete audit logs (prevent accidental deletion)
CREATE POLICY "Only admins can delete audit logs"
  ON public.content_audit_log
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE public.content_audit_log IS 'Audit log for content actions (publish, unpublish, edit)';
COMMENT ON COLUMN public.content_audit_log.content_type IS 'Type of content: lexicon, grammar, scenarios, content_item';
COMMENT ON COLUMN public.content_audit_log.content_id IS 'UUID of the content item in its respective table';
COMMENT ON COLUMN public.content_audit_log.action IS 'Action performed: publish, unpublish, edit, create, delete, status_change';
COMMENT ON COLUMN public.content_audit_log.actor IS 'User ID (from auth.users) who performed the action';
COMMENT ON COLUMN public.content_audit_log.diff IS 'JSON diff of changes (optional)';
COMMENT ON COLUMN public.content_audit_log.previous_status IS 'Previous status before action (if applicable)';
COMMENT ON COLUMN public.content_audit_log.new_status IS 'New status after action (if applicable)';
COMMENT ON COLUMN public.content_audit_log.note IS 'Optional note for manual annotations';

-- =============================================================================
-- HELPER FUNCTION: Log an audit entry
-- =============================================================================
CREATE OR REPLACE FUNCTION public.log_content_audit(
  p_content_type TEXT,
  p_content_id UUID,
  p_action TEXT,
  p_actor UUID,
  p_diff JSONB DEFAULT NULL,
  p_previous_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.content_audit_log (
    content_type,
    content_id,
    action,
    actor,
    diff,
    previous_status,
    new_status,
    note
  ) VALUES (
    p_content_type,
    p_content_id,
    p_action,
    p_actor,
    p_diff,
    p_previous_status,
    p_new_status,
    p_note
  ) RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_content_audit IS 'Helper function to insert an audit log entry with consistent parameters';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.content_audit_log TO anon, authenticated;
GRANT INSERT ON public.content_audit_log TO authenticated;
GRANT DELETE ON public.content_audit_log TO authenticated; -- only admins via RLS
GRANT EXECUTE ON FUNCTION public.log_content_audit TO authenticated;

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================
/*
To apply this migration:

1. Copy the entire script above.
2. Open Supabase Dashboard > SQL Editor.
3. Paste and run the script.
4. Verify the table was created with:
   SELECT * FROM public.content_audit_log LIMIT 0;

If you need to backfill audit logs for existing content, you can run a separate script
that iterates over published content and creates log entries with estimated dates.
*/