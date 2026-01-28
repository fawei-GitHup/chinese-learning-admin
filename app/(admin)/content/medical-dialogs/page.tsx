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
  AlertTriangle,
  GripVertical,
} from "lucide-react";
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
import { getMedicalDialogs, saveMedicalDialog, deleteMedicalDialog, generateId } from "@/lib/mock/storage";
import {
  type MedicalDialog,
  type ContentStatus,
  type MedicalCategory,
  type DifficultyLevel,
  type PatientTemplate,
  type DialogLine,
  type FAQItem,
  generateSlug,
  generateGeoSnippet,
} from "@/lib/mock/data";
import { useAuth, canEdit, canDelete, canPublish } from "@/lib/auth-context";
import { useAdminLocale } from "@/lib/admin-locale";
import { toast } from "sonner";

const CATEGORIES: MedicalCategory[] = ["挂号", "分诊", "问诊", "检查", "用药", "缴费"];
const DIFFICULTIES: DifficultyLevel[] = ["Beginner", "Intermediate", "Advanced"];

const defaultDialog: Partial<MedicalDialog> = {
  title: "",
  slug: "",
  category: "问诊",
  difficulty: "Beginner",
  key_phrases: [],
  doctor_questions: [],
  patient_templates: [],
  full_dialogue: [],
  safety_note: "",
  seo_title: "",
  seo_description: "",
  faq: [],
  geo_snippet: "",
  status: "draft",
};

