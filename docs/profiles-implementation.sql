-- =============================================================================
-- PROFILES 表实施 SQL
-- =============================================================================
-- 此文件包含实施 profiles 表的完整 SQL 代码
-- 运行顺序：1) supabase_schema.sql, 2) profiles-implementation.sql, 3) 更新 supabase_rls.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) 创建 profiles 表结构
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- updated_at 自动更新函数（如果不存在则创建）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 触发器（先删除再创建，确保幂等）
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.profiles IS '用户配置文件表，包含角色信息';
COMMENT ON COLUMN public.profiles.id IS '用户 ID，引用 auth.users(id)';
COMMENT ON COLUMN public.profiles.role IS '用户角色：admin/editor/viewer';

-- -----------------------------------------------------------------------------
-- 2) 权限检查函数（必须在 RLS 策略之前定义）
-- -----------------------------------------------------------------------------
-- 检查用户是否为 admin 或 editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否为 admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
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
-- 3) 创建用于新用户注册的 RPC 函数
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id UUID DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (user_id, 'viewer')
  ON CONFLICT (id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.create_user_profile(user_id UUID) IS '为新用户创建默认 profile（role=viewer）';

-- -----------------------------------------------------------------------------
-- 4) 启用 RLS 和创建策略（幂等：先删除再创建）
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（确保可重复运行）
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- 策略 1: 用户可以读取自己的 profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 策略 2: 用户可以更新自己的 profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 策略 3: Admins 可以读取所有 profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 策略 4: Admins 可以更新所有 profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 策略 5: Admins 可以插入 profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5) 数据迁移：从 admin_users 迁移到 profiles
-- -----------------------------------------------------------------------------
-- 注意：先为所有 auth.users 创建 profiles，然后迁移角色

-- 为所有现有 auth.users 创建默认 profiles（如果不存在）
INSERT INTO public.profiles (id, role)
SELECT au.id, 'viewer'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 从 admin_users 迁移角色（仅当 admin_users 表存在时执行）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  ) THEN
    UPDATE public.profiles
    SET role = au.role
    FROM admin_users au
    INNER JOIN auth.users auth_u ON auth_u.email = au.email
    WHERE profiles.id = auth_u.id;
    RAISE NOTICE 'admin_users 数据已迁移到 profiles';
  ELSE
    RAISE NOTICE 'admin_users 表不存在，跳过迁移步骤';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6) 授予权限
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- -----------------------------------------------------------------------------
-- 7) 验证查询
-- -----------------------------------------------------------------------------
/*
-- 测试 profiles 表创建
SELECT * FROM public.profiles LIMIT 5;

-- 测试权限函数（登录后运行）
SELECT public.is_admin();
SELECT public.is_admin_or_editor();

-- 测试 RLS：这些应该只返回当前用户或 admin
SELECT id, role FROM public.profiles;
SELECT id, role FROM public.profiles WHERE id = auth.uid();

-- 作为 admin 插入测试用户（先确保自己是 admin）
INSERT INTO public.profiles (id, role) VALUES ('00000000-0000-0000-0000-000000000001', 'viewer');

-- 验证迁移是否成功
SELECT p.id, p.role, au.email
FROM public.profiles p
INNER JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;
*/

-- =============================================================================
-- NOTES
-- =============================================================================
-- 1. 运行此文件前，请确保已运行 supabase_schema.sql
-- 2. 建议在 Supabase SQL Editor 中运行，而不是在生产环境直接运行
-- 3. 迁移完成后，可以考虑废弃 admin_users 表（需要测试现有功能正常）
-- 4. 新用户注册需要在应用代码中调用 create_user_profile 函数