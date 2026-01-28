-- =============================================================================
-- 修复枚举类型迁移脚本
-- 针对 A1-02 工单：将 content_items.type 从 TEXT 转换为 ENUM
-- 解决错误：operator does not exist: content_type_enum = text
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 创建枚举类型（如果不存在）
-- 注意：枚举值必须与 lib/content-types.ts 中的 CONTENT_TYPES 完全一致
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type_enum') THEN
        CREATE TYPE content_type_enum AS ENUM (
            'grammar',
            'lessons',
            'lexicon',
            'medical-dialogs',
            'readings',
            'scenarios'
        );
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. 验证现有数据是否匹配枚举值
-- 如果存在不在枚举列表中的 type 值，迁移将失败
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM content_items
    WHERE type::text NOT IN (
        'grammar',
        'lessons',
        'lexicon',
        'medical-dialogs',
        'readings',
        'scenarios'
    );
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION '发现 % 行数据包含无效的内容类型。请在转换为枚举类型前清理数据。', invalid_count;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. 删除 type 列上的 CHECK 约束（避免类型不匹配错误）
-- 约束名可能是系统自动生成的（如 content_items_type_check）
-- -----------------------------------------------------------------------------
-- 首先尝试删除已知的约束名（PostgreSQL 默认命名规则）
ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_type_check;

-- 如果上述约束不存在，尝试动态查找并删除
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- 如果约束仍然存在（可能名称不同），则动态查找
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.content_items'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%type%ANY%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.content_items DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE '已删除 CHECK 约束: %', constraint_name;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. 删除依赖于 type 列的索引（这些索引将在列类型更改后自动重建，但显式删除更安全）
-- 注意：如果索引不存在，DROP IF EXISTS 不会报错
-- -----------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_content_items_type;
DROP INDEX IF EXISTS idx_content_items_type_slug;
DROP INDEX IF EXISTS idx_content_items_type_status;

-- -----------------------------------------------------------------------------
-- 5. 将列类型转换为枚举类型
-- 使用 CASE 显式转换每个文本值到枚举值
-- -----------------------------------------------------------------------------
ALTER TABLE public.content_items
ALTER COLUMN type TYPE content_type_enum
USING (
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

-- -----------------------------------------------------------------------------
-- 6. 重新创建必要的索引
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_type_slug ON public.content_items(type, slug);
CREATE INDEX IF NOT EXISTS idx_content_items_type_status ON public.content_items(type, status);

-- -----------------------------------------------------------------------------
-- 7. 更新列注释
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN public.content_items.type IS '内容类型枚举: grammar | lessons | lexicon | medical-dialogs | readings | scenarios';

-- -----------------------------------------------------------------------------
-- 完成
-- -----------------------------------------------------------------------------
SELECT '迁移成功完成。' AS result;