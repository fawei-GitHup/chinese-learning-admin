-- =====================================================
-- Supabase Storage 配置 - 资源存储桶
-- 工单 A6-01: Asset Storage Integration
-- =====================================================

-- 1. 创建公开的资源桶 (assets bucket)
-- 注意：在 Supabase Dashboard 中执行此 SQL 前，
-- 请确保已在 Storage 设置中启用了 Row Level Security
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,  -- 公开访问，允许直接通过 URL 访问文件
  52428800, -- 50MB 文件大小限制
  ARRAY[
    -- 图片格式
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    -- 音频格式
    'audio/mpeg',    -- MP3
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/mp4',
    -- 文档格式
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. Storage RLS Policies (Row Level Security)
-- 确保只有授权用户可以执行特定操作
-- =====================================================

-- 删除现有策略（如果存在）以便重新创建
DROP POLICY IF EXISTS "Public can view assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any asset" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

-- 策略 1: 公开读取 - 任何人都可以查看 assets 桶中的文件
CREATE POLICY "Public can view assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

-- 策略 2: 认证用户上传 - 只有登录用户可以上传文件
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assets' 
    AND auth.role() = 'authenticated'
  );

-- 策略 3: 用户更新自己的上传 - 用户可以更新自己上传的文件
CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'assets' 
    AND auth.uid()::text = (owner_id)::text
  );

-- 策略 4: 管理员删除 - 只有 admin 角色可以删除任何资源
CREATE POLICY "Admins can delete any asset"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assets' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 策略 5: 用户删除自己的上传（可选，如果需要普通用户也能删除自己的文件）
-- CREATE POLICY "Users can delete own uploads"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'assets' 
--     AND auth.uid()::text = (owner_id)::text
--   );

-- =====================================================
-- 3. 资源元数据表（可选）
-- 用于存储额外的资源信息如用途、标签等
-- =====================================================

CREATE TABLE IF NOT EXISTS assets_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT UNIQUE NOT NULL,  -- storage.objects 中的路径
  display_name TEXT,                   -- 显示名称
  description TEXT,                    -- 资源描述
  usage TEXT CHECK (usage IN ('Lesson', 'Reading', 'Medical', 'Other')),  -- 用途分类
  tags TEXT[],                         -- 标签数组
  file_type TEXT,                      -- 文件类型 (image/audio/document)
  file_size BIGINT,                    -- 文件大小（字节）
  mime_type TEXT,                      -- MIME 类型
  width INTEGER,                       -- 图片宽度（仅图片）
  height INTEGER,                      -- 图片高度（仅图片）
  duration INTEGER,                    -- 音频/视频时长（秒，仅音视频）
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assets_metadata_path ON assets_metadata(storage_path);
CREATE INDEX IF NOT EXISTS idx_assets_metadata_usage ON assets_metadata(usage);
CREATE INDEX IF NOT EXISTS idx_assets_metadata_file_type ON assets_metadata(file_type);
CREATE INDEX IF NOT EXISTS idx_assets_metadata_created_by ON assets_metadata(created_by);
CREATE INDEX IF NOT EXISTS idx_assets_metadata_created_at ON assets_metadata(created_at DESC);

-- 更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_assets_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assets_metadata_updated_at ON assets_metadata;
CREATE TRIGGER assets_metadata_updated_at
  BEFORE UPDATE ON assets_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_assets_metadata_updated_at();

-- =====================================================
-- 4. 资源元数据表 RLS 策略
-- =====================================================

ALTER TABLE assets_metadata ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "Anyone can view asset metadata" ON assets_metadata;
DROP POLICY IF EXISTS "Authenticated users can insert metadata" ON assets_metadata;
DROP POLICY IF EXISTS "Users can update own metadata" ON assets_metadata;
DROP POLICY IF EXISTS "Admins can update any metadata" ON assets_metadata;
DROP POLICY IF EXISTS "Admins can delete metadata" ON assets_metadata;

-- 策略 1: 公开读取元数据
CREATE POLICY "Anyone can view asset metadata"
  ON assets_metadata FOR SELECT
  USING (true);

-- 策略 2: 认证用户可以插入元数据
CREATE POLICY "Authenticated users can insert metadata"
  ON assets_metadata FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 策略 3: 用户可以更新自己创建的元数据
CREATE POLICY "Users can update own metadata"
  ON assets_metadata FOR UPDATE
  USING (auth.uid() = created_by);

-- 策略 4: 管理员可以更新任何元数据
CREATE POLICY "Admins can update any metadata"
  ON assets_metadata FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 策略 5: 管理员可以删除元数据
CREATE POLICY "Admins can delete metadata"
  ON assets_metadata FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- 5. 辅助函数：获取资源公开 URL
-- =====================================================

CREATE OR REPLACE FUNCTION get_asset_public_url(path TEXT)
RETURNS TEXT AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- 从环境变量或配置获取 Supabase URL
  -- 在实际使用中，这个 URL 应该从应用配置中获取
  SELECT current_setting('app.supabase_url', true) INTO base_url;
  
  IF base_url IS NULL THEN
    -- 返回相对路径
    RETURN '/storage/v1/object/public/assets/' || path;
  END IF;
  
  RETURN base_url || '/storage/v1/object/public/assets/' || path;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 使用说明
-- =====================================================
-- 
-- 1. 在 Supabase Dashboard 中执行此 SQL
-- 2. 确保 profiles 表已存在且包含 role 字段
-- 3. 配置完成后，前端可以使用 Storage API 进行文件操作：
--    - 上传: supabase.storage.from('assets').upload(path, file)
--    - 获取 URL: supabase.storage.from('assets').getPublicUrl(path)
--    - 删除: supabase.storage.from('assets').remove([path])
--    - 列表: supabase.storage.from('assets').list(folder)
--
-- 4. 文件路径建议：
--    - 图片: images/[year]/[month]/[filename]
--    - 音频: audio/[year]/[month]/[filename]
--    - 文档: documents/[year]/[month]/[filename]
--
-- 5. 错误处理：
--    - 413: 文件过大（超过 50MB）
--    - 415: 不支持的文件类型
--    - 401: 未授权（需要登录）
--    - 403: 权限不足
-- =====================================================