export default function MedicalDialogsPage() {
  const { user } = useAuth();
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  
  const [dialogs, setDialogs] = useState<MedicalDialog[]>([]);
  const [editingDialog, setEditingDialog] = useState<Partial<MedicalDialog> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "publish" | "archive" | "delete";
    dialog: MedicalDialog | null;
  }>({ open: false, type: "delete", dialog: null });

  useEffect(() => {
    setDialogs(getMedicalDialogs());
  }, []);

  const refreshData = () => setDialogs(getMedicalDialogs());

  const handleCreate = () => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("权限不足", "Permission denied"));
      return;
    }
    setEditingDialog({
      ...defaultDialog,
      key_phrases: [],
      doctor_questions: [],
      patient_templates: [],
      full_dialogue: [],
      faq: [],
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleView = (dialog: MedicalDialog) => {
    setEditingDialog({ ...dialog });
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleEdit = (dialog: MedicalDialog) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("权限不足", "Permission denied"));
      return;
    }
    setEditingDialog({ ...dialog });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (dialog: MedicalDialog) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("权限不足", "Permission denied"));
      return;
    }
    setEditingDialog({
      ...dialog,
      id: undefined,
      title: `${dialog.title} ${t("(副本)", "(Copy)")}`,
      slug: `${dialog.slug}-copy`,
      status: "draft",
      publishedAt: undefined,
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (!editingDialog?.title) {
      toast.error(t("标题为必填项", "Title is required"));
      return;
    }

    const now = new Date().toISOString();
    const isNew = !editingDialog.id;
    const dialogToSave: MedicalDialog = {
      id: editingDialog.id || generateId(),
      title: editingDialog.title || "",
      slug: editingDialog.slug || generateSlug(editingDialog.title || ""),
      category: editingDialog.category || "问诊",
      difficulty: editingDialog.difficulty || "Beginner",
      key_phrases: editingDialog.key_phrases || [],
      doctor_questions: editingDialog.doctor_questions || [],
      patient_templates: editingDialog.patient_templates || [],
      full_dialogue: editingDialog.full_dialogue || [],
      safety_note: editingDialog.safety_note || "",
      seo_title: editingDialog.seo_title || "",
      seo_description: editingDialog.seo_description || "",
      faq: editingDialog.faq || [],
      geo_snippet: editingDialog.geo_snippet || "",
      status: editingDialog.status || "draft",
      createdAt: isNew ? now : (dialogs.find((d) => d.id === editingDialog.id)?.createdAt || now),
      updatedAt: now,
      publishedAt: editingDialog.publishedAt,
      author: user?.name || "Unknown",
    };

    saveMedicalDialog(dialogToSave);
    refreshData();
    setIsDrawerOpen(false);
    setEditingDialog(null);
    toast.success(isNew ? t("医疗对话已创建", "Medical dialog created") : t("医疗对话已更新", "Medical dialog updated"));
  };

  const handleStatusChange = (dialog: MedicalDialog, newStatus: ContentStatus) => {
    if (!user || !canPublish(user.role)) {
      toast.error(t("权限不足", "Permission denied"));
      return;
    }
    const now = new Date().toISOString();
    const updated = {
      ...dialog,
      status: newStatus,
      updatedAt: now,
      publishedAt: newStatus === "published" ? now : dialog.publishedAt,
    };
    saveMedicalDialog(updated);
    refreshData();
    setConfirmDialog({ open: false, type: "delete", dialog: null });
    const statusMap: Record<string, string> = {
      published: t("已发布", "published"),
      archived: t("已归档", "archived"),
      draft: t("已设为草稿", "set to draft"),
    };
    toast.success(t(`医疗对话${statusMap[newStatus]}`, `Medical dialog ${newStatus}`));
  };

  const handleDelete = () => {
    if (confirmDialog.dialog) {
      deleteMedicalDialog(confirmDialog.dialog.id);
      refreshData();
      toast.success(t("医疗对话已删除", "Medical dialog deleted"));
    }
    setConfirmDialog({ open: false, type: "delete", dialog: null });
  };

  const handleGenerateSlug = () => {
    if (editingDialog?.title) {
      setEditingDialog((prev) => ({ ...prev, slug: generateSlug(prev?.title || "") }));
    }
  };

  const handleGenerateGeoSnippet = () => {
    if (editingDialog?.title && editingDialog?.key_phrases) {
      const summary = `Learn essential Chinese medical phrases for ${editingDialog.category} scenarios. This ${editingDialog.difficulty?.toLowerCase()} level dialogue covers ${editingDialog.title}.`;
      setEditingDialog((prev) => ({
        ...prev,
        geo_snippet: generateGeoSnippet(summary, prev?.key_phrases || []),
      }));
    }
  };

  // Doctor questions management
  const handleAddDoctorQuestion = () => {
    setEditingDialog((prev) => ({
      ...prev,
      doctor_questions: [...(prev?.doctor_questions || []), ""],
    }));
  };

  const handleUpdateDoctorQuestion = (index: number, value: string) => {
    setEditingDialog((prev) => {
      const questions = [...(prev?.doctor_questions || [])];
      questions[index] = value;
      return { ...prev, doctor_questions: questions };
    });
  };

  const handleRemoveDoctorQuestion = (index: number) => {
    setEditingDialog((prev) => ({
      ...prev,
      doctor_questions: prev?.doctor_questions?.filter((_, i) => i !== index) || [],
    }));
  };

  // Patient templates management
  const handleAddPatientTemplate = () => {
    setEditingDialog((prev) => ({
      ...prev,
      patient_templates: [...(prev?.patient_templates || []), { template: "", variables: "" }],
    }));
  };

  const handleUpdatePatientTemplate = (index: number, field: keyof PatientTemplate, value: string) => {
    setEditingDialog((prev) => {
      const templates = [...(prev?.patient_templates || [])];
      templates[index] = { ...templates[index], [field]: value };
      return { ...prev, patient_templates: templates };
    });
  };

  const handleRemovePatientTemplate = (index: number) => {
    setEditingDialog((prev) => ({
      ...prev,
      patient_templates: prev?.patient_templates?.filter((_, i) => i !== index) || [],
    }));
  };

  // Full dialogue management
  const handleAddDialogueLine = () => {
    setEditingDialog((prev) => ({
      ...prev,
      full_dialogue: [...(prev?.full_dialogue || []), { speaker: "Doctor", line: "" }],
    }));
  };

  const handleUpdateDialogueLine = (index: number, field: keyof DialogLine, value: string) => {
    setEditingDialog((prev) => {
      const lines = [...(prev?.full_dialogue || [])];
      lines[index] = { ...lines[index], [field]: value };
      return { ...prev, full_dialogue: lines };
    });
  };

  const handleRemoveDialogueLine = (index: number) => {
    setEditingDialog((prev) => ({
      ...prev,
      full_dialogue: prev?.full_dialogue?.filter((_, i) => i !== index) || [],
    }));
  };

  // FAQ management
  const handleAddFAQ = () => {
    setEditingDialog((prev) => ({
      ...prev,
      faq: [...(prev?.faq || []), { question: "", answer: "" }],
    }));
  };

  const handleUpdateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    setEditingDialog((prev) => {
      const faqs = [...(prev?.faq || [])];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, faq: faqs };
    });
  };

  const handleRemoveFAQ = (index: number) => {
    setEditingDialog((prev) => ({
      ...prev,
      faq: prev?.faq?.filter((_, i) => i !== index) || [],
    }));
  };

  const columns: Column<MedicalDialog>[] = [
    {
      key: "title",
      label: t("标题", "Title"),
      sortable: true,
      render: (dialog) => (
        <div>
          <p className="font-medium">{dialog.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs bg-secondary/50">
              {dialog.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {dialog.full_dialogue.length} {t("行", "lines")}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "difficulty",
      label: t("难度", "Level"),
      sortable: true,
      render: (dialog) => (
        <Badge
          variant="outline"
          className={
            dialog.difficulty === "Beginner"
              ? "bg-success/10 text-success border-success/30"
              : dialog.difficulty === "Intermediate"
                ? "bg-warning/10 text-warning border-warning/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
          }
        >
          {dialog.difficulty === "Beginner" ? t("初级", "Beginner") : dialog.difficulty === "Intermediate" ? t("中级", "Intermediate") : t("高级", "Advanced")}
        </Badge>
      ),
    },
    {
      key: "status",
      label: t("状态", "Status"),
      render: (dialog) => <StatusBadge status={dialog.status} />,
    },
    {
      key: "updatedAt",
      label: t("更新时间", "Updated"),
      sortable: true,
      render: (dialog) =>
        new Date(dialog.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "author",
      label: t("作者", "Owner"),
      render: (dialog) => <span className="text-muted-foreground">{dialog.author}</span>,
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
    {
      key: "difficulty",
      label: t("难度", "Difficulty"),
      options: DIFFICULTIES.map((d) => ({
        value: d,
        label: d === "Beginner" ? t("初级", "Beginner") : d === "Intermediate" ? t("中级", "Intermediate") : t("高级", "Advanced")
      })),
    },
    {
      key: "category",
      label: t("分类", "Category"),
      options: CATEGORIES.map((c) => ({ value: c, label: c })),
    },
  ];

  const renderActions = (dialog: MedicalDialog) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-border/50 rounded-xl">
        <DropdownMenuItem onClick={() => handleView(dialog)}>
          <Eye className="mr-2 h-4 w-4" />
          {t("查看", "View")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(dialog)} disabled={!user || !canEdit(user.role)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("编辑", "Edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicate(dialog)} disabled={!user || !canEdit(user.role)}>
          <Copy className="mr-2 h-4 w-4" />
          {t("复制", "Duplicate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        {dialog.status === "draft" && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "publish", dialog })}
            disabled={!user || !canPublish(user.role)}
          >
            <Send className="mr-2 h-4 w-4" />
            {t("发布", "Publish")}
          </DropdownMenuItem>
        )}
        {dialog.status !== "archived" && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "archive", dialog })}
            disabled={!user || !canPublish(user.role)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {t("归档", "Archive")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem
          onClick={() => setConfirmDialog({ open: true, type: "delete", dialog })}
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
          <h1 className="text-2xl font-bold text-foreground">{t("医疗对话", "Medical Dialogs")}</h1>
          <p className="text-muted-foreground">{t("管理医疗对话场景", "Manage medical conversation scenarios")}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-xl bg-primary hover:bg-primary/90"
          disabled={!user || !canEdit(user.role)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("新建对话", "New Dialog")}
        </Button>
      </div>

      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="pt-6">
          <DataTable
            data={dialogs}
            columns={columns}
            searchKey="title"
            searchPlaceholder={t("搜索对话...", "Search dialogs...")}
            filters={filters}
            renderActions={renderActions}
          />
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <ContentDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={isViewMode ? t("查看对话", "View Dialog") : editingDialog?.id ? t("编辑对话", "Edit Dialog") : t("新建对话", "New Dialog")}
        description={isViewMode ? t("查看对话详情", "View dialog details") : t("填写对话详情", "Fill in the dialog details below")}
        onSave={handleSave}
        onCancel={() => {
          setIsDrawerOpen(false);
          setEditingDialog(null);
        }}
        isNew={!editingDialog?.id}
        disabled={isViewMode}
      >
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50 rounded-xl">
            <TabsTrigger value="basic" className="rounded-lg text-xs">{t("基本", "Basic")}</TabsTrigger>
            <TabsTrigger value="content" className="rounded-lg text-xs">{t("内容", "Content")}</TabsTrigger>
            <TabsTrigger value="dialogue" className="rounded-lg text-xs">{t("对话", "Dialogue")}</TabsTrigger>
            <TabsTrigger value="seo" className="rounded-lg text-xs">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("标题", "Title")} *</Label>
              <Input
                value={editingDialog?.title || ""}
                onChange={(e) => setEditingDialog((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t("例如：挂号 - Hospital Registration", "e.g., 挂号 - Hospital Registration")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("别名", "Slug")}</Label>
              <div className="flex gap-2">
                <Input
                  value={editingDialog?.slug || ""}
                  onChange={(e) => setEditingDialog((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder={t("对话别名", "dialog-slug")}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("分类", "Category")}</Label>
                <Select
                  value={editingDialog?.category || "问诊"}
                  onValueChange={(value) => setEditingDialog((prev) => ({ ...prev, category: value as MedicalCategory }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50 rounded-xl">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("难度", "Difficulty")}</Label>
                <Select
                  value={editingDialog?.difficulty || "Beginner"}
                  onValueChange={(value) => setEditingDialog((prev) => ({ ...prev, difficulty: value as DifficultyLevel }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50 rounded-xl">
                    {DIFFICULTIES.map((diff) => (
                      <SelectItem key={diff} value={diff}>
                        {diff === "Beginner" ? t("初级", "Beginner") : diff === "Intermediate" ? t("中级", "Intermediate") : t("高级", "Advanced")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("状态", "Status")}</Label>
              <Select
                value={editingDialog?.status || "draft"}
                onValueChange={(value) => setEditingDialog((prev) => ({ ...prev, status: value as ContentStatus }))}
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
              <Label>{t("关键短语", "Key Phrases")}</Label>
              <ChipInput
                value={editingDialog?.key_phrases || []}
                onChange={(key_phrases) => setEditingDialog((prev) => ({ ...prev, key_phrases }))}
                placeholder={t("添加关键短语 (例如：挂号)...", "Add key phrases (e.g., 挂号)...")}
                disabled={isViewMode}
              />
            </div>

            {/* Safety Note */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                {t("安全提示 (可选)", "Safety Note (Optional)")}
              </Label>
              <Textarea
                value={editingDialog?.safety_note || ""}
                onChange={(e) => setEditingDialog((prev) => ({ ...prev, safety_note: e.target.value }))}
                placeholder={t("例如：如有急症请直接前往急诊室或拨打120急救电话", "e.g., 如有急症请直接前往急诊室或拨打120急救电话")}
                className="bg-warning/10 border-warning/30 rounded-xl min-h-[60px]"
                disabled={isViewMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Doctor Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("医生问题", "Doctor Questions")} ({editingDialog?.doctor_questions?.length || 0})</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddDoctorQuestion} className="rounded-xl bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("添加", "Add")}
                  </Button>
                )}
              </div>
              {editingDialog?.doctor_questions?.map((q, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={q}
                    onChange={(e) => handleUpdateDoctorQuestion(index, e.target.value)}
                    placeholder={t("医生问题（中文）...", "Doctor question in Chinese...")}
                    className="bg-secondary/50 border-border/50 rounded-xl flex-1"
                    disabled={isViewMode}
                  />
                  {!isViewMode && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => handleRemoveDoctorQuestion(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Patient Templates */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label>{t("患者模板", "Patient Templates")} ({editingDialog?.patient_templates?.length || 0})</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddPatientTemplate} className="rounded-xl bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("添加", "Add")}
                  </Button>
                )}
              </div>
              {editingDialog?.patient_templates?.map((tpl, index) => (
                <Card key={index} className="glass-card border-border/50 rounded-xl p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={tpl.template}
                          onChange={(e) => handleUpdatePatientTemplate(index, "template", e.target.value)}
                          placeholder={t("模板：我想挂{科室}的号", "Template: 我想挂{科室}的号")}
                          className="bg-secondary/30 border-border/50 rounded-lg text-sm"
                          disabled={isViewMode}
                        />
                        <Input
                          value={tpl.variables}
                          onChange={(e) => handleUpdatePatientTemplate(index, "variables", e.target.value)}
                          placeholder={t("变量：科室: 内科/外科/眼科", "Variables: 科室: 内科/外科/眼科")}
                          className="bg-secondary/30 border-border/50 rounded-lg text-sm text-muted-foreground"
                          disabled={isViewMode}
                        />
                      </div>
                      {!isViewMode && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemovePatientTemplate(index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dialogue" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>{t("完整对话", "Full Dialogue")} ({editingDialog?.full_dialogue?.length || 0} {t("行", "lines")})</Label>
              {!isViewMode && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddDialogueLine} className="rounded-xl bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("添加台词", "Add Line")}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {editingDialog?.full_dialogue?.map((line, index) => (
                <div key={index} className="flex items-start gap-2 group">
                  <div className="flex items-center gap-1 pt-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  </div>
                  <Select
                    value={line.speaker}
                    onValueChange={(value) => handleUpdateDialogueLine(index, "speaker", value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className="w-28 bg-secondary/50 border-border/50 rounded-lg h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border/50 rounded-xl">
                      <SelectItem value="Doctor">{t("医生", "Doctor")}</SelectItem>
                      <SelectItem value="Patient">{t("患者", "Patient")}</SelectItem>
                      <SelectItem value="Nurse">{t("护士", "Nurse")}</SelectItem>
                      <SelectItem value="Receptionist">{t("接待员", "Receptionist")}</SelectItem>
                      <SelectItem value="Pharmacist">{t("药剂师", "Pharmacist")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={line.line}
                    onChange={(e) => handleUpdateDialogueLine(index, "line", e.target.value)}
                    placeholder={t("对话台词（中文）...", "Dialogue line in Chinese...")}
                    className="bg-secondary/50 border-border/50 rounded-xl flex-1"
                    disabled={isViewMode}
                  />
                  {!isViewMode && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveDialogueLine(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {(!editingDialog?.full_dialogue || editingDialog.full_dialogue.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-xl">
                <p>{t("暂无对话台词。", "No dialogue lines yet.")}</p>
                {!isViewMode && <p className="text-sm mt-1">{t('点击"添加台词"开始创建对话。', 'Click "Add Line" to start building your dialogue.')}</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("SEO 标题", "SEO Title")}</Label>
              <Input
                value={editingDialog?.seo_title || ""}
                onChange={(e) => setEditingDialog((prev) => ({ ...prev, seo_title: e.target.value }))}
                placeholder={t("SEO 优化标题...", "SEO optimized title...")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("SEO 描述", "SEO Description")}</Label>
              <Textarea
                value={editingDialog?.seo_description || ""}
                onChange={(e) => setEditingDialog((prev) => ({ ...prev, seo_description: e.target.value }))}
                placeholder={t("Meta 描述...", "Meta description...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("GEO 片段", "GEO Snippet")}</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateGeoSnippet} className="rounded-xl bg-transparent">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("自动生成", "Auto Generate")}
                  </Button>
                )}
              </div>
              <Textarea
                value={editingDialog?.geo_snippet || ""}
                onChange={(e) => setEditingDialog((prev) => ({ ...prev, geo_snippet: e.target.value }))}
                placeholder={t("地理搜索片段...", "Geographic search snippet...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
              <p className="text-xs text-muted-foreground">{editingDialog?.geo_snippet?.length || 0}/200 {t("字符", "characters")}</p>
            </div>

            {/* FAQ Section */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label>{t("常见问题", "FAQ")} ({editingDialog?.faq?.length || 0} {t("项", "items")})</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFAQ} className="rounded-xl bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("添加问题", "Add FAQ")}
                  </Button>
                )}
              </div>

              {editingDialog?.faq?.map((item, index) => (
                <Card key={index} className="glass-card border-border/50 rounded-xl p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Input
                        value={item.question}
                        onChange={(e) => handleUpdateFAQ(index, "question", e.target.value)}
                        placeholder={t("问题", "Question")}
                        className="bg-secondary/30 border-border/50 rounded-lg h-8 text-sm flex-1"
                        disabled={isViewMode}
                      />
                      {!isViewMode && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleRemoveFAQ(index)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      value={item.answer}
                      onChange={(e) => handleUpdateFAQ(index, "answer", e.target.value)}
                      placeholder={t("答案", "Answer")}
                      className="bg-secondary/30 border-border/50 rounded-lg text-sm min-h-[60px]"
                      disabled={isViewMode}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </ContentDrawer>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "publish"
                ? t("发布对话", "Publish Dialog")
                : confirmDialog.type === "archive"
                  ? t("归档对话", "Archive Dialog")
                  : t("删除对话", "Delete Dialog")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmDialog.type === "publish"
                ? t(`确定要发布 "${confirmDialog.dialog?.title}"？`, `Publish "${confirmDialog.dialog?.title}"?`)
                : confirmDialog.type === "archive"
                  ? t(`确定要归档 "${confirmDialog.dialog?.title}"？`, `Archive "${confirmDialog.dialog?.title}"?`)
                  : t(`确定要删除 "${confirmDialog.dialog?.title}"？此操作无法撤销。`, `Delete "${confirmDialog.dialog?.title}"? This cannot be undone.`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: "delete", dialog: null })} className="rounded-xl">
              {t("取消", "Cancel")}
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.type === "delete") handleDelete();
                else if (confirmDialog.dialog) handleStatusChange(confirmDialog.dialog, confirmDialog.type === "publish" ? "published" : "archived");
              }}
              variant={confirmDialog.type === "delete" ? "destructive" : "default"}
              className="rounded-xl"
            >
              {confirmDialog.type === "publish"
                ? t("发布", "Publish")
                : confirmDialog.type === "archive"
                  ? t("归档", "Archive")
                  : t("删除", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
