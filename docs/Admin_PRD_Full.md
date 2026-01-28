# PRD（管理端 Admin）全量版：内容工作台 + 发布中心 + SEO/GEO（Admin Console）

> 适用工程：`admin-console-ui`  
> 目标：把当前“原型 + 局部 supabase”升级为真正的 **内容生产与发布系统**，确保：  
> **Admin 发布 → Web 立即可读（published） → SEO/GEO 自动化**。

---

## 1. 管理端职责边界

Admin 管理端负责：
- 内容创建/编辑/审核/发布/下架（内容生命周期）
- 多语言内容管理（locale）
- SEO/GEO 字段编辑与预览
- 素材管理（图片/音频）
- 权限与用户角色管理
- 发布中心（批量发布、回滚、预览、变更记录）

Admin 不负责：
- 终端学习体验（由 Web 做）
- 复杂 BI（可后续扩展）

---

## 2. 角色与权限（P0）

- `viewer`：可浏览列表/详情（只读）
- `editor`：可创建与编辑 draft/review；不可发布（默认）
- `admin`：可发布/下架、管理用户角色、修改系统设置

权限矩阵（P0）
- 列表/详情读取：viewer/editor/admin
- 新增/编辑：editor/admin
- 发布/下架：admin（可选允许 editor 发布，但不推荐）

---

## 3. 内容类型（与你现有 UI 对齐）

### 3.1 通用内容类型
- Lessons（课程）
- Readings（阅读）
- Grammar（语法点）
- Lexicon（词典词条）

### 3.2 医疗专题内容
- Medical Dialogs（医疗对话/文章）
- Medical Scenarios（问诊场景）
- Medical Lexicon（医疗词汇）
- Medical Grammar（医疗语法）

> 目标：所有内容统一落库在同一契约（建议 `content_items`），类型通过 `type` 区分。

---

## 4. 内容生命周期（P0）

状态：`draft → review → published → archived`

规则：
- Web 端只读 `published`
- draft/review/archived 仅 Admin 可见（按权限）
- 发布动作写入变更记录（audit）

---

## 5. 关键模块规格（全量）

### 5.1 登录与权限（P0）
- Supabase OAuth 登录
- 读取 `profiles.role`
- `/admin/*` 路由保护
- 403 页面与登出

### 5.2 内容工作台（P0）
每个内容类型必须具备：
- 列表：搜索、筛选（status/locale/tag/updated）
- 新增：生成 slug（可编辑）、选择 locale、初始 status=draft
- 编辑：内容编辑器（JSON 表单或结构化表单）
- 预览：预览渲染（接近 Web 展示）
- 发布：仅 admin；发布后 Web 可见
- 下架：archived

### 5.3 SEO 工作台（P0）
对每条内容提供 SEO 字段：
- title, description, canonical
- og:title/og:description/og:image
- FAQ（用于 JSON-LD）
- 结构化数据模板（按类型）

### 5.4 GEO 工作台（P0/P1）
- geo_json：地区绑定/免责声明/适用范围
- 城市落地页（若你要做）需要内容可绑定 city/tag

### 5.5 发布中心（P0）
- 批量发布：按筛选条件批量 publish
- 变更记录：谁在何时发布了什么（audit log）
- 回滚（P1）：恢复到上一个 published 版本（需要版本表）

### 5.6 素材管理（P1）
- 上传图片/音频（Supabase Storage）
- 生成可复用的资源 URL
- 内容可引用素材（存于 content_json）

### 5.7 用户与角色管理（P1）
- 管理 `profiles.role`
- allowlist（可选）管理

---

## 6. 数据契约（Admin 写入的唯一真相）

建议统一表 `content_items`（与 Web 对齐），字段见 Web PRD 第 6 章。  
Admin 必须保证：
- 发布时写 `status='published'`
- slug 唯一
- seo_json 与 geo_json 可选但结构稳定
- updated_at/created_at 正确

---

## 7. 质量与合规
- RLS：内容表写操作必须限制 editor/admin
- Audit：发布动作必须留痕
- 预览：支持“预览 draft”但只对 Admin 可见（例如带 token）

---

## 8. 里程碑
- M0（P0）：登录 + profiles.role + content_items（医疗词典/场景）CRUD + 发布后 Web 可读
- M1（P1）：所有内容类型 CRUD + SEO 工作台 + sitemap 支持字段 + 素材库
- M2（P2）：版本回滚 + 高级权限 + 批量导入导出
