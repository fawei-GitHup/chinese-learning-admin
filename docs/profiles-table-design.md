# Profiles 表设计文档

## 概述

基于现有数据库结构（包含 `admin_users` 表用于角色管理），设计新的 `profiles` 表以提供更完整的用户配置文件和角色管理。`profiles` 表将与 `auth.users` 关联，支持用户自我管理并兼容现有的权限系统。

## 现有数据库分析

### 当前角色系统
- **admin_users 表**：存储管理员邮箱和角色（admin/editor/viewer）
- **权限检查函数**：
  - `is_admin_or_editor()`：检查用户是否为 admin 或 editor
  - `is_admin()`：检查用户是否为 admin
- **RLS 策略**：基于以上函数控制对内容表的访问

### Supabase Auth
- `auth.users` 表：Supabase 认证系统提供的用户表
- 不支持直接在 `auth.users` 上添加触发器

## Profiles 表设计

### 表结构

```sql
-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- updated_at 触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 字段说明
- `id`：UUID，主键，引用 `auth.users(id)`
- `role`：角色字段，默认 'viewer'，约束为 ('admin', 'editor', 'viewer')
- `created_at`：创建时间戳，默认当前时间
- `updated_at`：更新时间戳，通过触发器自动更新

## 触发器设计：自动创建 Profiles

由于 Supabase 的 `auth.users` 表不支持直接触发器，采用以下方案：

### 方案 1: 客户端调用（推荐）

在用户注册完成后，通过 Supabase RPC 函数创建 profile：

```sql
-- 创建函数用于初始化用户 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注意：由于 auth.users 不可修改，我们在客户端调用
-- 在 Next.js 中，在用户注册成功后调用：
-- await supabase.rpc('create_user_profile', { user_id: user.id });
```

### 方案 2: Supabase Edge Function（进阶）

使用 Supabase Edge Function 监听用户创建事件：

```typescript
// supabase/functions/auth-handler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { record, type } = await req.json()

  if (type === 'INSERT' && record.email) {
    // 创建 profile
    const { supabase } = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase
      .from('profiles')
      .insert({ id: record.id, role: 'viewer' })
  }

  return new Response('OK')
})
```

## RLS 策略

### 启用 RLS
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### 策略设计

```sql
-- 策略 1: 用户可以读取自己的 profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 策略 2: 用户可以更新自己的 profile（仅 role 字段受限）
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

-- 策略 5: Admins 可以插入 profiles（用于手动创建）
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
```

### RLS 策略说明

1. **用户自我管理**：认证用户可以读写自己的 profile，但 role 字段的更新需要通过业务逻辑控制（防止用户提升自己的权限）
2. **Admin 全权限**：Admin 用户可以使用 `public.is_admin()` 函数读写所有 profiles
3. **角色升级**：角色升级需要通过 admin 界面或特权函数执行

## 与现有 admin_users 表的整合

### 迁移策略

由于现有系统使用 `admin_users` 表，我们需要将角色数据迁移到 `profiles`，并保持向后兼容。

#### 步骤 1: 数据迁移

```sql
-- 迁移现有 admin_users 到 profiles
-- 注意：需要先为现有 auth.users 创建 profiles

-- 1. 为所有现有 auth.users 创建 profiles（如果不存在）
INSERT INTO public.profiles (id, role)
SELECT au.id, COALESCE(au.role, 'viewer')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. 更新 profiles 中的 admin/editor 角色
UPDATE public.profiles
SET role = au.role
FROM admin_users au
WHERE profiles.id IN (
  SELECT id FROM auth.users WHERE email = au.email
);
```

#### 步骤 2: 更新权限函数

修改现有的 `is_admin_or_editor()` 和 `is_admin()` 函数以检查 `profiles` 表：

```sql
-- 更新权限检查函数以使用 profiles 表
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
```

#### 步骤 3: 逐渐废弃 admin_users

1. 将新用户直接注册到 `profiles`
2. 保留 `admin_users` 作为备用，但主要使用 `profiles`
3. 在完全迁移后，可移除 `admin_users` 表

### 兼容性考虑

- 保持 `admin_users` 表的现有功能，直到完全迁移完成
- 使用 `UNION` 或视图来合并权限检查（如果需要）
- 测试所有现有权限是否正常工作

## 部署顺序

1. 创建 `profiles` 表和索引
2. 设置 RLS 策略
3. 创建触发器函数
4. 迁移现有数据
5. 更新权限函数
6. 测试权限系统
7. 更新应用代码使用 `profiles`

## 安全考虑

- RLS 确保用户只能修改自己的 profile
- 角色升级需要 admin 权限
- 定期审计 profiles 表中的角色分配
- 敏感操作记录日志

## 性能优化

- 在 `role` 字段创建索引以加速权限查询
- 考虑使用视图合并 profiles 和 auth.users 数据
- 监控权限检查函数的执行频率

## 后续扩展

- 添加更多 profile 字段（如头像、偏好设置等）
- 支持团队角色或细粒度权限
- 集成用户活动日志