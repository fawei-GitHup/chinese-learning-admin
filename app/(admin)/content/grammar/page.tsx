"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  Send,
  Archive,
  Sparkles,
  X,
} from "lucide-react";
import { useAdminLocale } from "@/lib/admin-locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column, type FilterOption } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ContentDrawer } from "@/components/admin/content-drawer";
import { ChipInput } from "@/components/admin/chip-input";
import { getGrammarRules, saveGrammarRule, deleteGrammarRule, generateId } from "@/lib/mock/storage";
import {
  type GrammarRule,
  type ContentStatus,
  type GrammarExample,
  generateSlug,
  generateGeoSnippet,
} from "@/lib/mock/data";
import { useAuth, canEdit, canDelete, canPublish } from "@/lib/auth-context";
import { toast } from "sonner";

const defaultRule: Partial<GrammarRule> = {
  title: "",
  slug: "",
  pattern: "",
  explanation: "",
  examples: [],
  common_errors: [],
  seo_title: "",
  seo_description: "",
  geo_snippet: "",
  status: "draft",
};

export default function GrammarPage() {
  const { user } = useAuth();
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [editingRule, setEditingRule] = useState<Partial<GrammarRule> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "publish" | "archive" | "delete";
    rule: GrammarRule | null;
  }>({ open: false, type: "delete", rule: null });

  useEffect(() => {
    setRules(getGrammarRules());
  }, []);

  const refreshData = () => setRules(getGrammarRules());

  const handleCreate = () => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "Permission denied"));
      return;
    }
    setEditingRule({ ...defaultRule, examples: [], common_errors: [] });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleView = (rule: GrammarRule) => {
    setEditingRule({ ...rule });
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleEdit = (rule: GrammarRule) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "Permission denied"));
      return;
    }
    setEditingRule({ ...rule });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (rule: GrammarRule) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "Permission denied"));
      return;
    }
    setEditingRule({
      ...rule,
      id: undefined,
      title: `${rule.title} (Copy)`,
      slug: `${rule.slug}-copy`,
      status: "draft",
      publishedAt: undefined,
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (!editingRule?.title) {
      toast.error(t("标题不能为空", "Title is required"));
      return;
    }

    const now = new Date().toISOString();
    const isNew = !editingRule.id;
    const ruleToSave: GrammarRule = {
      id: editingRule.id || generateId(),
      title: editingRule.title || "",
      slug: editingRule.slug || generateSlug(editingRule.title || ""),
      pattern: editingRule.pattern || "",
      explanation: editingRule.explanation || "",
      examples: editingRule.examples || [],
      common_errors: editingRule.common_errors || [],
      seo_title: editingRule.seo_title || "",
      seo_description: editingRule.seo_description || "",
      geo_snippet: editingRule.geo_snippet || "",
      status: editingRule.status || "draft",
      createdAt: isNew ? now : (rules.find((r) => r.id === editingRule.id)?.createdAt || now),
      updatedAt: now,
      publishedAt: editingRule.publishedAt,
      author: user?.name || "Unknown",
    };

    saveGrammarRule(ruleToSave);
    refreshData();
    setIsDrawerOpen(false);
    setEditingRule(null);
    toast.success(isNew ? t("语法规则已创建", "Grammar rule created") : t("语法规则已更新", "Grammar rule updated"));
  };

  const handleStatusChange = (rule: GrammarRule, newStatus: ContentStatus) => {
    if (!user || !canPublish(user.role)) {
      toast.error(t("没有权限", "Permission denied"));
      return;
    }
    const now = new Date().toISOString();
    const updated = {
      ...rule,
      status: newStatus,
      updatedAt: now,
      publishedAt: newStatus === "published" ? now : rule.publishedAt,
    };
    saveGrammarRule(updated);
    refreshData();
    setConfirmDialog({ open: false, type: "delete", rule: null });
    toast.success(newStatus === "published" ? t("语法规则已发布", "Grammar rule published") : t("语法规则已归档", "Grammar rule archived"));
  };

  const handleDelete = () => {
    if (confirmDialog.rule) {
      deleteGrammarRule(confirmDialog.rule.id);
      refreshData();
      toast.success(t("语法规则已删除", "Grammar rule deleted"));
    }
    setConfirmDialog({ open: false, type: "delete", rule: null });
  };

  const handleGenerateSlug = () => {
    if (editingRule?.title) {
      setEditingRule((prev) => ({ ...prev, slug: generateSlug(prev?.title || "") }));
    }
  };

  const handleGenerateGeoSnippet = () => {
    if (editingRule?.title && editingRule?.pattern) {
      const summary = `Master the ${editingRule.title} in Chinese. Learn the pattern "${editingRule.pattern}" with clear examples and avoid common mistakes.`;
      const terms = editingRule.examples?.slice(0, 3).map((e) => e.cn) || [];
      setEditingRule((prev) => ({
        ...prev,
        geo_snippet: generateGeoSnippet(summary, terms),
      }));
    }
  };

  // Examples management
  const handleAddExample = () => {
    setEditingRule((prev) => ({
      ...prev,
      examples: [...(prev?.examples || []), { cn: "", pinyin: "", en: "" }],
    }));
  };

  const handleUpdateExample = (index: number, field: keyof GrammarExample, value: string) => {
    setEditingRule((prev) => {
      const examples = [...(prev?.examples || [])];
      examples[index] = { ...examples[index], [field]: value };
      return { ...prev, examples };
    });
  };

  const handleRemoveExample = (index: number) => {
    setEditingRule((prev) => ({
      ...prev,
      examples: prev?.examples?.filter((_, i) => i !== index) || [],
    }));
  };

  // Common errors management
  const handleAddError = () => {
    setEditingRule((prev) => ({
      ...prev,
      common_errors: [...(prev?.common_errors || []), ""],
    }));
  };

  const handleUpdateError = (index: number, value: string) => {
    setEditingRule((prev) => {
      const errors = [...(prev?.common_errors || [])];
      errors[index] = value;
      return { ...prev, common_errors: errors };
    });
  };

  const handleRemoveError = (index: number) => {
    setEditingRule((prev) => ({
      ...prev,
      common_errors: prev?.common_errors?.filter((_, i) => i !== index) || [],
    }));
  };

  const columns: Column<GrammarRule>[] = [
    {
      key: "title",
      label: t("标题", "Title"),
      sortable: true,
      render: (rule) => (
        <div>
          <p className="font-medium">{rule.title}</p>
          <p className="text-sm text-muted-foreground font-mono">{rule.pattern}</p>
        </div>
      ),
    },
    {
      key: "examples",
      label: t("示例", "Examples"),
      render: (rule) => (
        <Badge variant="outline" className="bg-secondary/50">
          {rule.examples.length} {t("个示例", "examples")}
        </Badge>
      ),
    },
    {
      key: "status",
      label: t("状态", "Status"),
      render: (rule) => <StatusBadge status={rule.status} />,
    },
    {
      key: "updatedAt",
      label: t("更新时间", "Updated"),
      sortable: true,
      render: (rule) =>
        new Date(rule.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "author",
      label: t("作者", "Owner"),
      render: (rule) => <span className="text-muted-foreground">{rule.author}</span>,
    },
  ];

  const filters: FilterOption[] = [
    {
      key: "status",
      label: t("状态", "Status"),
      options: [
        { value: "draft", label: t("草稿", "Draft") },
        { value: "published", label: t("已发布", "Published") },
        { value: "archived", label: t("已归档", "Archived") },
      ],
    },
  ];

  const renderActions = (rule: GrammarRule) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-border/50 rounded-xl">
        <DropdownMenuItem onClick={() => handleView(rule)}>
          <Eye className="mr-2 h-4 w-4" />
          {t("查看", "View")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(rule)} disabled={!user || !canEdit(user.role)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("编辑", "Edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicate(rule)} disabled={!user || !canEdit(user.role)}>
          <Copy className="mr-2 h-4 w-4" />
          {t("复制", "Duplicate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        {rule.status === "draft" && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "publish", rule })}
            disabled={!user || !canPublish(user.role)}
          >
            <Send className="mr-2 h-4 w-4" />
            {t("发布", "Publish")}
          </DropdownMenuItem>
        )}
        {rule.status !== "archived" && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "archive", rule })}
            disabled={!user || !canPublish(user.role)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {t("归档", "Archive")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem
          onClick={() => setConfirmDialog({ open: true, type: "delete", rule })}
          className="text-destructive focus:text-destructive"
          disabled={!user || !canDelete(user.role)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("删除", "Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("语法规则", "Grammar Rules")}</h1>
          <p className="text-muted-foreground">{t("管理中文语法解释和示例", "Manage Chinese grammar explanations and examples")}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-xl bg-primary hover:bg-primary/90"
          disabled={!user || !canEdit(user.role)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("新建规则", "New Rule")}
        </Button>
      </div>

      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="pt-6">
          <DataTable
            data={rules}
            columns={columns}
            searchKey="title"
            searchPlaceholder={t("搜索语法规则...", "Search grammar rules...")}
            filters={filters}
            renderActions={renderActions}
          />
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <ContentDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={isViewMode ? t("查看语法规则", "View Grammar Rule") : editingRule?.id ? t("编辑语法规则", "Edit Grammar Rule") : t("新建语法规则", "New Grammar Rule")}
        description={isViewMode ? t("查看语法规则详情", "View grammar rule details") : t("请填写以下语法规则信息", "Fill in the grammar rule details below")}
        onSave={handleSave}
        onCancel={() => {
          setIsDrawerOpen(false);
          setEditingRule(null);
        }}
        isNew={!editingRule?.id}
        disabled={isViewMode}
      >
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-xl">
            <TabsTrigger value="content" className="rounded-lg">{t("内容", "Content")}</TabsTrigger>
            <TabsTrigger value="examples" className="rounded-lg">{t("示例", "Examples")}</TabsTrigger>
            <TabsTrigger value="seo" className="rounded-lg">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("标题", "Title")} *</Label>
              <Input
                value={editingRule?.title || ""}
                onChange={(e) => setEditingRule((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t("例如: 使用 是 (shì) - 动词 '是'", "e.g., Using 是 (shì) - The Verb 'To Be'")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("别名", "Slug")}</Label>
              <div className="flex gap-2">
                <Input
                  value={editingRule?.slug || ""}
                  onChange={(e) => setEditingRule((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder={t("语法规则别名", "grammar-rule-slug")}
                  className="bg-secondary/50 border-border/50 rounded-xl flex-1"
                  disabled={isViewMode}
                />
                {!isViewMode && (
                  <Button type="button" variant="outline" onClick={handleGenerateSlug} className="rounded-xl bg-transparent">
                    {t("自动", "Auto")}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("句型", "Pattern")}</Label>
              <Input
                value={editingRule?.pattern || ""}
                onChange={(e) => setEditingRule((prev) => ({ ...prev, pattern: e.target.value }))}
                placeholder={t("例如: 主语 + 是 + 名词", "e.g., Subject + 是 + Noun")}
                className="bg-secondary/50 border-border/50 rounded-xl font-mono"
                disabled={isViewMode}
              />
              <p className="text-xs text-muted-foreground">{t("语法结构句型", "The grammatical structure pattern")}</p>
            </div>

            <div className="space-y-2">
              <Label>{t("状态", "Status")}</Label>
              <Select
                value={editingRule?.status || "draft"}
                onValueChange={(value) => setEditingRule((prev) => ({ ...prev, status: value as ContentStatus }))}
                disabled={isViewMode || !canPublish(user?.role || "viewer")}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/50 rounded-xl">
                  <SelectItem value="draft">{t("草稿", "Draft")}</SelectItem>
                  <SelectItem value="published">{t("已发布", "Published")}</SelectItem>
                  <SelectItem value="archived">{t("已归档", "Archived")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("解释 (Markdown)", "Explanation (Markdown)")}</Label>
              <Textarea
                value={editingRule?.explanation || ""}
                onChange={(e) => setEditingRule((prev) => ({ ...prev, explanation: e.target.value }))}
                placeholder={t("# 语法解释\n\n详细解释语法规则...", "# Grammar Explanation\n\nExplain the grammar rule in detail...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[200px] font-mono text-sm"
                disabled={isViewMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4 mt-4">
            {/* Examples Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t(`示例 (${editingRule?.examples?.length || 0})`, `Examples (${editingRule?.examples?.length || 0})`)}</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddExample} className="rounded-xl bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("添加示例", "Add Example")}
                  </Button>
                )}
              </div>

              {editingRule?.examples?.map((example, index) => (
                <Card key={index} className="glass-card border-border/50 rounded-xl p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">{t(`示例 ${index + 1}`, `Example ${index + 1}`)}</Label>
                      {!isViewMode && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveExample(index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={example.cn}
                      onChange={(e) => handleUpdateExample(index, "cn", e.target.value)}
                      placeholder={t("中文: 我是学生", "Chinese: 我是学生")}
                      className="bg-secondary/30 border-border/50 rounded-lg h-8 text-sm"
                      disabled={isViewMode}
                    />
                    <Input
                      value={example.pinyin}
                      onChange={(e) => handleUpdateExample(index, "pinyin", e.target.value)}
                      placeholder={t("拼音: Wǒ shì xuéshēng", "Pinyin: Wǒ shì xuéshēng")}
                      className="bg-secondary/30 border-border/50 rounded-lg h-8 text-sm"
                      disabled={isViewMode}
                    />
                    <Input
                      value={example.en}
                      onChange={(e) => handleUpdateExample(index, "en", e.target.value)}
                      placeholder={t("英文: I am a student", "English: I am a student")}
                      className="bg-secondary/30 border-border/50 rounded-lg h-8 text-sm"
                      disabled={isViewMode}
                    />
                  </div>
                </Card>
              ))}

              {(!editingRule?.examples || editingRule.examples.length === 0) && (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                  <p>{t("暂无示例。", "No examples yet.")}</p>
                </div>
              )}
            </div>

            {/* Common Errors Section */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label>{t(`常见错误 (${editingRule?.common_errors?.length || 0})`, `Common Errors (${editingRule?.common_errors?.length || 0})`)}</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddError} className="rounded-xl bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("添加错误", "Add Error")}
                  </Button>
                )}
              </div>

              {editingRule?.common_errors?.map((error, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={error}
                    onChange={(e) => handleUpdateError(index, e.target.value)}
                    placeholder={t("例如: 我是高 ❌ (错误 - 不能将 是 与形容词连用)", "e.g., 我是高 ❌ (incorrect - don't use 是 with adjectives)")}
                    className="bg-destructive/10 border-destructive/30 rounded-xl flex-1 text-sm"
                    disabled={isViewMode}
                  />
                  {!isViewMode && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => handleRemoveError(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("SEO 标题", "SEO Title")}</Label>
              <Input
                value={editingRule?.seo_title || ""}
                onChange={(e) => setEditingRule((prev) => ({ ...prev, seo_title: e.target.value }))}
                placeholder={t("SEO 优化标题...", "SEO optimized title...")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("SEO 描述", "SEO Description")}</Label>
              <Textarea
                value={editingRule?.seo_description || ""}
                onChange={(e) => setEditingRule((prev) => ({ ...prev, seo_description: e.target.value }))}
                placeholder={t("元描述...", "Meta description...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("GEO 摘要", "GEO Snippet")}</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateGeoSnippet} className="rounded-xl bg-transparent">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("自动生成", "Auto Generate")}
                  </Button>
                )}
              </div>
              <Textarea
                value={editingRule?.geo_snippet || ""}
                onChange={(e) => setEditingRule((prev) => ({ ...prev, geo_snippet: e.target.value }))}
                placeholder={t("地理搜索摘要...", "Geographic search snippet...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
              <p className="text-xs text-muted-foreground">{editingRule?.geo_snippet?.length || 0}/200 {t("字符", "characters")}</p>
            </div>
          </TabsContent>
        </Tabs>
      </ContentDrawer>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "publish" ? t("发布语法规则", "Publish Grammar Rule") : confirmDialog.type === "archive" ? t("归档语法规则", "Archive Grammar Rule") : t("删除语法规则", "Delete Grammar Rule")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmDialog.type === "publish"
                ? t(`发布 "${confirmDialog.rule?.title}"?`, `Publish "${confirmDialog.rule?.title}"?`)
                : confirmDialog.type === "archive"
                  ? t(`归档 "${confirmDialog.rule?.title}"?`, `Archive "${confirmDialog.rule?.title}"?`)
                  : t(`删除 "${confirmDialog.rule?.title}"? 此操作无法撤销。`, `Delete "${confirmDialog.rule?.title}"? This cannot be undone.`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: "delete", rule: null })} className="rounded-xl">
              {t("取消", "Cancel")}
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.type === "delete") handleDelete();
                else if (confirmDialog.rule) handleStatusChange(confirmDialog.rule, confirmDialog.type === "publish" ? "published" : "archived");
              }}
              variant={confirmDialog.type === "delete" ? "destructive" : "default"}
              className="rounded-xl"
            >
              {confirmDialog.type === "publish" ? t("发布", "Publish") : confirmDialog.type === "archive" ? t("归档", "Archive") : t("删除", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
