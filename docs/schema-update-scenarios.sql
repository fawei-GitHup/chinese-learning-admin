-- =============================================================================
-- SCHEMA UPDATE: MEDICAL_SCENARIOS 表结构更新
-- =============================================================================
-- 此脚本更新 medical_scenarios 表，使其与前端代码匹配
-- 在 Supabase SQL Editor 中运行此脚本
-- 
-- 问题背景：
-- - 前端代码使用 `conversation`, `checklist`, `warnings` 字段
-- - 原表设计使用 `dialogue`, `doctor_questions`, `patient_templates` 字段
-- - 导致 PGRST204 错误 (Column value not provided)
-- =============================================================================

-- 首先检查并添加缺失的列
DO $$
BEGIN
  -- 添加 conversation 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_scenarios' 
    AND column_name = 'conversation'
  ) THEN
    ALTER TABLE public.medical_scenarios 
    ADD COLUMN conversation JSONB NOT NULL DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added conversation column';
  END IF;

  -- 添加 checklist 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_scenarios' 
    AND column_name = 'checklist'
  ) THEN
    ALTER TABLE public.medical_scenarios 
    ADD COLUMN checklist TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE 'Added checklist column';
  END IF;

  -- 添加 warnings 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_scenarios' 
    AND column_name = 'warnings'
  ) THEN
    ALTER TABLE public.medical_scenarios 
    ADD COLUMN warnings JSONB NOT NULL DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added warnings column';
  END IF;

  -- 添加 created_by 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_scenarios' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.medical_scenarios 
    ADD COLUMN created_by TEXT;
    RAISE NOTICE 'Added created_by column';
  END IF;
END $$;

-- 如果 key_phrases 是 JSONB 类型但我们需要 TEXT[]，进行转换
-- 注意：如果已经有数据，需要谨慎处理
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'medical_scenarios' 
  AND column_name = 'key_phrases';
  
  IF col_type = 'jsonb' THEN
    -- 备份并重新创建列
    ALTER TABLE public.medical_scenarios DROP COLUMN IF EXISTS key_phrases_backup;
    ALTER TABLE public.medical_scenarios RENAME COLUMN key_phrases TO key_phrases_backup;
    ALTER TABLE public.medical_scenarios ADD COLUMN key_phrases TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    
    -- 尝试迁移数据（如果有）
    UPDATE public.medical_scenarios
    SET key_phrases = ARRAY(
      SELECT jsonb_array_elements_text(
        CASE 
          WHEN key_phrases_backup IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(key_phrases_backup) = 'array' THEN key_phrases_backup
          ELSE '[]'::jsonb
        END
      )
    )
    WHERE key_phrases_backup IS NOT NULL;
    
    RAISE NOTICE 'Converted key_phrases from JSONB to TEXT[]';
  END IF;
END $$;

-- 更新 medical_lexicon 表添加 usage 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_lexicon' 
    AND column_name = 'usage'
  ) THEN
    ALTER TABLE public.medical_lexicon 
    ADD COLUMN usage JSONB NOT NULL DEFAULT '{
      "say_it_like": [],
      "dont_say": [],
      "collocations": []
    }'::jsonb;
    RAISE NOTICE 'Added usage column to medical_lexicon';
  END IF;

  -- 添加 created_by 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_lexicon' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.medical_lexicon 
    ADD COLUMN created_by TEXT;
    RAISE NOTICE 'Added created_by column to medical_lexicon';
  END IF;
END $$;

-- 更新 medical_grammar 表添加缺失列
DO $$
BEGIN
  -- 添加 created_by 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_grammar' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.medical_grammar 
    ADD COLUMN created_by TEXT;
    RAISE NOTICE 'Added created_by column to medical_grammar';
  END IF;

  -- 添加 common_mistakes 列（如果不存在，替代 common_errors）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medical_grammar' 
    AND column_name = 'common_mistakes'
  ) THEN
    ALTER TABLE public.medical_grammar 
    ADD COLUMN common_mistakes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE 'Added common_mistakes column to medical_grammar';
  END IF;
END $$;

-- =============================================================================
-- 添加注释
-- =============================================================================
COMMENT ON COLUMN public.medical_scenarios.conversation IS 'Array of conversation lines: [{speaker, line, note?}]';
COMMENT ON COLUMN public.medical_scenarios.checklist IS 'Array of checklist items for the scenario';
COMMENT ON COLUMN public.medical_scenarios.warnings IS 'Array of warnings: [{type, message}]';
COMMENT ON COLUMN public.medical_lexicon.usage IS 'Usage examples: {say_it_like[], dont_say[], collocations[]}';

-- =============================================================================
-- 验证查询
-- =============================================================================
/*
-- 检查 medical_scenarios 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'medical_scenarios'
ORDER BY ordinal_position;

-- 检查 medical_lexicon 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'medical_lexicon'
ORDER BY ordinal_position;

-- 检查 medical_grammar 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'medical_grammar'
ORDER BY ordinal_position;
*/

-- =============================================================================
-- 完成！
-- 运行此脚本后，前端代码应该能够正常保存数据到 Supabase
-- =============================================================================
