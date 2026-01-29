-- ============================================
-- Allowed Emails (Login Whitelist) Table
-- Admin Console UI - A7-02
-- ============================================

-- 创建允许的邮箱白名单表
CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_domain_pattern BOOLEAN DEFAULT false, -- 是否为域名模式 (如 *@company.com)
  default_role TEXT DEFAULT 'viewer' CHECK (default_role IN ('admin', 'editor', 'viewer')),
  notes TEXT,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_allowed_emails_email ON allowed_emails(email);
CREATE INDEX idx_allowed_emails_domain_pattern ON allowed_emails(is_domain_pattern) WHERE is_domain_pattern = true;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view allowed_emails
CREATE POLICY "Authenticated users can view allowed_emails" ON allowed_emails
  FOR SELECT 
  TO authenticated
  USING (true);

-- Only admins can insert allowed_emails
CREATE POLICY "Admins can insert allowed_emails" ON allowed_emails
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can update allowed_emails
CREATE POLICY "Admins can update allowed_emails" ON allowed_emails
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete allowed_emails
CREATE POLICY "Admins can delete allowed_emails" ON allowed_emails
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_allowed_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_allowed_emails_updated_at
  BEFORE UPDATE ON allowed_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_allowed_emails_updated_at();

-- ============================================
-- Function: Check if email is allowed
-- Returns whether the email is in the whitelist and its default role
-- ============================================
CREATE OR REPLACE FUNCTION check_email_allowed(check_email TEXT)
RETURNS TABLE(allowed BOOLEAN, default_role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      -- Exact match
      WHEN EXISTS (SELECT 1 FROM allowed_emails WHERE email = check_email) THEN true
      -- Domain pattern match (e.g., *@company.com)
      WHEN EXISTS (
        SELECT 1 FROM allowed_emails
        WHERE is_domain_pattern = true
        AND check_email LIKE REPLACE(email, '*', '%')
      ) THEN true
      ELSE false
    END AS allowed,
    COALESCE(
      -- First try exact match
      (SELECT ae.default_role FROM allowed_emails ae WHERE ae.email = check_email),
      -- Then try domain pattern (prefer longer/more specific patterns)
      (
        SELECT ae.default_role FROM allowed_emails ae
        WHERE ae.is_domain_pattern = true
        AND check_email LIKE REPLACE(ae.email, '*', '%')
        ORDER BY length(ae.email) DESC
        LIMIT 1
      ),
      -- Default to viewer
      'viewer'
    ) AS default_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: Batch check emails
-- ============================================
CREATE OR REPLACE FUNCTION batch_check_emails_allowed(emails TEXT[])
RETURNS TABLE(email TEXT, allowed BOOLEAN, default_role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.email,
    (check_email_allowed(e.email)).allowed,
    (check_email_allowed(e.email)).default_role
  FROM unnest(emails) AS e(email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Sample Data (Optional: Remove in production)
-- ============================================
-- INSERT INTO allowed_emails (email, is_domain_pattern, default_role, notes) VALUES
--   ('admin@example.com', false, 'admin', 'System administrator'),
--   ('*@company.com', true, 'editor', 'Company domain employees');

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT ON allowed_emails TO authenticated;
GRANT INSERT, UPDATE, DELETE ON allowed_emails TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_allowed(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_check_emails_allowed(TEXT[]) TO authenticated;
