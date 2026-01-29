# Supabase OAuth Setup for Admin Login

## Manual Setup Required

Follow these steps in your Supabase Dashboard to enable OAuth authentication for the admin console.

### 1. Access Supabase Dashboard
- Log in to [supabase.com](https://supabase.com)
- Select your project

### 2. Enable OAuth Providers
1. Navigate to **Authentication > Providers**
2. For **Google OAuth**:
   - Click "Enable" next to Google
   - Add your Google OAuth Client ID and Secret (obtained from [Google Cloud Console](https://console.cloud.google.com/))
   - Set **Scopes** to: `openid email profile`
   - Set **Redirect URLs** to:
     - `http://localhost:3000/admin/login` (for development)
     - Add production domain URL if applicable: `https://yourdomain.com/admin/login`

3. For other providers (GitHub, etc.):
   - Repeat the process with the respective Client ID/Secret and Scopes

### 3. Configure Authentication Settings
1. Go to **Authentication > Settings**
2. In **Auth Providers** section:
   - Ensure the enabled providers are active
   - Verify **Authorized redirect URLs** include your admin login path

### 4. Configure Multi-Role Admin Whitelist

系统支持三种角色的权限配置，按角色优先级从高到低排列：

#### 角色权限说明

| 角色 | 环境变量 | 权限 |
|------|----------|------|
| **Admin** | `NEXT_PUBLIC_ADMIN_EMAILS` | 全权限：发布、审核、删除、系统设置 |
| **Editor** | `NEXT_PUBLIC_EDITOR_EMAILS` | 编辑权限：创建、编辑、提交审核 |
| **Viewer** | `NEXT_PUBLIC_VIEWER_EMAILS` | 只读权限：仅查看内容 |

#### Setting Up Multi-Role Whitelist

1. **In `.env.local`** (for local development):
   ```bash
   # 管理员（全权限）
   NEXT_PUBLIC_ADMIN_EMAILS=admin@yourdomain.com
   
   # 编辑者（编辑权限）
   NEXT_PUBLIC_EDITOR_EMAILS=editor1@yourdomain.com,editor2@yourdomain.com
   
   # 查看者（只读权限）
   NEXT_PUBLIC_VIEWER_EMAILS=viewer@yourdomain.com
   ```

2. **In production environment** (e.g., Vercel, Netlify):
   - Add environment variables in your hosting platform's dashboard
   - Use comma-separated email addresses (no spaces)
   - Configure each role separately

#### Whitelist Behavior

| Scenario | Behavior |
|----------|----------|
| No whitelist configured | ⚠️ **All users allowed as admin** (development mode warning in console) |
| User in `ADMIN_EMAILS` | ✅ Full admin access |
| User in `EDITOR_EMAILS` | ✅ Editor access (can edit, cannot publish/delete) |
| User in `VIEWER_EMAILS` | ✅ Read-only access |
| User not in any whitelist | ❌ Automatically signed out with error message |

#### Backward Compatibility

旧版本配置 `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` 仍然支持，该列表中的用户将被视为 admin 角色。

```bash
# Legacy config (still works, users will be treated as admin)
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=alice@company.com,bob@company.com
```

#### Complete Example Configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Multi-role configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin@company.com
NEXT_PUBLIC_EDITOR_EMAILS=editor1@company.com,editor2@company.com
NEXT_PUBLIC_VIEWER_EMAILS=intern@company.com,auditor@company.com
```

---

## Deployment Guide

### Option 1: Deploy to Cloud Platform (Recommended)

推荐使用 Vercel/Netlify 等平台部署，支持自定义域名绑定。

#### Vercel Deployment

1. **Connect Repository**
   - Log in to [Vercel](https://vercel.com)
   - Import your GitHub/GitLab repository
   - Select the admin console project

2. **Configure Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all required variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     NEXT_PUBLIC_ADMIN_EMAILS=admin@yourdomain.com
     NEXT_PUBLIC_EDITOR_EMAILS=editor@yourdomain.com
     ```

3. **Configure Custom Domain** (Optional but recommended)
   - Go to Project Settings > Domains
   - Add your custom domain: `admin.yourdomain.com`
   - Update DNS records as instructed

4. **Update Supabase OAuth Redirect URLs**
   - Add your production URL to Supabase Auth settings:
     - `https://admin.yourdomain.com/admin/login`
     - Or `https://your-app.vercel.app/admin/login`

#### Netlify Deployment

1. **Import Project**
   - Log in to [Netlify](https://netlify.com)
   - Create new site from Git

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add all required variables (same as Vercel)

4. **Custom Domain**
   - Configure in Domain Management section

### Option 2: Local Development Only

适合个人项目或开发阶段，不需要公网部署。

#### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials and admin emails

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Admin Console**
   - Open `http://localhost:3000/admin/login`

#### Remote Access (Optional)

如需外部访问本地开发环境：

- **ngrok**: `ngrok http 3000`
- **Cloudflare Tunnel**: `cloudflared tunnel`
- **VS Code Port Forwarding**: Built-in feature

⚠️ **Note**: When using tunnels, update Supabase OAuth redirect URLs to include the tunnel URL.

### Security Recommendations

| Environment | Recommendation |
|-------------|----------------|
| Development | Use `.env.local`, whitelist can be empty for testing |
| Staging | Use platform env vars, limit whitelist to testers |
| Production | Use platform env vars, strict whitelist, custom domain with HTTPS |

### Checklist for Production Deployment

- [ ] Environment variables configured on hosting platform
- [ ] Admin email whitelist properly configured
- [ ] Supabase OAuth redirect URLs updated
- [ ] Custom domain configured (recommended)
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] Test login flow with whitelisted and non-whitelisted users

### 5. Test OAuth Flow
- Start your Next.js app: `npm run dev`
- Visit `http://localhost:3000/admin/login`
- Click "Sign in with Google"
- Complete OAuth flow and verify redirect to `/admin/dashboard`

### Expected Results
- OAuth providers show as "Enabled" in Supabase Dashboard
- No authentication errors in browser console
- Successful login redirects user to admin dashboard
- Session persists across page refreshes
- **Non-whitelisted users are rejected with clear error message**

### Troubleshooting

#### OAuth Issues
- Ensure Client IDs/Secrets are correct and match the configured provider
- Check browser console for any CORS or redirect errors
- Verify Supabase project URL matches your `.env.local` variables

#### Whitelist Issues
- Ensure email addresses are lowercase in the environment variable
- Check that there are no extra spaces around emails
- Verify the environment variable is properly loaded (check browser console for warning)
- Remember that `NEXT_PUBLIC_` prefix is required for client-side access

### URL Routing

| URL | Description |
|-----|-------------|
| `/login` | Redirects to `/admin/login` |
| `/admin/login` | OAuth login page with Google sign-in |
| `/admin/dashboard` | Main dashboard (requires authentication) |

---

## Profiles 表实施 - A0-02

### 概述
此部分详细记录在 Supabase 控制台中实施 Profiles 表的步骤。该实施包括创建 profiles 表、迁移现有用户数据、更新权限函数等。

### 先决条件
- 有 Supabase 项目管理员权限
- 已备份数据库（可选，但推荐）

### 🚀 完整 SQL 执行顺序

请按以下顺序在 **Supabase Dashboard > SQL Editor** 中执行：

| 步骤 | 文件 | 说明 | 是否必须 |
|------|------|------|----------|
| 1 | `docs/supabase_schema.sql` | 创建内容表（lexicon/grammar/scenarios） | ✅ 必须 |
| 2 | `docs/profiles-implementation.sql` | 创建 profiles 表 + 权限函数 + RLS | ✅ 必须 |
| 3 | `docs/supabase_rls.sql` | 内容表的 RLS 策略 | ✅ 必须 |

#### 每步详细说明

**步骤 1: supabase_schema.sql**
- 创建 `medical_lexicon`, `medical_grammar`, `medical_scenarios` 表
- 创建基础的 `update_updated_at_column()` 函数
- 预期结果：Success，无错误

**步骤 2: profiles-implementation.sql**
- 创建 `profiles` 表
- 创建 `is_admin()`, `is_admin_or_editor()` 权限函数（使用 profiles 表）
- 创建 profiles 表的 RLS 策略
- 预期结果：Success，可能看到 `admin_users 表不存在，跳过迁移步骤` 通知（正常）

**步骤 3: supabase_rls.sql**
- 为内容表启用 RLS
- 创建公开读取和管理员写入策略
- ⚠️ **重要**：此文件会创建 `admin_users` 表，但权限检查函数已被 profiles-implementation.sql 覆盖为使用 profiles 表
- 预期结果：Success

### 旧版部署顺序（已废弃）
~~1. **基础架构**: 执行 `docs/supabase_schema.sql`~~
~~2. **Profiles 表实施**: 执行 `docs/profiles-implementation.sql`~~
~~3. **RLS 更新**: 执行 `docs/supabase_rls.sql`~~

### 执行步骤

#### 1. 访问 Supabase Dashboard
- 登录 [supabase.com](https://supabase.com)
- 选择你的项目（点击项目卡片）

#### 2. 导航到 SQL Editor
1. 在左侧菜单中点击 **"SQL Editor"**
2. 点击 **"New Query"** 按钮（或选择现有的查询标签页）

#### 3. 粘贴 SQL 内容
1. 打开 `docs/profiles-implementation.sql` 文件
2. 复制完整的 SQL 内容（从 `-- =============================================================================` 开始到结束）
3. 在 SQL Editor 中粘贴所有内容

#### 4. 执行 SQL
1. 点击 **"Run"** 按钮（或按 Ctrl+Enter）
2. 等待执行完成，观察 **"Results"** 面板

### 预期结果
- **Successful**: 结果面板显示 "Success. No rows returned" 或类似成功消息
- **无错误**: 控制台无红色错误消息
- **时间**: 执行通常在 10-30 秒内完成

### 迁移数据步骤
SQL 脚本自动执行以下迁移：
1. 为所有现有 `auth.users` 创建默认 profiles（role = 'viewer'）
2. 从 `admin_users` 表迁移角色信息到 `profiles`
3. 更新权限函数以使用 `profiles` 表

### 验证步骤

#### 在 SQL Editor 中验证
运行以下查询验证实施是否成功：

1. **检查 profiles 表创建**:
   ```sql
   SELECT * FROM public.profiles LIMIT 5;
   ```
   - 预期: 返回最多 5 条记录，每条包含 id, role, created_at, updated_at

2. **验证迁移**:
   ```sql
   SELECT p.id, p.role, au.email
   FROM public.profiles p
   INNER JOIN auth.users au ON au.id = p.id
   ORDER BY p.created_at DESC
   LIMIT 10;
   ```
   - 预期: 显示用户列表，角色信息已迁移

3. **测试权限函数** (需要登录状态):
   ```sql
   SELECT public.is_admin();
   SELECT public.is_admin_or_editor();
   ```
   - 预期: 根据当前用户角色返回 true/false

#### 在应用中验证
1. 访问 `http://localhost:3000/admin/login` （或生产环境 URL）
2. 使用 whitelisted 用户登录
3. 检查控制台是否显示角色相关权限警告
4. 验证角色权限是否正确应用（admin/edit/view）

### 故障排除

#### 常见问题
- **权限错误**: 确保以管理员身份运行，或检查 supabase_schema.sql 是否已执行
- **表已存在**: 脚本使用 `IF NOT EXISTS` 避免重复创建
- **函数不存在**: 所有必需的函数（`update_updated_at_column`, `is_admin`, `is_admin_or_editor`）已在 SQL 文件中定义，无需先运行其他脚本
- **admin_users 表不存在**: 这是正常的。SQL 脚本会自动检测 admin_users 表是否存在。如果不存在，会跳过迁移步骤并显示 `admin_users 表不存在，跳过迁移步骤` 的通知

#### 如果遇到错误
1. 检查 **"Messages"** 面板的错误详情
2. 回滚相关更改（如果安全）
3. 联系开发团队或参考 Supabase 文档

### 用户角色管理

SQL 脚本执行完成后，需要手动设置用户角色。以下是在 **Supabase Dashboard > SQL Editor** 中操作的方法。

#### 角色权限对照表

| 角色 | 读取内容 | 创建/编辑 | 发布/删除 | 管理用户 |
|------|----------|----------|----------|----------|
| **admin** | ✅ | ✅ | ✅ | ✅ |
| **editor** | ✅ | ✅ | ❌ | ❌ |
| **viewer** | ✅ | ❌ | ❌ | ❌ |

#### 设置 Admin 用户

```sql
-- 将指定邮箱的用户设置为 admin
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

#### 设置 Editor 用户

```sql
-- 将指定邮箱的用户设置为 editor
INSERT INTO public.profiles (id, role)
SELECT id, 'editor' FROM auth.users WHERE email = 'editor@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'editor';
```

#### 批量设置多个 Editor

```sql
-- 一次设置多个 editor
INSERT INTO public.profiles (id, role)
SELECT id, 'editor' FROM auth.users
WHERE email IN (
  'editor1@example.com',
  'editor2@example.com',
  'editor3@example.com'
)
ON CONFLICT (id) DO UPDATE SET role = 'editor';
```

#### 查看所有用户角色

```sql
SELECT p.role, au.email, p.created_at
FROM public.profiles p
INNER JOIN auth.users au ON au.id = p.id
ORDER BY p.role, p.created_at;
```

#### 将用户降级为 Viewer

```sql
-- 将用户恢复为默认的 viewer 角色
UPDATE public.profiles
SET role = 'viewer'
WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### 注意事项

- 用户必须先登录过一次，才会在 `auth.users` 表中有记录
- 新用户首次登录后自动获得 `viewer` 角色
- 使用 `ON CONFLICT ... DO UPDATE` 确保 SQL 可重复执行

### 完成后
- 在应用代码中调用 `create_user_profile()` 函数以支持新用户注册
- 考虑清理 `admin_users` 表（在完全验证后）
- 更新 `.env` 文件以反映新的角色系统（如果需要）

---

## Admin 路由保护实施 - A0-03

### 概述
此实施添加了服务端中间件来保护 `/admin/*` 路由，检查用户登录状态和角色权限。

### 登录方式说明

系统支持两种登录方式：
1. **Google OAuth 登录** - 使用 Google 账号登录
2. **邮箱密码登录** - 使用邮箱和密码登录（适用于 Outlook/其他邮箱）

**注意**：出于安全考虑，系统不提供公开注册功能。所有用户必须由管理员通过 SQL 在 Supabase 后台创建。

### 必要手动操作

#### 方法 1: 通过 Supabase Dashboard 创建用户（推荐新手）

1. 进入 **Authentication > Users**
2. 点击 **Add user**
3. 填写 email 和 password
4. 勾选 **Auto confirm user**（自动确认，无需邮箱验证）
5. 用户创建后，需执行 SQL 设置角色（见下方）

#### 方法 2: 通过 SQL 脚本创建用户（推荐）

使用 `docs/create-user.sql` 脚本在 Supabase SQL Editor 中创建用户。

**步骤：**
1. 打开 Supabase Dashboard → SQL Editor
2. 复制以下代码并修改参数：

```sql
-- 创建用户并设置角色
DO $$
DECLARE
  new_user_id UUID;
  user_email TEXT := 'your-email@outlook.com';  -- ← 修改为实际邮箱
  user_password TEXT := 'YourSecurePassword123!';  -- ← 修改为密码（至少6位）
  user_role TEXT := 'editor';  -- ← 可选: 'admin', 'editor', 'viewer'
BEGIN
  -- 检查用户是否已存在
  SELECT id INTO new_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF new_user_id IS NOT NULL THEN
    RAISE NOTICE '用户 % 已存在，ID: %', user_email, new_user_id;
    
    -- 更新角色
    UPDATE public.profiles 
    SET role = user_role, updated_at = NOW()
    WHERE id = new_user_id;
    
    RAISE NOTICE '已更新用户角色为: %', user_role;
  ELSE
    -- 创建新用户
    new_user_id := extensions.uuid_generate_v4();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}', FALSE, 'authenticated', 'authenticated'
    );
    
    -- 创建 identities 记录
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      new_user_id, new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', user_email),
      'email', new_user_id::text, NOW(), NOW(), NOW()
    );
    
    -- 创建角色
    INSERT INTO public.profiles (id, role)
    VALUES (new_user_id, user_role)
    ON CONFLICT (id) DO UPDATE SET role = user_role, updated_at = NOW();
    
    RAISE NOTICE '成功创建用户: %, ID: %, 角色: %', user_email, new_user_id, user_role;
  END IF;
END $$;
```

3. 运行 SQL，查看 "Messages" 面板确认创建成功
4. 现在可以使用该邮箱和密码登录 Admin Console

#### 示例：创建不同角色的测试用户

```sql
-- 查看所有用户及其角色
SELECT au.email, p.role, au.email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;
```

示例用户配置：
- `admin@example.com` → role: admin（全部权限）
- `editor@outlook.com` → role: editor（编辑权限）
- `viewer@example.com` → role: viewer（只读权限）

#### 2. 设置用户角色
在 Supabase Dashboard > SQL Editor 中执行以下查询设置角色：

```sql
-- 查看所有用户及其角色
SELECT p.role, au.email, p.created_at
FROM public.profiles p
INNER JOIN auth.users au ON au.id = p.id
ORDER BY p.role, p.created_at;

-- 将测试用户设置为 admin（用于验收）
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'test-admin@example.com');

-- 将测试用户设置为 editor
UPDATE public.profiles
SET role = 'editor'
WHERE id = (SELECT id FROM auth.users WHERE email = 'test-editor@example.com');

-- 将测试用户设置为 viewer（用于测试 403）
UPDATE public.profiles
SET role = 'viewer'
WHERE id = (SELECT id FROM auth.users WHERE email = 'test-viewer@example.com');
```

预期结果：
- admin 用户：可以访问 `/admin/*` 页面
- editor 用户：可以访问 `/admin/*` 页面
- viewer 用户：访问 `/admin/*` 跳转到 `/admin/403`

### 实施细节
- 使用 Next.js middleware 拦截 `/admin/*` 请求
- 服务端检查 Supabase session
- 查询 `profiles` 表获取用户角色
- 无权限用户重定向到 `/admin/403` 页面

### 验收步骤
1. 启动应用：`npm run dev`
2. 未登录用户访问 `http://localhost:3000/admin/dashboard` → 应重定向到 `/admin/login`
3. 使用 viewer 角色用户登录访问 admin 页面 → 应重定向到 `/admin/403`
4. 使用 admin/editor 角色用户访问 admin 页面 → 应正常显示页面

---

## Content Items 表实施 - A1-01

### 概述
此部分详细记录在 Supabase 控制台中实施 Content Items 表的步骤。该实施创建一个统一的 `content_items` 表，用于存储所有内容类型（lexicon、grammar、scenarios），包含必要的索引、触发器和行级安全策略。

### 先决条件
- 有 Supabase 项目管理员权限
- 已执行 `docs/supabase_schema.sql` 和 `docs/profiles-implementation.sql`（包含必需的权限函数）
- 已备份数据库（推荐）

### 执行步骤

#### 1. 访问 Supabase Dashboard
- 登录 [supabase.com](https://supabase.com)
- 选择你的项目（点击项目卡片）

#### 2. 导航到 SQL Editor
1. 在左侧菜单中点击 **"SQL Editor"**
2. 点击 **"New Query"** 按钮（或选择现有的查询标签页）

#### 3. 粘贴 SQL 内容
1. 打开 `docs/content-items-schema.sql` 文件
2. 复制完整的 SQL 内容（从 `-- =============================================================================` 开始到结束）
3. 在 SQL Editor 中粘贴所有内容

#### 4. 执行 SQL
1. 点击 **"Run"** 按钮（或按 Ctrl+Enter）
2. 等待执行完成，观察 **"Results"** 面板

### 预期结果
- **Successful**: 结果面板显示 "Success. No rows returned" 或类似成功消息
- **无错误**: 控制台无红色错误消息
- **时间**: 执行通常在 5-15 秒内完成

#### 创建的数据库对象
- `content_items` 表：统一的內容存储表
- 索引：type + slug 唯一约束，type、status、locale 等索引
- 触发器：自动更新 `updated_at` 时间戳
- RLS 策略：
  - 公共用户可读取已发布内容
  - 管理员/编辑者可读取所有内容
  - 管理员/编辑者可插入/更新内容
  - 仅管理员可删除内容

### 验收查询

#### 1. 验证表结构
```sql
-- 检查表是否创建成功
\d public.content_items
```
- 预期: 显示表结构，包含 id, created_at, updated_at, published_at, type, slug, locale, status, content_json, seo_json, geo_json 列

#### 2. 验证索引
```sql
-- 检查索引是否创建
SELECT indexname FROM pg_indexes WHERE tablename = 'content_items';
```
- 预期: 返回多个索引名称，包括 idx_content_items_type_slug, idx_content_items_type 等

#### 3. 验证 RLS 策略
```sql
-- 检查 RLS 是否启用
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'content_items';
```
- 预期: rowsecurity = t (true)

#### 4. 验证权限函数依赖
```sql
-- 检查权限函数是否存在（必需）
SELECT routine_name FROM information_schema.routines
WHERE routine_name IN ('is_admin', 'is_admin_or_editor');
```
- 预期: 返回 is_admin 和 is_admin_or_editor

#### 5. 测试 RLS 策略
```sql
-- 测试公开读取策略（应返回空结果，因为没有已发布内容）
SELECT COUNT(*) FROM public.content_items WHERE status = 'published';
```

### 实施细节
- 表使用 JSONB 存储类型特定的内容数据
- 包含 SEO 和地理/结构化数据字段
- 状态字段控制内容发布流程
- 唯一约束防止同类型下的 slug 冲突
- 依赖 `update_updated_at_column()` 函数（应已在之前的实施中创建）

### 故障排除

#### 常见问题
- **权限函数不存在**: 确保已执行 `docs/profiles-implementation.sql`
- **表已存在**: 脚本使用 `IF NOT EXISTS` 避免重复创建
- **索引冲突**: 如果已存在旧表，考虑先迁移数据

#### 如果遇到错误
1. 检查 **"Messages"** 面板的错误详情
2. 确保 profiles 表和权限函数已正确创建
3. 确认 SQL 语法正确（复制粘贴时检查换行）

### 数据迁移（可选）
如果需要从旧表（medical_lexicon 等）迁移数据，参考 SQL 文件中的迁移注释。迁移脚本将现有数据转换为新的统一格式。

### 完成后
- 在应用中更新查询逻辑以使用 `content_items` 表
- 测试 CRUD 操作的权限控制
- 考虑清理旧表（在完全验证后）

---

## Content Types 实施 - A1-02

### Manual Steps

- Entry path: Supabase Dashboard > Project > SQL Editor.
- Click sequence: Execute the following SQL.
- SQL to paste:
  ```sql
  -- 1. First, create the enum type if it doesn't exist
  DO $$
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type_enum') THEN
          CREATE TYPE content_type_enum AS ENUM ('grammar', 'lessons', 'lexicon', 'medical-dialogs', 'readings', 'scenarios');
      END IF;
  END $$;

  -- 2. Validate that all existing data matches the enum values
  DO $$
  DECLARE
      invalid_count INTEGER;
  BEGIN
      SELECT COUNT(*) INTO invalid_count
      FROM content_items
      WHERE type::text NOT IN ('grammar', 'lessons', 'lexicon', 'medical-dialogs', 'readings', 'scenarios');
      
      IF invalid_count > 0 THEN
          RAISE EXCEPTION 'Found % rows with invalid content types. Please clean data before converting to enum.', invalid_count;
      END IF;
  END $$;

  -- 3. Convert TEXT column to ENUM using explicit casting
  --    The USING clause must cast from TEXT to ENUM via explicit conversion
  ALTER TABLE content_items ALTER COLUMN type TYPE content_type_enum USING (
      CASE type
          WHEN 'grammar' THEN 'grammar'::content_type_enum
          WHEN 'lessons' THEN 'lessons'::content_type_enum
          WHEN 'lexicon' THEN 'lexicon'::content_type_enum
          WHEN 'medical-dialogs' THEN 'medical-dialogs'::content_type_enum
          WHEN 'readings' THEN 'readings'::content_type_enum
          WHEN 'scenarios' THEN 'scenarios'::content_type_enum
          ELSE NULL
      END
  );
  ```
- Expected result: Schema updated, invalid types rejected at DB level. Screenshot point: SQL Editor showing success message.

---

## 审计日志表实施 - A1-03

### Manual Steps

- Entry path: Supabase Dashboard > Project > SQL Editor.
- Click sequence: Execute the following SQL.
- SQL to paste: 复制 `docs/content-audit-log.sql` 文件中的完整 SQL 内容。
- Expected result: 表 `content_audit_log` 创建成功，包含所有索引、RLS 策略和辅助函数 `log_content_audit`。Screenshot point: SQL Editor 显示成功消息。

### 验证步骤

1. **检查表结构**：
   ```sql
   \d public.content_audit_log
   ```
   - 预期：显示表结构，包含 id, created_at, content_type, content_id, action, actor, diff, previous_status, new_status, note 列。

2. **验证 RLS 策略**：
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'content_audit_log';
   ```
   - 预期：rowsecurity = t (true)。

3. **测试审计日志函数**：
   ```sql
   SELECT public.log_content_audit('lexicon', '00000000-0000-0000-0000-000000000000', 'publish', '00000000-0000-0000-0000-000000000000', null, 'draft', 'published', '测试');
   ```
   - 预期：返回一个 UUID 表示日志条目已插入。

4. **查看日志条目**：
   ```sql
   SELECT * FROM public.content_audit_log ORDER BY created_at DESC LIMIT 5;
   ```

### 集成验收

- 在 Admin Console 中执行发布/取消发布/编辑操作后，检查 `content_audit_log` 表中是否有对应记录。
- 确保每个发布动作至少写入一条日志（验收标准）。

---

## 手动 Supabase 操作 - Medical Lexicon 类型扩展

### 概述
为支持医疗词汇工作台功能，需要在 Supabase 中更新 `content_items` 表的 `type` 列约束，添加 `'medical_lexicon'` 类型。

### 先决条件
- 有 Supabase 项目管理员权限
- 已执行 Content Items 表的初始化 SQL（见上方 Content Items 表实施章节）

### 执行步骤

#### 1. 访问 Supabase Dashboard
- 登录 [supabase.com](https://supabase.com)
- 选择你的项目（点击项目卡片）

#### 2. 导航到 SQL Editor
1. 在左侧菜单中点击 **"SQL Editor"**
2. 点击 **"New Query"** 按钮

#### 3. 执行 SQL - 添加 medical_lexicon 类型

根据你的表结构实现方式，选择对应的 SQL：

##### 方案 A：如果使用 ENUM 类型（content_type_enum）

```sql
-- 为 content_type_enum 添加新的枚举值 'medical_lexicon'
ALTER TYPE content_type_enum ADD VALUE IF NOT EXISTS 'medical_lexicon';

-- 验证添加成功
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'content_type_enum'::regtype;
```

##### 方案 B：如果使用 CHECK 约束

```sql
-- 1. 查看当前约束名称
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'content_items'::regclass AND contype = 'c';

-- 2. 删除旧约束（替换 <constraint_name> 为上一步查到的约束名）
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS <constraint_name>;

-- 3. 添加新约束（包含 medical_lexicon）
ALTER TABLE content_items ADD CONSTRAINT content_items_type_check
CHECK (type IN ('grammar', 'lessons', 'lexicon', 'medical-dialogs', 'readings', 'scenarios', 'medical_lexicon'));
```

##### 方案 C：如果表定义使用 TEXT 类型且无约束

无需修改，TEXT 类型可存储任意字符串值。可直接插入 `type = 'medical_lexicon'` 记录。

#### 4. 验证

执行以下 SQL 验证更新成功：

```sql
-- 测试插入（如使用 ENUM 或 CHECK 约束）
INSERT INTO content_items (type, slug, locale, status, content_json)
VALUES ('medical_lexicon', 'test-medical-lexicon', 'zh-CN', 'draft', '{"test": true}')
RETURNING id, type, slug;

-- 如测试成功，删除测试数据
DELETE FROM content_items WHERE slug = 'test-medical-lexicon' AND type = 'medical_lexicon';
```

### 预期结果
- 约束更新成功后，`content_items` 表可正常插入 `type = 'medical_lexicon'` 的记录
- Admin Console 医疗词汇工作台可正常创建、编辑、发布内容

### 故障排除

| 问题 | 解决方案 |
|------|----------|
| `invalid input value for enum content_type_enum` | 使用方案 A 的 SQL 添加枚举值 |
| `new row violates check constraint` | 使用方案 B 的 SQL 更新 CHECK 约束 |
| `constraint "xxx" does not exist` | 检查约束名称是否正确，使用步骤 1 的 SQL 查询 |

### 侧边栏入口

医疗词汇工作台已添加到 Admin Console 侧边栏：
- **菜单位置**：内容管理 > 医疗词汇
- **入口路径**：`/content/medical-lexicon`
- **图标**：HeartPulse（心跳图标）

### 关联文件

| 文件 | 说明 |
|------|------|
| `app/(admin)/content/medical-lexicon/page.tsx` | 医疗词汇工作台页面组件 |
| `components/admin/sidebar.tsx` | 侧边栏（已添加入口） |
| `lib/content-types.ts` | 内容类型定义 |
| `lib/supabase/content-items-service.ts` | 内容服务层 |

---

## 医疗场景工作台实施 - A2-02

### 概述
此实施添加了医疗场景工作台，允许管理员管理医疗对话场景和实践练习，支持创建、编辑、发布医疗场景内容。

### 已完成的技术实现

#### 1. 类型系统扩展
- 更新 `lib/content-types.ts` 添加 `'medical_scenario'` 到 `CONTENT_TYPES` 数组
- 更新 `ContentItemType` 联合类型包含 `medical_scenario`
- 更新 `contentItemTypeSchema` Zod 验证器

#### 2. 服务层实现
- 在 `lib/supabase/content-items-service.ts` 添加 `MedicalScenarioContent` 和 `MedicalScenarioUIEntry` 类型定义
- 实现 `contentItemToUI` 和 `uiToContentItem` 重载函数支持医疗场景数据转换
- 添加 `fetchMedicalScenarios`, `upsertMedicalScenario`, `deleteMedicalScenarioById` CRUD 函数
- 集成现有发布和 SEO/GEO 字段支持

#### 3. 用户界面实现
- 创建 `app/(admin)/content/medical-scenario/page.tsx` 页面组件
- 实现列表视图：显示标题、分类、难度、状态、发布就绪状态
- 实现对话编辑器：支持 Patient/Doctor/Nurse/Receptionist/Pharmacist 等医疗角色
- 集成关键短语、检查清单、警告等辅助字段
- 集成发布面板：SEO、GEO、结构化数据预览
- 支持本地 mock 降级和 Supabase 集成

#### 4. 导航集成
- 更新 `components/admin/sidebar.tsx` 添加医疗场景工作台菜单项
- 使用 Theater 图标，中文标题 "医疗场景"，英文标题 "Medical Scenarios"
- 路由路径：`/content/medical-scenario`

### 数据库兼容性
- 使用现有 `content_items` 表，无需数据库模式更改
- 复用现有的 RLS 策略和权限控制
- 发布内容自动可被 Web 端读取

### 验收标准
- ✅ 医疗场景工作台页面可正常加载
- ✅ 支持创建、编辑医疗场景内容
- ✅ 对话编辑器支持医疗角色和动态对话行管理
- ✅ SEO/GEO 字段正确验证和存储
- ✅ 发布后可被 Web 端医疗场景 API 读取
- ✅ 权限控制正确应用（admin/editor 创建，viewer 只读）

### 故障排除

#### 类型错误
- 确保 `ChipInput` 组件使用 `value` 属性而非 `values`
- 验证 TypeScript 重载函数正确处理联合类型

#### 数据库操作
- 确认 Supabase 连接配置正确
- 检查 `content_items` 表权限策略
- 验证 CRUD 操作的错误处理

#### UI 集成
- 确保发布面板正确传递 faq 数据
- 验证表单验证和状态管理
- 检查对话行的添加/删除功能

### 完成后
- 医疗场景内容可通过 `/content/medical-scenario` 路径访问
- Web 端可通过 API 获取发布的状态场景
- SEO 和结构化数据会自动生成用于搜索引擎优化

---

## 医疗场景工作台数据库修复 - A2-02

### 概述
医疗场景工作台需要将新的内容类型 `'medical-scenario'` 添加到 `content_items` 表的 `type` 列枚举约束中。此修复确保数据库级别的数据一致性，防止插入无效的内容类型。

### 先决条件
- 有 Supabase 项目管理员权限
- 已执行 Content Items 表初始化 SQL（`docs/content-items-schema.sql`）
- 已执行枚举类型迁移脚本（`docs/migration-fix.sql`）
- 已备份数据库（推荐）

### 执行步骤

#### 1. 访问 Supabase Dashboard
- 登录 [supabase.com](https://supabase.com)
- 选择你的项目（点击项目卡片）

#### 2. 导航到 SQL Editor
1. 在左侧菜单中点击 **"SQL Editor"**
2. 点击 **"New Query"** 按钮（或选择现有的查询标签页）

#### 3. 执行 SQL - 添加 medical_scenario 类型

##### 检查当前枚举定义
```sql
-- 检查当前 content_type_enum 的枚举值
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'content_type_enum'::regtype ORDER BY enumlabel;
```

##### 添加新的枚举值
```sql
-- 为 content_type_enum 添加新的枚举值 'medical_scenario'
-- 注意：代码中使用下划线格式 'medical_scenario'，不是连字符
ALTER TYPE content_type_enum ADD VALUE IF NOT EXISTS 'medical_scenario';
```

##### 验证添加成功
```sql
-- 再次检查枚举值，确认 'medical_scenario' 已添加
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'content_type_enum'::regtype ORDER BY enumlabel;
```
- 预期结果：返回列表中包含 `'medical_scenario'`

##### 测试插入数据
```sql
-- 测试插入 medical_scenario 类型的内容（验证枚举扩展成功）
INSERT INTO public.content_items (
  type,
  slug,
  locale,
  status,
  content_json
) VALUES (
  'medical_scenario',
  'test-medical-scenario-entry',
  'zh-CN',
  'draft',
  '{"title": "测试医疗场景", "dialogue": []}'::jsonb
) RETURNING id, type, slug;

-- 清理测试数据
DELETE FROM public.content_items WHERE slug = 'test-medical-scenario-entry' AND type = 'medical_scenario';
```

#### 4. 截图要点
- **入口路径**：Supabase Dashboard > [Your Project] > SQL Editor
- **点击顺序**：
  1. 点击左侧菜单 "SQL Editor"
  2. 点击 "New Query" 创建新查询标签页
  3. 在编辑器中粘贴 SQL 命令
  4. 点击 "Run" 执行 SQL
  5. 观察 "Results" 面板的执行结果
- **预期看到的结果截图点位**：
  - 执行 `ALTER TYPE` 命令后，Results 面板显示 "Success. No rows returned"
  - 执行 `SELECT enumlabel` 查询后，Results 面板显示包含 'medical_scenario' 的枚举值列表
  - 执行测试插入后，Results 面板显示返回的新插入记录的 id, type, slug
  - 执行清理删除后，Results 面板显示删除影响的行数（通常为 1）

### 预期结果
- **Successful**: SQL Editor 显示 "Success. No rows returned" 或成功消息
- **无错误**: 控制台无红色错误消息
- **时间**: 执行通常在 2-5 秒内完成
- **验证**: 测试插入成功，说明 `medical_scenario` 类型已被接受

### 故障排除

#### 常见问题
- **权限错误**: 确保以项目管理员身份登录 Supabase Dashboard
- **枚举值已存在**: `ADD VALUE IF NOT EXISTS` 会自动跳过已存在的枚举值
- **类型不存在错误**: 确保已执行过 `docs/migration-fix.sql` 创建了 `content_type_enum`

#### 如果遇到错误
1. 检查 **"Messages"** 面板的错误详情
2. 确认 `content_type_enum` 已存在（执行 `docs/migration-fix.sql`）
3. 验证 SQL 语法正确

### 完成后验证
- 在 Admin Console 医疗场景工作台页面可正常创建和编辑医疗场景内容
- 插入新医疗场景记录不会触发数据库约束错误
- 发布医疗场景内容后，可被 Web 端 API 正常读取

---

## 工单完成状态报告 (2026-01-29 最终更新)

### ✅ 已完成的工单

#### A0：登录与权限
| 工单 | 状态 | 说明 |
|------|------|------|
| **A0-01** Supabase OAuth 登录 | ✅ 完成 | `app/admin/login/page.tsx` 已实现 Google OAuth 和邮箱密码登录 |
| **A0-02** profiles 表 + trigger + RLS | ✅ 完成 | `docs/profiles-implementation.sql` 和 `lib/auth-context.tsx` 已整合角色系统 |
| **A0-03** Admin 路由保护 + 403 | ✅ 完成 | `middleware.ts` 实现路由保护，`app/admin/403/page.tsx` 提供403页面 |

#### A1：内容契约与数据库
| 工单 | 状态 | 说明 |
|------|------|------|
| **A1-01** content_items 表 | ✅ 完成 | `docs/content-items-schema.sql` 定义统一内容表 |
| **A1-02** 内容类型枚举与校验 | ✅ 完成 | `lib/content-types.ts` 定义类型枚举和 Zod 校验 |
| **A1-03** 审计表 content_audit_log | ✅ 完成 | `docs/content-audit-log.sql` 定义审计日志表 |

#### A2：内容工作台
| 工单 | 状态 | 说明 |
|------|------|------|
| **A2-01** 医疗词汇工作台 | ✅ 完成 | `app/(admin)/content/medical-lexicon/page.tsx` |
| **A2-02** 医疗场景工作台 | ✅ 完成 | `app/(admin)/content/medical-scenario/page.tsx` |
| **A2-03** 通用词典工作台 | ✅ 完成 | `app/(admin)/content/lexicon/page.tsx` |
| **A2-04** Grammar 工作台 | ✅ 完成 | `app/(admin)/content/grammar/page.tsx` |
| **A2-05** Readings 工作台 | ✅ 完成 | `app/(admin)/content/readings/page.tsx` |
| **A2-06** Lessons 工作台 | ✅ 完成 | `app/(admin)/content/lessons/page.tsx` |
| **A2-07** 医疗对话/文章工作台 | ✅ 完成 | `app/(admin)/content/medical-dialogs/page.tsx` |

#### A3：SEO 工作台
| 工单 | 状态 | 说明 |
|------|------|------|
| **A3-01** SEO 字段编辑器组件 | ✅ 完成 | 各工作台都集成了 SEO 字段编辑 Tab |
| **A3-02** SEO 预览 | ✅ 完成 | `app/(admin)/seo/page.tsx` 提供 SERP 和 OG 预览 |
| **A3-03** 结构化数据模板 | ✅ 完成 | `lib/structured-data-templates.ts` + `components/admin/structured-data-template-picker.tsx` |

#### A4：GEO 工作台
| 工单 | 状态 | 说明 |
|------|------|------|
| **A4-01** geo_json 编辑器 | ✅ 完成 | `app/(admin)/seo-geo/page.tsx` 和 `components/admin/PublishingPanel.tsx` |

#### A5：发布中心
| 工单 | 状态 | 说明 |
|------|------|------|
| **A5-01** 发布中心列表 | ✅ 完成 | `app/(admin)/publish-center/page.tsx` 实现筛选和统计 |
| **A5-02** 批量发布功能完善 | ✅ 完成 | `app/(admin)/publish-center/page.tsx` + `actions.ts` |
| **A5-03** 变更记录查看 | ✅ 完成 | 审计日志表已创建，前端查看界面已集成 |
| **A5-04** 版本回滚功能 | ✅ 完成 | `components/admin/version-history.tsx` + `version-diff-viewer.tsx` |

#### A6：素材库
| 工单 | 状态 | 说明 |
|------|------|------|
| **A6-01** Supabase Storage 配置 | ✅ 完成 | `lib/supabase/storage-service.ts` + `docs/supabase-storage-setup.sql` |
| **A6-02** 素材管理页面 | ✅ 完成 | `app/(admin)/assets/page.tsx` 实现上传、浏览、删除功能 |

#### A7：用户与角色管理
| 工单 | 状态 | 说明 |
|------|------|------|
| **A7-01** profiles 管理页面 | ✅ 完成 | `app/(admin)/users/page.tsx` |
| **A7-02** allowlist 管理 | ✅ 完成 | `app/(admin)/settings/allowlist/page.tsx` + `lib/supabase/allowlist-service.ts` |

#### A8：上线前 QA
| 工单 | 状态 | 说明 |
|------|------|------|
| **A8-01** RLS 与权限回归测试 | ✅ 完成 | `e2e/permissions.spec.ts` + `e2e/rls.spec.ts` + `e2e/routes.spec.ts` |
| **A8-02** 跨端验收脚本 | ✅ 完成 | `e2e/responsive.spec.ts` + `e2e/user-flows.spec.ts` + `e2e/touch.spec.ts` + `e2e/performance.spec.ts` |

---

### 📊 总结

| 优先级 | 完成 | 部分完成 | 未完成 |
|--------|------|----------|--------|
| **P0** | 8 | 0 | 0 |
| **P1** | 16 | 0 | 0 |
| **P2** | 1 | 0 | 0 |

**核心功能（P0）完成率**：100%（8/8）
**整体完成率**：**100%**（25/25 完全完成）

---

## 🎉 项目完成摘要

### 完成日期
**2026-01-29**

### 新增文件列表

#### 页面组件
| 文件路径 | 说明 |
|----------|------|
| `app/(admin)/content/medical-dialogs/page.tsx` | 医疗对话/文章工作台 |
| `app/(admin)/users/page.tsx` | 用户档案管理页面 |
| `app/(admin)/settings/allowlist/page.tsx` | 白名单管理页面 |
| `app/(admin)/publish-center/page.tsx` | 发布中心（含批量发布） |
| `app/(admin)/publish-center/actions.ts` | 发布中心服务端操作 |

#### 组件
| 文件路径 | 说明 |
|----------|------|
| `components/admin/version-history.tsx` | 版本历史组件 |
| `components/admin/version-diff-viewer.tsx` | 版本差异对比查看器 |
| `components/admin/structured-data-template-picker.tsx` | 结构化数据模板选择器 |

#### 服务层
| 文件路径 | 说明 |
|----------|------|
| `lib/structured-data-templates.ts` | 结构化数据模板定义 |
| `lib/supabase/storage-service.ts` | Supabase Storage 服务封装 |
| `lib/supabase/allowlist-service.ts` | 白名单管理服务 |

#### E2E 测试
| 文件路径 | 说明 |
|----------|------|
| `e2e/permissions.spec.ts` | 权限回归测试 |
| `e2e/rls.spec.ts` | RLS 行级安全测试 |
| `e2e/routes.spec.ts` | 路由保护测试 |
| `e2e/responsive.spec.ts` | 响应式布局测试 |
| `e2e/user-flows.spec.ts` | 用户流程测试 |
| `e2e/touch.spec.ts` | 触摸交互测试 |
| `e2e/performance.spec.ts` | 性能测试 |

### 数据库迁移脚本列表

| 文件路径 | 说明 |
|----------|------|
| `docs/supabase-storage-setup.sql` | Supabase Storage bucket 配置和 RLS 策略 |
| `docs/content-versions.sql` | 内容版本表（支持版本回滚） |
| `docs/content-audit-log.sql` | 审计日志表 |
| `docs/profiles-implementation.sql` | profiles 表和权限函数 |
| `docs/content-items-schema.sql` | 统一内容表 schema |

### 测试覆盖情况

| 测试类型 | 文件 | 覆盖范围 |
|----------|------|----------|
| **权限测试** | `e2e/permissions.spec.ts` | admin/editor/viewer 角色权限验证 |
| **RLS 测试** | `e2e/rls.spec.ts` | 数据库行级安全策略验证 |
| **路由测试** | `e2e/routes.spec.ts` | 未授权访问重定向、403 页面 |
| **响应式测试** | `e2e/responsive.spec.ts` | 移动端/平板/桌面布局 |
| **用户流程测试** | `e2e/user-flows.spec.ts` | 登录、内容创建、发布完整流程 |
| **触摸测试** | `e2e/touch.spec.ts` | 移动端手势和触摸交互 |
| **性能测试** | `e2e/performance.spec.ts` | 页面加载时间、LCP、FID 指标 |

### 功能完成清单

- ✅ **登录与权限**：OAuth 登录、角色管理、路由保护
- ✅ **内容管理**：7 种内容类型工作台（词典、语法、阅读、课程、医疗词汇、医疗场景、医疗对话）
- ✅ **SEO/GEO**：SEO 字段编辑、SERP 预览、结构化数据模板
- ✅ **发布中心**：批量发布、变更记录、版本回滚
- ✅ **素材库**：Supabase Storage 集成、上传/浏览/删除
- ✅ **用户管理**：profiles 管理界面、allowlist 管理
- ✅ **QA 测试**：权限回归、RLS 测试、跨端验收脚本
