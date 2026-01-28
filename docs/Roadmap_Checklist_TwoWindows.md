# 两窗口开发路线图清单（可打勾版）

> 窗口 1：Web（`learn-chinese-ui-prototype`）  
> 窗口 2：Admin（`admin-console-ui`）  
> 原则：先打地基（Auth/DB/契约）→ 再做闭环切片（发布→可见→SEO→SRS）→ 再扩全站。

---

## Day 0：准备
- [ ] 两个 VS Code 窗口分别打开 Web/Admin 项目
- [ ] 两端配置 Supabase env（URL / ANON KEY）
- [ ] 约定：每条工单 1 个 commit（commit 信息包含工单号）

---

## Day 1：登录地基（两端并行）
### Admin
- [ ] A0-01（Admin OAuth 登录页 `/admin/login`）
- [ ] A0-03（Admin 路由保护 `/admin/*` + 403）

### Web
- [ ] W0-01（Web Supabase client + env 校验）
- [ ] W0-02（Web `/login` OAuth + redirect）
- [ ] W0-03（Web 学习区路由保护 `/app/*`）
- [ ] W0-04（Web 登出 + 会话保持）
- [ ] W0-05（Web 登录页 noindex）

### 验收
- [ ] Web 未登录进 `/app/dashboard` → 跳 `/login?redirect=...`
- [ ] Admin 未登录进 `/admin` → 跳 `/admin/login`

---

## Day 2：数据库与契约（必须打牢）
### Admin/DB（优先）
- [ ] A0-02（`profiles` 表 + trigger + RLS）
- [ ] A1-01（`content_items` 表 + RLS）
- [ ] A1-03（`content_audit_log` 审计表）
- [ ] A1-02（内容 type 枚举/校验）

### Web（可穿插）
- [ ] W1-02（统一 error/empty/skeleton 组件）

### 验收
- [ ] 新账号登录后 `profiles` 自动生成 role=viewer
- [ ] `content_items` 表存在，RLS 开启

---

## Day 3：闭环切片 01（医疗词汇）
### Admin
- [ ] A2-01（medical_lexicon 工作台：列表/新增/编辑/发布）

### Web
- [ ] W1-01（内容查询层：getList/getBySlug，先支持 medical_lexicon）
- [ ] W2-01（医疗词汇列表接 published）
- [ ] W2-02（医疗词汇详情 + 收藏/加入SRS入口 + SEO）

### 跨端验收
- [ ] Admin 发布 1 条 medical_lexicon → Web 列表出现 → 详情正确
- [ ] 详情页 head 有 title/description/canonical + JSON-LD（至少一种）

---

## Day 4：闭环切片 02（医疗场景）
### Admin
- [ ] A2-02（medical_scenario 工作台）

### Web
- [ ] W2-03（医疗场景列表+详情接 published）
- [ ] W2-04（医疗专题集合页 /medical + 内链）

### 跨端验收
- [ ] Admin 发布场景 → Web 可见
- [ ] 专题集合页能串联词汇/场景（SEO 内链）

---

## Day 5：用户数据闭环（SRS 必须跑起来）
### Web（为主）
- [ ] W4-01（用户数据表接入：saved/srs/reviews + RLS）
- [ ] W4-02（加入 SRS 统一动作）
- [ ] W4-03（复习队列 + 打分更新间隔）

### 验收
- [ ] `/app/srs` 可复习；打分会改变下次到期
- [ ] 换账号看不到对方卡片（RLS 生效）

---

## Day 6：SEO 基建（让内容能长流量）
### Web
- [ ] W9-03（结构化数据工具函数统一）
- [ ] W9-01（自动 sitemap：只收录 published）
- [ ] W9-02（robots.txt：屏蔽 login/学习区按策略）
- [ ] W1-03（缓存策略：列表分页/详情缓存）

### 验收
- [ ] sitemap 包含医疗词条与场景
- [ ] robots 生效；登录页 noindex

---

## Day 7：扩内容类型 01（通用词典 lexicon）
### Admin
- [ ] A2-03（lexicon 工作台）

### Web
- [ ] W3-01（搜索：term/pinyin/en，先覆盖 lexicon）
- [ ] W3-02（词典详情页接 published）

### 跨端验收
- [ ] Admin 发布词条 → Web 搜索/详情可见

---

## Day 8：扩内容类型 02（Grammar）
### Admin
- [ ] A2-04（Grammar 工作台）

### Web
- [ ] W5-03（Grammar 列表+详情接 published）

### 跨端验收
- [ ] Admin 发布语法点 → Web 详情可见且 SEO 正确

---

## Day 9：扩内容类型 03（Readings）
### Admin
- [ ] A2-05（Readings 工作台）

### Web
- [ ] W5-02（Readings 列表+详情接 published）

### 跨端验收
- [ ] Admin 发布阅读 → Web 可见

---

## Day 10–12：Lessons + 进度 + Dashboard 闭环
### Admin
- [ ] A2-06（Lessons 工作台）

### Web
- [ ] W5-01（Lessons 列表+详情接 published）
- [ ] W5-04（学习进度 user_progress）
- [ ] W6-01（Dashboard 联动：今日复习/最近学习/推荐）

### 跨端验收
- [ ] 完成 lesson/reading 会写进度，dashboard 可见

---

## Day 13+：管理端增强（运营能力）
### Admin
- [ ] A3-01/A3-02（SEO 工作台字段编辑 + 预览）
- [ ] A5-01~A5-03（发布中心 + 批量发布 + 审计）
- [ ] A7-01（profiles 角色管理）
- [ ] A6（素材库，P1）

---

## 上线前 1 天：全站 QA
### Web
- [ ] W10-01/W10-02（RLS/权限/错误边界回归）

### Admin
- [ ] A8-01/A8-02（RLS/跨端发布验收脚本）

---

## 同步原则（牢记）
> 每完成一个 Admin 内容类型（A2-xx），立刻在 Web 做对应读取与详情页（W2/W3/W5）并做跨端验收：  
> **Admin 发布一条 → Web 列表/详情立刻可见 + SEO 元信息正确**。
