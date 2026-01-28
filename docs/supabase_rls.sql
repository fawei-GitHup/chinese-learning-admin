-- =============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor AFTER running:
--   1. supabase_schema.sql
--   2. profiles-implementation.sql (创建 profiles 表和权限函数)
--
-- This enables RLS and creates policies for:
--   A) Public read access for published content (anon key)
--   B) Protected writes for admin/editor users (uses profiles table)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS: 权限检查（基于 profiles 表）
-- 注意：这些函数也在 profiles-implementation.sql 中定义
--       使用 CREATE OR REPLACE 确保幂等性
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
  -- 检查 profiles 表中当前用户是否为 admin 或 editor
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 检查 profiles 表中当前用户是否为 admin
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_admin_or_editor() IS '检查用户是否为 admin 或 editor（基于 profiles 表）';
COMMENT ON FUNCTION public.is_admin() IS '检查用户是否为 admin（基于 profiles 表）';

-- -----------------------------------------------------------------------------
-- ENABLE RLS ON ALL CONTENT TABLES
-- -----------------------------------------------------------------------------
ALTER TABLE public.medical_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_scenarios ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- MEDICAL_LEXICON POLICIES (幂等：先删除再创建)
-- =============================================================================

-- 删除已存在的策略
DROP POLICY IF EXISTS "Public can read published lexicon" ON public.medical_lexicon;
DROP POLICY IF EXISTS "Admins can read all lexicon" ON public.medical_lexicon;
DROP POLICY IF EXISTS "Admins can insert lexicon" ON public.medical_lexicon;
DROP POLICY IF EXISTS "Admins can update lexicon" ON public.medical_lexicon;
DROP POLICY IF EXISTS "Only admins can delete lexicon" ON public.medical_lexicon;

-- Policy A: Public read for published items (anon + authenticated)
CREATE POLICY "Public can read published lexicon"
  ON public.medical_lexicon
  FOR SELECT
  USING ((publishing->>'status') = 'published');

-- Policy B: Admins/Editors can read all items (including drafts)
CREATE POLICY "Admins can read all lexicon"
  ON public.medical_lexicon
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor());

-- Policy C: Admins/Editors can insert new items
CREATE POLICY "Admins can insert lexicon"
  ON public.medical_lexicon
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor());

-- Policy D: Admins/Editors can update items
CREATE POLICY "Admins can update lexicon"
  ON public.medical_lexicon
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

-- Policy E: Only Admins can delete items
CREATE POLICY "Only admins can delete lexicon"
  ON public.medical_lexicon
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- MEDICAL_GRAMMAR POLICIES (幂等：先删除再创建)
-- =============================================================================

-- 删除已存在的策略
DROP POLICY IF EXISTS "Public can read published grammar" ON public.medical_grammar;
DROP POLICY IF EXISTS "Admins can read all grammar" ON public.medical_grammar;
DROP POLICY IF EXISTS "Admins can insert grammar" ON public.medical_grammar;
DROP POLICY IF EXISTS "Admins can update grammar" ON public.medical_grammar;
DROP POLICY IF EXISTS "Only admins can delete grammar" ON public.medical_grammar;

-- Policy A: Public read for published items
CREATE POLICY "Public can read published grammar"
  ON public.medical_grammar
  FOR SELECT
  USING ((publishing->>'status') = 'published');

-- Policy B: Admins/Editors can read all items
CREATE POLICY "Admins can read all grammar"
  ON public.medical_grammar
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor());

-- Policy C: Admins/Editors can insert
CREATE POLICY "Admins can insert grammar"
  ON public.medical_grammar
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor());

-- Policy D: Admins/Editors can update
CREATE POLICY "Admins can update grammar"
  ON public.medical_grammar
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

-- Policy E: Only Admins can delete
CREATE POLICY "Only admins can delete grammar"
  ON public.medical_grammar
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- MEDICAL_SCENARIOS POLICIES (幂等：先删除再创建)
-- =============================================================================

-- 删除已存在的策略
DROP POLICY IF EXISTS "Public can read published scenarios" ON public.medical_scenarios;
DROP POLICY IF EXISTS "Admins can read all scenarios" ON public.medical_scenarios;
DROP POLICY IF EXISTS "Admins can insert scenarios" ON public.medical_scenarios;
DROP POLICY IF EXISTS "Admins can update scenarios" ON public.medical_scenarios;
DROP POLICY IF EXISTS "Only admins can delete scenarios" ON public.medical_scenarios;

-- Policy A: Public read for published items
CREATE POLICY "Public can read published scenarios"
  ON public.medical_scenarios
  FOR SELECT
  USING ((publishing->>'status') = 'published');

-- Policy B: Admins/Editors can read all items
CREATE POLICY "Admins can read all scenarios"
  ON public.medical_scenarios
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor());

-- Policy C: Admins/Editors can insert
CREATE POLICY "Admins can insert scenarios"
  ON public.medical_scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor());

-- Policy D: Admins/Editors can update
CREATE POLICY "Admins can update scenarios"
  ON public.medical_scenarios
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

-- Policy E: Only Admins can delete
CREATE POLICY "Only admins can delete scenarios"
  ON public.medical_scenarios
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- VERIFICATION QUERIES (run these to test your setup)
-- =============================================================================
/*
-- 1. Test public read (should only see published items)
-- Run this as anon user or in browser with anon key:
SELECT id, term, (publishing->>'status') as status
FROM medical_lexicon
LIMIT 10;

-- 2. Test that writes are blocked for anon:
-- This should fail with RLS violation:
INSERT INTO medical_lexicon (term, pinyin, english, category)
VALUES ('test', 'test', 'test', 'test');

-- 3. 设置用户为 admin（在 SQL editor 中以 service role 运行）:
-- 先找到用户的 UUID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
-- 然后更新 profiles 表中的角色
UPDATE public.profiles SET role = 'admin' WHERE id = 'user-uuid-here';

-- 4. Check your admin status (when authenticated):
SELECT public.is_admin_or_editor();
SELECT public.is_admin();

-- 5. 查看所有用户角色
SELECT p.id, p.role, au.email
FROM public.profiles p
INNER JOIN auth.users au ON au.id = p.id
ORDER BY p.role, p.created_at;
*/

-- =============================================================================
-- GRANT STATEMENTS (ensure proper access)
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.medical_lexicon TO anon, authenticated;
GRANT SELECT ON public.medical_grammar TO anon, authenticated;
GRANT SELECT ON public.medical_scenarios TO anon, authenticated;
GRANT ALL ON public.medical_lexicon TO authenticated;
GRANT ALL ON public.medical_grammar TO authenticated;
GRANT ALL ON public.medical_scenarios TO authenticated;
