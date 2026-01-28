# 中文学习管理台 Admin Console

这是一个为中文学习平台设计的管理员控制台，提供全面的内容管理和发布功能。

## 📋 项目简介

本项目是中文学习平台的后台管理系统，基于 Next.js 和 Supabase 构建。主要用于：

- 管理和发布各类教育内容
- 支持多语言内容管理
- 提供SEO优化和结构化数据功能
- 实现多角色权限控制

## 🚀 主要功能

### 内容管理
- **支持的内容类型**：
  - Grammar（语法点）
  - Lessons（课程）
  - Lexicon（词典词条）
  - Medical Dialogs（医疗对话）
  - Medical Lexicon（医疗词汇）
  - Readings（阅读材料）
  - Scenarios（场景对话）

### 权限管理
- **角色类型**：
  - `viewer`：只读权限，可浏览内容
  - `editor`：编辑权限，可创建和修改内容（草稿状态）
  - `admin`：管理员权限，可发布、下架和管理用户

### 内容生命周期
- **状态流程**：`draft` → `review` → `published` → `archived`
- 发布后内容立即在用户端可见

### 发布中心
- 批量发布功能
- 变更审计日志
- 内容预览

### SEO/GEO 工作台
- SEO字段管理（标题、描述、元标签）
- 结构化数据（FAQ、地理信息等）
- 搜索引擎优化支持

## 🔗 与用户端的接口

用户端（前端Web应用）通过 Supabase API 访问已发布的内容：

### 数据源
- **数据库**：Supabase PostgreSQL
- **主表**：`content_items`
- **过滤条件**：`status = 'published'`

### API 接口

#### 1. 获取指定类型内容
```typescript
// 查询已发布的内容（按类型分组）
const { data, error } = await supabase
  .from('content_items')
  .select('*')
  .eq('type', 'medical_lexicon')  // 内容类型
  .eq('status', 'published')       // 只获取已发布内容
  .order('updated_at', { ascending: false });
```

#### 2. 根据ID获取内容
```typescript
// 获取特定内容详情
const { data, error } = await supabase
  .from('content_items')
  .select('*')
  .eq('id', 'content-id')
  .eq('status', 'published')
  .single();
```

#### 3. 数据结构
```typescript
interface ContentItem {
  id: string;
  type: ContentItemType;
  slug: string;
  locale: string;
  status: 'published'; // 用户端只见已发布内容
  content_json: Record<string, unknown>; // 具体内容数据
  seo_json: {
    title: string;
    description: string;
    canonical?: string;
    ogImage?: string;
  };
  geo_json: {
    snippet: string;
    keyPoints: string[];
    faq: Array<{ question: string; answer: string }>;
    llmHint?: string;
  };
  created_at: string;
  updated_at: string;
  published_at: string;
}
```

### 安全性
- 通过 Supabase RLS（行级安全）确保用户端只能读取已发布内容
- 非发布状态的内容对用户端不可见

## 🛠️ 技术栈

- **前端框架**：Next.js 16
- **UI 库**：React 19, Tailwind CSS, Radix UI
- **后端数据库**：Supabase PostgreSQL
- **认证**：Supabase Auth (Google OAuth / 邮箱密码)
- **部署**：Vercel / Netlify

## 📦 安装与运行

### 前置要求
- Node.js 18+
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/fawei-GitHup/chinese-learning-admin.git
   cd chinese-learning-admin
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   pnpm install
   ```

3. **环境配置**
   创建 `.env.local` 文件：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
   NEXT_PUBLIC_EDITOR_EMAILS=editor@example.com
   NEXT_PUBLIC_VIEWER_EMAILS=viewer@example.com
   ```

4. **数据库初始化**
   按照 `docs/project-status.md` 中的说明，在 Supabase 中执行相关 SQL 文件。

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

6. **访问应用**
   - Admin Console: http://localhost:3000/admin/login

## 🚀 部署

### 推荐部署平台
- **Vercel**: 自动部署，无需额外配置
- **Netlify**: 需配置构建命令为 `npm run build`

### 部署步骤
1. 将项目推送到 GitHub
2. 在部署平台导入项目
3. 配置环境变量
4. 部署完成

## 📚 项目文档

详细文档位于 `docs/` 目录：
- `Admin_PRD_Full.md`: 产品需求说明
- `project-status.md`: 项目状态和部署指南
- `supabase_schema.sql`: 数据库架构
- `content-items-schema.sql`: 内容表结构

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过 GitHub Issues 联系我们。

---

**🎉 感谢使用中文学习管理台 Admin Console！**