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
  CheckCircle,
  XCircle,
  Clock,
  History,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { EmptyDataState, EmptyFilterState } from "@/components/admin/empty-state";
import { getLessons, saveLesson, deleteLesson, generateId } from "@/lib/mock/storage";
import {
  type Lesson,
  type ContentStatus,
  type HSKLevel,
  type QuizQuestion,
  type ReviewRecord,
  generateSlug,
  generateGeoSnippet,
} from "@/lib/mock/data";
import {
  useAuth,
  canEdit,
  canDelete,
  canPublish,
  canSubmitForReview,
  canApproveReview,
  canArchive,
} from "@/lib/auth-context";
import { toast } from "sonner";

const HSK_LEVELS: HSKLevel[] = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"];

const defaultLesson: Partial<Lesson> = {
  title: "",
  slug: "",
  level: "HSK1",
  tags: [],
  summary: "",
  lesson_content: "",
  key_vocab: [],
  quiz_bank: [],
  seo_title: "",
  seo_description: "",
  geo_snippet: "",
  status: "draft",
};

// Review records storage key
const REVIEW_RECORDS_KEY = "admin_lesson_reviews";

function getReviewRecords(): Record<string, ReviewRecord[]> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(REVIEW_RECORDS_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function saveReviewRecord(lessonId: string, record: ReviewRecord) {
  const records = getReviewRecords();
  if (!records[lessonId]) records[lessonId] = [];
  records[lessonId].unshift(record);
  localStorage.setItem(REVIEW_RECORDS_KEY, JSON.stringify(records));
}

export default function LessonsPage() {
  const { user } = useAuth();
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLessonId, setHistoryLessonId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "publish" | "archive" | "delete" | "submit_review" | "approve" | "reject";
    lesson: Lesson | null;
  }>({ open: false, type: "delete", lesson: null });

  useEffect(() => {
    setLessons(getLessons());
  }, []);

  const refreshData = () => setLessons(getLessons());

  // Handlers
  const handleCreate = () => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "You don't have permission"), { description: t("只有管理员和编辑者可以创建内容。", "Only admins and editors can create content.") });
      return;
    }
    setEditingLesson({ ...defaultLesson, quiz_bank: [], tags: [], key_vocab: [] });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleView = (lesson: Lesson) => {
    setEditingLesson({ ...lesson });
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleEdit = (lesson: Lesson) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "You don't have permission"), { description: t("只有管理员和编辑者可以编辑内容。", "Only admins and editors can edit content.") });
      return;
    }
    setEditingLesson({ ...lesson });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (lesson: Lesson) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      return;
    }
    setEditingLesson({
      ...lesson,
      id: undefined,
      title: `${lesson.title} (Copy)`,
      slug: `${lesson.slug}-copy`,
      status: "draft",
      publishedAt: undefined,
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (!editingLesson?.title) {
      toast.error(t("标题不能为空", "Title is required"));
      return;
    }

    const now = new Date().toISOString();
    const isNew = !editingLesson.id;
    const lessonId = editingLesson.id || generateId();

    const lessonToSave: Lesson = {
      id: lessonId,
      title: editingLesson.title || "",
      slug: editingLesson.slug || generateSlug(editingLesson.title || ""),
      level: editingLesson.level || "HSK1",
      tags: editingLesson.tags || [],
      summary: editingLesson.summary || "",
      lesson_content: editingLesson.lesson_content || "",
      key_vocab: editingLesson.key_vocab || [],
      quiz_bank: editingLesson.quiz_bank || [],
      seo_title: editingLesson.seo_title || "",
      seo_description: editingLesson.seo_description || "",
      geo_snippet: editingLesson.geo_snippet || "",
      status: editingLesson.status || "draft",
      createdAt: isNew ? now : lessons.find((l) => l.id === editingLesson.id)?.createdAt || now,
      updatedAt: now,
      publishedAt: editingLesson.publishedAt,
      author: user?.name || "Unknown",
    };

    saveLesson(lessonToSave);

    // Save review record
    saveReviewRecord(lessonId, {
      id: generateId(),
      action: isNew ? "created" : "edited",
      fromStatus: isNew ? null : (lessons.find((l) => l.id === lessonId)?.status || "draft"),
      toStatus: lessonToSave.status,
      user: user?.name || "Unknown",
      timestamp: now,
    });

    refreshData();
    setIsDrawerOpen(false);
    setEditingLesson(null);
    toast.success(isNew ? t("课程已创建", "Lesson created") : t("课程已更新", "Lesson updated"));
  };

  const handleSubmitForReview = () => {
    if (!confirmDialog.lesson || !user) return;

    if (!canSubmitForReview(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      setConfirmDialog({ open: false, type: "delete", lesson: null });
      return;
    }

    const now = new Date().toISOString();
    const updated: Lesson = {
      ...confirmDialog.lesson,
      status: "in_review",
      updatedAt: now,
    };

    saveLesson(updated);
    saveReviewRecord(confirmDialog.lesson.id, {
      id: generateId(),
      action: "submitted_for_review",
      fromStatus: confirmDialog.lesson.status,
      toStatus: "in_review",
      user: user.name,
      timestamp: now,
    });

    refreshData();
    setConfirmDialog({ open: false, type: "delete", lesson: null });
    toast.success(t("已提交审核", "Submitted for review"), { description: t("管理员将审核您的内容。", "An admin will review your content.") });
  };

  const handleApproveAndPublish = () => {
    if (!confirmDialog.lesson || !user) return;

    if (!canApproveReview(user.role)) {
      toast.error(t("没有权限", "You don't have permission"), { description: t("只有管理员可以审批内容。", "Only admins can approve reviews.") });
      setConfirmDialog({ open: false, type: "delete", lesson: null });
      return;
    }

    const now = new Date().toISOString();
    const updated: Lesson = {
      ...confirmDialog.lesson,
      status: "published",
      updatedAt: now,
      publishedAt: now,
    };

    saveLesson(updated);
    saveReviewRecord(confirmDialog.lesson.id, {
      id: generateId(),
      action: "approved",
      fromStatus: confirmDialog.lesson.status,
      toStatus: "published",
      user: user.name,
      timestamp: now,
    });

    refreshData();
    setConfirmDialog({ open: false, type: "delete", lesson: null });
    toast.success(t("已发布", "Published"), { description: t("内容已上线。", "Content is now live.") });
  };

  const handleReject = () => {
    if (!confirmDialog.lesson || !user) return;

    if (!canApproveReview(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      setConfirmDialog({ open: false, type: "delete", lesson: null });
      return;
    }

    const now = new Date().toISOString();
    const updated: Lesson = {
      ...confirmDialog.lesson,
      status: "draft",
      updatedAt: now,
    };

    saveLesson(updated);
    saveReviewRecord(confirmDialog.lesson.id, {
      id: generateId(),
      action: "rejected",
      fromStatus: confirmDialog.lesson.status,
      toStatus: "draft",
      user: user.name,
      comment: "Needs revision",
      timestamp: now,
    });

    refreshData();
    setConfirmDialog({ open: false, type: "delete", lesson: null });
    toast.info(t("已退回修改", "Sent back for revision"));
  };

  const handleArchive = () => {
    if (!confirmDialog.lesson || !user) return;

    if (!canArchive(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      setConfirmDialog({ open: false, type: "delete", lesson: null });
      return;
    }

    const now = new Date().toISOString();
    const updated: Lesson = {
      ...confirmDialog.lesson,
      status: "archived",
      updatedAt: now,
    };

    saveLesson(updated);
    saveReviewRecord(confirmDialog.lesson.id, {
      id: generateId(),
      action: "archived",
      fromStatus: confirmDialog.lesson.status,
      toStatus: "archived",
      user: user.name,
      timestamp: now,
    });

    refreshData();
    setConfirmDialog({ open: false, type: "delete", lesson: null });
    toast.success(t("已归档", "Archived"));
  };

  const handleDelete = () => {
    if (!confirmDialog.lesson || !user) return;

    if (!canDelete(user.role)) {
      toast.error(t("没有权限", "You don't have permission"), { description: t("只有管理员可以删除内容。", "Only admins can delete content.") });
      setConfirmDialog({ open: false, type: "delete", lesson: null });
      return;
    }

    deleteLesson(confirmDialog.lesson.id);
    refreshData();
    setConfirmDialog({ open: false, type: "delete", lesson: null });
    toast.success(t("课程已删除", "Lesson deleted"));
  };

  const handleViewHistory = (lessonId: string) => {
    setHistoryLessonId(lessonId);
    setIsHistoryOpen(true);
  };

  const handleGenerateSlug = () => {
    if (editingLesson?.title) {
      setEditingLesson((prev) => ({
        ...prev,
        slug: generateSlug(prev?.title || ""),
      }));
    }
  };

  const handleGenerateGeoSnippet = () => {
    if (editingLesson?.summary && editingLesson?.key_vocab) {
      setEditingLesson((prev) => ({
        ...prev,
        geo_snippet: generateGeoSnippet(prev?.summary || "", prev?.key_vocab || []),
      }));
    }
  };

  // Quiz bank management
  const handleAddQuiz = () => {
    const newQuiz: QuizQuestion = {
      id: generateId(),
      type: "multiple_choice",
      question: "",
      options: ["", "", "", ""],
      answer: "",
    };
    setEditingLesson((prev) => ({
      ...prev,
      quiz_bank: [...(prev?.quiz_bank || []), newQuiz],
    }));
  };

  const handleUpdateQuiz = (index: number, field: keyof QuizQuestion, value: unknown) => {
    setEditingLesson((prev) => {
      const quizzes = [...(prev?.quiz_bank || [])];
      quizzes[index] = { ...quizzes[index], [field]: value };
      return { ...prev, quiz_bank: quizzes };
    });
  };

  const handleRemoveQuiz = (index: number) => {
    setEditingLesson((prev) => ({
      ...prev,
      quiz_bank: prev?.quiz_bank?.filter((_, i) => i !== index) || [],
    }));
  };

  // Table columns
  const columns: Column<Lesson>[] = [
    {
      key: "title",
      label: t("标题", "Title"),
      sortable: true,
      render: (lesson) => (
        <div>
          <p className="font-medium">{lesson.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{lesson.summary}</p>
        </div>
      ),
    },
    {
      key: "level",
      label: t("等级", "Level"),
      sortable: true,
      render: (lesson) => (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          {lesson.level}
        </Badge>
      ),
    },
    {
      key: "status",
      label: t("状态", "Status"),
      render: (lesson) => <StatusBadge status={lesson.status} />,
    },
    {
      key: "updatedAt",
      label: t("更新时间", "Updated"),
      sortable: true,
      render: (lesson) =>
        new Date(lesson.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "author",
      label: t("作者", "Owner"),
      render: (lesson) => <span className="text-muted-foreground">{lesson.author}</span>,
    },
  ];

  const filters: FilterOption[] = [
    {
      key: "status",
      label: t("状态", "Status"),
      options: [
        { value: "draft", label: t("草稿", "Draft") },
        { value: "in_review", label: t("审核中", "In Review") },
        { value: "published", label: t("已发布", "Published") },
        { value: "archived", label: t("已归档", "Archived") },
      ],
    },
    {
      key: "level",
      label: t("等级", "Level"),
      options: HSK_LEVELS.map((level) => ({ value: level, label: level })),
    },
  ];

  const renderActions = (lesson: Lesson) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-border/50 rounded-xl">
        <DropdownMenuItem onClick={() => handleView(lesson)}>
          <Eye className="mr-2 h-4 w-4" />
          {t("查看", "View")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleEdit(lesson)}
          disabled={!user || !canEdit(user.role)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t("编辑", "Edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDuplicate(lesson)}
          disabled={!user || !canEdit(user.role)}
        >
          <Copy className="mr-2 h-4 w-4" />
          {t("复制", "Duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleViewHistory(lesson.id)}>
          <History className="mr-2 h-4 w-4" />
          {t("历史", "History")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />

        {/* Workflow Actions */}
        {lesson.status === "draft" && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "submit_review", lesson })}
            disabled={!user || !canSubmitForReview(user.role)}
          >
            <Send className="mr-2 h-4 w-4" />
            {t("提交审核", "Submit for Review")}
          </DropdownMenuItem>
        )}
        {lesson.status === "in_review" && (
          <>
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, type: "approve", lesson })}
              disabled={!user || !canApproveReview(user.role)}
              className="text-success focus:text-success"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("批准并发布", "Approve & Publish")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, type: "reject", lesson })}
              disabled={!user || !canApproveReview(user.role)}
              className="text-warning focus:text-warning"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t("拒绝", "Reject")}
            </DropdownMenuItem>
          </>
        )}
        {(lesson.status === "published" || lesson.status === "draft") && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "archive", lesson })}
            disabled={!user || !canArchive(user.role)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {t("归档", "Archive")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem
          onClick={() => setConfirmDialog({ open: true, type: "delete", lesson })}
          className="text-destructive focus:text-destructive"
          disabled={!user || !canDelete(user.role)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("删除", "Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // History records for selected lesson
  const historyRecords = historyLessonId ? getReviewRecords()[historyLessonId] || [] : [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4" />;
      case "edited":
        return <Pencil className="h-4 w-4" />;
      case "submitted_for_review":
        return <Send className="h-4 w-4" />;
      case "approved":
      case "published":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-warning" />;
      case "archived":
        return <Archive className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "created":
        return t("已创建", "Created");
      case "edited":
        return t("已编辑", "Edited");
      case "submitted_for_review":
        return t("已提交审核", "Submitted for Review");
      case "approved":
        return t("已批准并发布", "Approved & Published");
      case "rejected":
        return t("已拒绝", "Rejected");
      case "published":
        return t("已发布", "Published");
      case "archived":
        return t("已归档", "Archived");
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("课程", "Lessons")}</h1>
          <p className="text-muted-foreground">{t("管理您的中文课程", "Manage your Chinese language lessons")}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-xl bg-primary hover:bg-primary/90"
          disabled={!user || !canEdit(user.role)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("新建课程", "New Lesson")}
        </Button>
      </div>

      {/* Data Table */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="pt-6">
          {lessons.length === 0 ? (
            <EmptyDataState
              contentType="Lesson"
              onAction={handleCreate}
              actionDisabled={!user || !canEdit(user.role)}
            />
          ) : (
            <DataTable
              data={lessons}
              columns={columns}
              searchKey="title"
              searchPlaceholder={t("搜索课程...", "Search lessons...")}
              filters={filters}
              renderActions={renderActions}
              emptyState={<EmptyFilterState />}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <ContentDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={isViewMode ? t("查看课程", "View Lesson") : editingLesson?.id ? t("编辑课程", "Edit Lesson") : t("新建课程", "New Lesson")}
        description={isViewMode ? t("查看课程详情", "View lesson details") : t("请填写以下课程信息", "Fill in the lesson details below")}
        onSave={handleSave}
        onCancel={() => {
          setIsDrawerOpen(false);
          setEditingLesson(null);
        }}
        isNew={!editingLesson?.id}
        disabled={isViewMode}
      >
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-xl">
            <TabsTrigger value="content" className="rounded-lg">
              {t("内容", "Content")}
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-lg">
              {t("题库", "Quiz Bank")}
            </TabsTrigger>
            <TabsTrigger value="seo" className="rounded-lg">
              SEO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>{t("标题", "Title")} *</Label>
              <Input
                value={editingLesson?.title || ""}
                onChange={(e) => setEditingLesson((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t("输入课程标题", "Enter lesson title")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>{t("别名", "Slug")}</Label>
              <div className="flex gap-2">
                <Input
                  value={editingLesson?.slug || ""}
                  onChange={(e) => setEditingLesson((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder={t("课程别名", "lesson-slug")}
                  className="bg-secondary/50 border-border/50 rounded-xl flex-1"
                  disabled={isViewMode}
                />
                {!isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateSlug}
                    className="rounded-xl bg-transparent"
                  >
                    {t("自动", "Auto")}
                  </Button>
                )}
              </div>
            </div>

            {/* Level & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("等级", "Level")}</Label>
                <Select
                  value={editingLesson?.level || "HSK1"}
                  onValueChange={(value) =>
                    setEditingLesson((prev) => ({ ...prev, level: value as HSKLevel }))
                  }
                  disabled={isViewMode}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50 rounded-xl">
                    {HSK_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("状态", "Status")}</Label>
                <div className="h-10 flex items-center">
                  <StatusBadge status={editingLesson?.status || "draft"} />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>{t("标签", "Tags")}</Label>
              <ChipInput
                value={editingLesson?.tags || []}
                onChange={(tags) => setEditingLesson((prev) => ({ ...prev, tags }))}
                placeholder={t("添加标签...", "Add tags...")}
                disabled={isViewMode}
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label>{t("摘要", "Summary")}</Label>
              <Textarea
                value={editingLesson?.summary || ""}
                onChange={(e) =>
                  setEditingLesson((prev) => ({ ...prev, summary: e.target.value }))
                }
                placeholder={t("简要课程摘要...", "Brief lesson summary...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
            </div>

            {/* Lesson Content */}
            <div className="space-y-2">
              <Label>{t("课程内容 (Markdown)", "Lesson Content (Markdown)")}</Label>
              <Textarea
                value={editingLesson?.lesson_content || ""}
                onChange={(e) =>
                  setEditingLesson((prev) => ({ ...prev, lesson_content: e.target.value }))
                }
                placeholder={t("# 课程标题\n\n在这里使用 markdown 编写课程内容...", "# Lesson Title\n\nWrite your lesson content here using markdown...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[200px] font-mono text-sm"
                disabled={isViewMode}
              />
            </div>

            {/* Key Vocabulary */}
            <div className="space-y-2">
              <Label>{t("重点词汇", "Key Vocabulary")}</Label>
              <ChipInput
                value={editingLesson?.key_vocab || []}
                onChange={(key_vocab) => setEditingLesson((prev) => ({ ...prev, key_vocab }))}
                placeholder={t("添加词汇 (如: 你好)...", "Add vocabulary (e.g., 你好)...")}
                disabled={isViewMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>{t(`题库 (${editingLesson?.quiz_bank?.length || 0} 道题)`, `Quiz Bank (${editingLesson?.quiz_bank?.length || 0} questions)`)}</Label>
              {!isViewMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuiz}
                  className="rounded-xl bg-transparent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("添加题目", "Add Question")}
                </Button>
              )}
            </div>

            {editingLesson?.quiz_bank?.map((quiz, index) => (
              <Card key={quiz.id} className="glass-card border-border/50 rounded-xl p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {quiz.type === "multiple_choice"
                        ? t("多项选择", "Multiple Choice")
                        : quiz.type === "tone"
                          ? t("声调", "Tone")
                          : t("听力", "Listening")}
                    </Badge>
                    {!isViewMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveQuiz(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">{t("题目类型", "Question Type")}</Label>
                    <Select
                      value={quiz.type}
                      onValueChange={(value) =>
                        handleUpdateQuiz(index, "type", value as QuizQuestion["type"])
                      }
                      disabled={isViewMode}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border/50 rounded-lg h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50 rounded-xl">
                        <SelectItem value="multiple_choice">{t("多项选择", "Multiple Choice")}</SelectItem>
                        <SelectItem value="tone">{t("声调", "Tone")}</SelectItem>
                        <SelectItem value="listening">{t("听力", "Listening")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">{t("题目", "Question")}</Label>
                    <Input
                      value={quiz.question}
                      onChange={(e) => handleUpdateQuiz(index, "question", e.target.value)}
                      placeholder={t("输入题目...", "Enter question...")}
                      className="bg-secondary/50 border-border/50 rounded-lg h-8 text-sm"
                      disabled={isViewMode}
                    />
                  </div>

                  {quiz.type === "multiple_choice" && (
                    <div className="space-y-2">
                      <Label className="text-xs">{t("选项", "Options")}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {quiz.options?.map((opt, optIdx) => (
                          <Input
                            key={optIdx}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(quiz.options || [])];
                              newOpts[optIdx] = e.target.value;
                              handleUpdateQuiz(index, "options", newOpts);
                            }}
                            placeholder={t(`选项 ${optIdx + 1}`, `Option ${optIdx + 1}`)}
                            className="bg-secondary/50 border-border/50 rounded-lg h-8 text-sm"
                            disabled={isViewMode}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">{t("正确答案", "Correct Answer")}</Label>
                    <Input
                      value={quiz.answer}
                      onChange={(e) => handleUpdateQuiz(index, "answer", e.target.value)}
                      placeholder={t("输入正确答案...", "Enter correct answer...")}
                      className="bg-secondary/50 border-border/50 rounded-lg h-8 text-sm"
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("SEO 标题", "SEO Title")}</Label>
              <Input
                value={editingLesson?.seo_title || ""}
                onChange={(e) =>
                  setEditingLesson((prev) => ({ ...prev, seo_title: e.target.value }))
                }
                placeholder={t("SEO 优化标题...", "SEO optimized title...")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("SEO 描述", "SEO Description")}</Label>
              <Textarea
                value={editingLesson?.seo_description || ""}
                onChange={(e) =>
                  setEditingLesson((prev) => ({ ...prev, seo_description: e.target.value }))
                }
                placeholder={t("搜索引擎元描述...", "Meta description for search engines...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("GEO 摘要", "GEO Snippet")}</Label>
                {!isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateGeoSnippet}
                    className="rounded-xl bg-transparent"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("自动生成", "Auto-generate")}
                  </Button>
                )}
              </div>
              <Textarea
                value={editingLesson?.geo_snippet || ""}
                onChange={(e) =>
                  setEditingLesson((prev) => ({ ...prev, geo_snippet: e.target.value }))
                }
                placeholder={t("AI 搜索富摘要...", "Rich snippet for AI-powered search...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[100px]"
                disabled={isViewMode}
              />
            </div>
          </TabsContent>
        </Tabs>
      </ContentDrawer>

      {/* Confirmation Dialogs */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, type: "delete", lesson: null })
        }
      >
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {confirmDialog.type === "delete" && t("删除课程", "Delete Lesson")}
              {confirmDialog.type === "archive" && t("归档课程", "Archive Lesson")}
              {confirmDialog.type === "submit_review" && t("提交审核", "Submit for Review")}
              {confirmDialog.type === "approve" && t("批准并发布", "Approve & Publish")}
              {confirmDialog.type === "reject" && t("拒绝提交", "Reject Submission")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmDialog.type === "delete" &&
                t("此操作无法撤销。课程将被永久删除。", "This action cannot be undone. The lesson will be permanently deleted.")}
              {confirmDialog.type === "archive" &&
                t("这将归档课程。稍后可以恢复。", "This will archive the lesson. It can be restored later.")}
              {confirmDialog.type === "submit_review" &&
                t("这将提交课程进行管理员审核。审核完成前您将无法编辑。", "This will submit the lesson for admin review. You won't be able to edit until it's reviewed.")}
              {confirmDialog.type === "approve" &&
                t("这将批准课程并立即发布。", "This will approve the lesson and publish it immediately.")}
              {confirmDialog.type === "reject" &&
                t("这将把课程退回草稿状态进行修改。", "This will send the lesson back to draft status for revision.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: "delete", lesson: null })}
              className="rounded-xl bg-transparent"
            >
              {t("取消", "Cancel")}
            </Button>
            {confirmDialog.type === "delete" && (
              <Button onClick={handleDelete} variant="destructive" className="rounded-xl">
                {t("删除", "Delete")}
              </Button>
            )}
            {confirmDialog.type === "archive" && (
              <Button onClick={handleArchive} variant="secondary" className="rounded-xl">
                {t("归档", "Archive")}
              </Button>
            )}
            {confirmDialog.type === "submit_review" && (
              <Button onClick={handleSubmitForReview} className="rounded-xl bg-primary">
                {t("提交审核", "Submit for Review")}
              </Button>
            )}
            {confirmDialog.type === "approve" && (
              <Button onClick={handleApproveAndPublish} className="rounded-xl bg-success text-success-foreground hover:bg-success/90">
                {t("批准并发布", "Approve & Publish")}
              </Button>
            )}
            {confirmDialog.type === "reject" && (
              <Button onClick={handleReject} variant="secondary" className="rounded-xl">
                {t("拒绝", "Reject")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="glass-card border-border/50 w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("审核历史", "Review History")}</SheetTitle>
            <SheetDescription>{t("所有变更和审核的时间线", "Timeline of all changes and reviews")}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {historyRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("暂无历史记录", "No history available")}</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
                {historyRecords.map((record, idx) => (
                  <div key={record.id} className="relative pl-10 pb-6">
                    <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border/50">
                      {getActionIcon(record.action)}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{getActionLabel(record.action)}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("由", "by")} {record.user}
                      </p>
                      {record.comment && (
                        <p className="text-sm text-muted-foreground italic">
                          &quot;{record.comment}&quot;
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
