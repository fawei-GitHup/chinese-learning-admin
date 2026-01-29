-- =============================================================================
-- PROFILES 表更新 SQL - 用户管理增强
-- =============================================================================
-- 此文件包含更新 profiles 表以支持用户管理功能的 SQL 代码
-- 运行前提：需要已运行 profiles-implementation.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) 添加新字段
-- -----------------------------------------------------------------------------

-- 添加用户激活状态字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 添加最后登录时间字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 添加用户名称字段 (从 auth.users.user_metadata 同步)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 添加头像 URL 字段 (从 auth.users.user_metadata 同步或自定义)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- -----------------------------------------------------------------------------
-- 2) 创建索引
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);

-- -----------------------------------------------------------------------------
-- 3) 添加注释
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN public.profiles.is_active IS '用户是否激活，false 表示禁用';
COMMENT ON COLUMN public.profiles.last_login_at IS '用户最后登录时间';
COMMENT ON COLUMN public.profiles.name IS '用户显示名称';
COMMENT ON COLUMN public.profiles.avatar_url IS '用户头像 URL';

-- -----------------------------------------------------------------------------
-- 4) 更新 RLS 策略
-- -----------------------------------------------------------------------------

-- 删除已存在的策略（确保可重复运行）
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- 策略：只有管理员可以修改其他用户的信息
-- 但是用户可以修改自己的非角色字段
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- 用户可以更新自己的记录，或者 admin 可以更新任何记录
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    -- 如果是自己的记录，可以更新（非管理员不能改角色，需要在应用层控制）
    -- 如果是 admin，可以更新任何记录
    auth.uid() = id OR public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 5) 创建获取所有用户的函数（带 email，仅 admin）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_all_profiles_with_email()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 仅 admin 可以获取所有用户信息
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email::TEXT,
    p.name,
    p.avatar_url,
    p.role,
    COALESCE(p.is_active, true) AS is_active,
    p.last_login_at,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_all_profiles_with_email() IS 
  '获取所有用户的完整信息，包含 email（仅 admin 可用）';

-- -----------------------------------------------------------------------------
-- 6) 创建更新用户角色的函数（带安全检查）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
  target_current_role TEXT;
BEGIN
  -- 检查调用者是否为 admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- 验证新角色有效性
  IF new_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: must be admin, editor, or viewer';
  END IF;

  -- 获取目标用户当前角色
  SELECT role INTO target_current_role
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 如果目标用户是 admin 且要降级，检查是否至少保留一个 admin
  IF target_current_role = 'admin' AND new_role != 'admin' THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE role = 'admin' AND is_active = true;

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote: at least one active admin is required';
    END IF;
  END IF;

  -- 执行更新
  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.admin_update_user_role(UUID, TEXT) IS 
  '管理员更新用户角色，带安全检查（至少保留一个 admin）';

-- -----------------------------------------------------------------------------
-- 7) 创建更新用户状态的函数（带安全检查）
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  target_user_id UUID,
  new_status BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
  target_current_role TEXT;
BEGIN
  -- 检查调用者是否为 admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- 获取目标用户当前角色
  SELECT role INTO target_current_role
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 如果要禁用 admin 用户，检查是否至少保留一个激活的 admin
  IF target_current_role = 'admin' AND new_status = false THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.profiles
    WHERE role = 'admin' AND is_active = true;

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot disable: at least one active admin is required';
    END IF;
  END IF;

  -- 执行更新
  UPDATE public.profiles
  SET is_active = new_status, updated_at = NOW()
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.admin_update_user_status(UUID, BOOLEAN) IS 
  '管理员更新用户激活状态，带安全检查（至少保留一个激活的 admin）';

-- -----------------------------------------------------------------------------
-- 8) 创建搜索用户的函数
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_profiles(
  search_query TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 仅 admin 可以搜索用户
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    au.email::TEXT,
    p.name,
    p.avatar_url,
    p.role,
    COALESCE(p.is_active, true) AS is_active,
    p.last_login_at,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  WHERE 
    (p.name ILIKE '%' || search_query || '%')
    OR (au.email ILIKE '%' || search_query || '%')
  ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.search_profiles(TEXT) IS 
  '按姓名或邮箱搜索用户（仅 admin 可用）';

-- -----------------------------------------------------------------------------
-- 9) 创建更新最后登录时间的函数
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 注意：此触发器需要在 auth.users 上创建，可能需要超级用户权限
-- 如果没有权限，可以在应用层在登录成功后调用更新

-- -----------------------------------------------------------------------------
-- 10) 获取用户统计
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  admin_count BIGINT,
  editor_count BIGINT,
  viewer_count BIGINT,
  active_count BIGINT,
  inactive_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 仅 admin 可以获取统计
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_users,
    COUNT(*) FILTER (WHERE role = 'admin')::BIGINT AS admin_count,
    COUNT(*) FILTER (WHERE role = 'editor')::BIGINT AS editor_count,
    COUNT(*) FILTER (WHERE role = 'viewer')::BIGINT AS viewer_count,
    COUNT(*) FILTER (WHERE COALESCE(is_active, true) = true)::BIGINT AS active_count,
    COUNT(*) FILTER (WHERE COALESCE(is_active, true) = false)::BIGINT AS inactive_count
  FROM public.profiles;
END;
$$;

COMMENT ON FUNCTION public.get_user_stats() IS 
  '获取用户统计信息（仅 admin 可用）';

-- -----------------------------------------------------------------------------
-- 11) 授予权限
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_all_profiles_with_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_status(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;

-- -----------------------------------------------------------------------------
-- 12) 验证查询
-- -----------------------------------------------------------------------------
/*
-- 测试新增字段
SELECT id, role, is_active, last_login_at, name, avatar_url FROM public.profiles LIMIT 5;

-- 测试获取所有用户（需要 admin 身份登录）
SELECT * FROM public.get_all_profiles_with_email();

-- 测试用户统计
SELECT * FROM public.get_user_stats();

-- 测试搜索用户
SELECT * FROM public.search_profiles('admin');

-- 测试更新角色
SELECT public.admin_update_user_role('target-user-id', 'editor');

-- 测试更新状态
SELECT public.admin_update_user_status('target-user-id', false);
*/

-- =============================================================================
-- NOTES
-- =============================================================================
-- 1. 运行此文件前，请确保已运行 profiles-implementation.sql
-- 2. 所有管理函数都需要 admin 角色才能执行
-- 3. 系统会保证至少有一个激活的 admin 用户
-- 4. 用户不能修改自己的角色（需要在应用层额外检查）
