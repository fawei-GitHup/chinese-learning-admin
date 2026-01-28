-- =============================================================================
-- 创建管理后台用户 SQL 脚本
-- =============================================================================
-- 使用方法：
-- 1. 登录 Supabase Dashboard: https://supabase.com/dashboard
-- 2. 进入你的项目 -> SQL Editor
-- 3. 修改下面的邮箱、密码和角色
-- 4. 运行此脚本
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 方法 1: 使用 Supabase Auth Admin API 创建用户（推荐）
-- 注意：此方法需要使用 service_role key，在 SQL Editor 中自动可用
-- -----------------------------------------------------------------------------

-- 创建编辑者用户示例
-- 将 'editor@outlook.com' 替换为实际邮箱
-- 将 'SecurePassword123!' 替换为实际密码（至少6位）
DO $$
DECLARE
  new_user_id UUID;
  user_email TEXT := 'editor@outlook.com';  -- 修改为实际邮箱
  user_password TEXT := 'SecurePassword123!';  -- 修改为实际密码（至少6位）
  user_role TEXT := 'editor';  -- 可选: 'admin', 'editor', 'viewer'
BEGIN
  -- 检查用户是否已存在
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF new_user_id IS NOT NULL THEN
    RAISE NOTICE '用户 % 已存在，ID: %', user_email, new_user_id;
    
    -- 更新 profiles 表中的角色
    UPDATE public.profiles 
    SET role = user_role, updated_at = NOW()
    WHERE id = new_user_id;
    
    RAISE NOTICE '已更新用户角色为: %', user_role;
  ELSE
    -- 创建新用户
    new_user_id := extensions.uuid_generate_v4();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),  -- 邮箱已确认，无需验证
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      FALSE,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );
    
    -- 创建 identities 记录
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', user_email),
      'email',
      new_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
    
    -- 在 profiles 表中创建角色
    INSERT INTO public.profiles (id, role)
    VALUES (new_user_id, user_role)
    ON CONFLICT (id) DO UPDATE SET role = user_role, updated_at = NOW();
    
    RAISE NOTICE '成功创建用户: %, ID: %, 角色: %', user_email, new_user_id, user_role;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 方法 2: 快速创建用户（简化版，直接插入）
-- -----------------------------------------------------------------------------
/*
-- 取消注释以下代码使用

-- 步骤 1: 创建 auth.users 记录
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES (
  extensions.uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000000',
  'viewer@example.com',  -- 修改邮箱
  crypt('Password123!', gen_salt('bf')),  -- 修改密码
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  'authenticated',
  'authenticated'
);

-- 步骤 2: 获取新用户 ID 并创建 profiles 记录
-- 运行上面的 INSERT 后，查询新用户 ID：
-- SELECT id FROM auth.users WHERE email = 'viewer@example.com';
-- 然后：
-- INSERT INTO public.profiles (id, role) VALUES ('查询到的ID', 'viewer');
*/


-- -----------------------------------------------------------------------------
-- 方法 3: 仅更新现有用户角色
-- 如果用户已通过其他方式注册（如 Google OAuth），只需更新角色
-- -----------------------------------------------------------------------------
/*
-- 取消注释以下代码使用

UPDATE public.profiles
SET role = 'editor', updated_at = NOW()  -- 修改角色
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'  -- 修改邮箱
);

-- 验证更新
SELECT p.id, p.role, au.email
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email = 'user@example.com';
*/


-- -----------------------------------------------------------------------------
-- 查看所有用户及其角色
-- -----------------------------------------------------------------------------
SELECT 
  au.id,
  au.email,
  p.role,
  au.email_confirmed_at IS NOT NULL AS email_confirmed,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;
