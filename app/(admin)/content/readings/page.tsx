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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable, type Column, type FilterOption } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ContentDrawer } from "@/components/admin/content-drawer";
import { ChipInput } from "@/components/admin/chip-input";
import { getReadings, saveReading, deleteReading, generateId } from "@/lib/mock/storage";
import {
  type Reading,
  type ContentStatus,
  type HSKLevel,
  type GlossaryItem,
  type FAQItem,
  type ReviewRecord,
  generateSlug,
  generateGeoSnippet,
} from "@/lib/mock/data";
import { useAuth, canEdit, canDelete, canSubmitForReview, canApproveReview, canArchive, canPublish } from "@/lib/auth-context";
import { EmptyDataState, EmptyFilterState } from "@/components/admin/empty-state";
import { toast } from "sonner";

const HSK_LEVELS: HSKLevel[] = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"];

const defaultReading: Partial<Reading> = {
  title: "",
  slug: "",
  level: "HSK1",
  tags: [],
  summary: "",
  reading_body: "",
  audio_url: "",
  glossary: [],
  seo_title: "",
  seo_description: "",
  faq: [],
  geo_snippet: "",
  status: "draft",
};

export default function ReadingsPage() {
  const { user } = useAuth();
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [editingReading, setEditingReading] = useState<Partial<Reading> | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "publish" | "archive" | "delete" | "submit_review" | "approve" | "reject";
    reading: Reading | null;
  }>({ open: false, type: "delete", reading: null });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyReadingId, setHistoryReadingId] = useState<string | null>(null);

  // Review records storage
  const REVIEW_RECORDS_KEY = "admin_reading_reviews";

  const getReviewRecords = (): Record<string, ReviewRecord[]> => {
    if (typeof window === "undefined") return {};
    const stored = localStorage.getItem(REVIEW_RECORDS_KEY);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  };

  const saveReviewRecord = (readingId: string, record: ReviewRecord) => {
    const records = getReviewRecords();
    if (!records[readingId]) records[readingId] = [];
    records[readingId].unshift(record);
    localStorage.setItem(REVIEW_RECORDS_KEY, JSON.stringify(records));
  };

  useEffect(() => {
    setReadings(getReadings());
  }, []);

  const refreshData = () => setReadings(getReadings());

  const handleCreate = () => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "Permission denied"));
      return;
    }
    setEditingReading({ ...defaultReading, tags: [], glossary: [], faq: [] });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleView = (reading: Reading) => {
    setEditingReading({ ...reading });
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleEdit = (reading: Reading) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "Permission denied"));
      return;
    }
    setEditingReading({ ...reading });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (reading: Reading) => {
    if (!user || !canEdit(user.role)) {
      toast.error(t("没有权限", "Permission denied"));
      return;
    }
    setEditingReading({
      ...reading,
      id: undefined,
      title: `${reading.title} (Copy)`,
      slug: `${reading.slug}-copy`,
      status: "draft",
      publishedAt: undefined,
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (!editingReading?.title) {
      toast.error(t("标题不能为空", "Title is required"));
      return;
    }

    const now = new Date().toISOString();
    const isNew = !editingReading.id;
    const readingToSave: Reading = {
      id: editingReading.id || generateId(),
      title: editingReading.title || "",
      slug: editingReading.slug || generateSlug(editingReading.title || ""),
      level: editingReading.level || "HSK1",
      tags: editingReading.tags || [],
      summary: editingReading.summary || "",
      reading_body: editingReading.reading_body || "",
      audio_url: editingReading.audio_url || "",
      glossary: editingReading.glossary || [],
      seo_title: editingReading.seo_title || "",
      seo_description: editingReading.seo_description || "",
      faq: editingReading.faq || [],
      geo_snippet: editingReading.geo_snippet || "",
      status: editingReading.status || "draft",
      createdAt: isNew ? now : (readings.find((r) => r.id === editingReading.id)?.createdAt || now),
      updatedAt: now,
      publishedAt: editingReading.publishedAt,
      author: user?.name || "Unknown",
    };

    saveReading(readingToSave);
    refreshData();
    setIsDrawerOpen(false);
    setEditingReading(null);
    toast.success(isNew ? t("阅读已创建", "Reading created") : t("阅读已更新", "Reading updated"));
  };

  const handleSubmitForReview = () => {
    if (!confirmDialog.reading || !user) return;
    if (!canSubmitForReview(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      setConfirmDialog({ open: false, type: "delete", reading: null });
      return;
    }
    const now = new Date().toISOString();
    const updated: Reading = {
      ...confirmDialog.reading,
      status: "in_review",
      updatedAt: now,
    };
    saveReading(updated);
    saveReviewRecord(confirmDialog.reading.id, {
      id: generateId(),
      action: "submitted_for_review",
      fromStatus: confirmDialog.reading.status,
      toStatus: "in_review",
      user: user.name,
      timestamp: now,
    });
    refreshData();
    setConfirmDialog({ open: false, type: "delete", reading: null });
    toast.success(t("已提交审核", "Submitted for review"));
  };

  const handleApproveAndPublish = () => {
    if (!confirmDialog.reading || !user) return;
    if (!canApproveReview(user.role)) {
      toast.error(t("没有权限", "You don't have permission"), { description: t("只有管理员可以审批内容。", "Only admins can approve reviews.") });
      setConfirmDialog({ open: false, type: "delete", reading: null });
      return;
    }
    const now = new Date().toISOString();
    const updated: Reading = {
      ...confirmDialog.reading,
      status: "published",
      updatedAt: now,
      publishedAt: now,
    };
    saveReading(updated);
    saveReviewRecord(confirmDialog.reading.id, {
      id: generateId(),
      action: "approved",
      fromStatus: confirmDialog.reading.status,
      toStatus: "published",
      user: user.name,
      timestamp: now,
    });
    refreshData();
    setConfirmDialog({ open: false, type: "delete", reading: null });
    toast.success(t("已发布", "Published"));
  };

  const handleReject = () => {
    if (!confirmDialog.reading || !user) return;
    if (!canApproveReview(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      setConfirmDialog({ open: false, type: "delete", reading: null });
      return;
    }
    const now = new Date().toISOString();
    const updated: Reading = {
      ...confirmDialog.reading,
      status: "draft",
      updatedAt: now,
    };
    saveReading(updated);
    saveReviewRecord(confirmDialog.reading.id, {
      id: generateId(),
      action: "rejected",
      fromStatus: confirmDialog.reading.status,
      toStatus: "draft",
      user: user.name,
      comment: "Needs revision",
      timestamp: now,
    });
    refreshData();
    setConfirmDialog({ open: false, type: "delete", reading: null });
    toast.info(t("已退回修改", "Sent back for revision"));
  };

  const handleArchive = () => {
    if (!confirmDialog.reading || !user) return;
    if (!canArchive(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      setConfirmDialog({ open: false, type: "delete", reading: null });
      return;
    }
    const now = new Date().toISOString();
    const updated: Reading = {
      ...confirmDialog.reading,
      status: "archived",
      updatedAt: now,
    };
    saveReading(updated);
    saveReviewRecord(confirmDialog.reading.id, {
      id: generateId(),
      action: "archived",
      fromStatus: confirmDialog.reading.status,
      toStatus: "archived",
      user: user.name,
      timestamp: now,
    });
    refreshData();
    setConfirmDialog({ open: false, type: "delete", reading: null });
    toast.success(t("已归档", "Archived"));
  };

  const handleDelete = () => {
    if (!confirmDialog.reading || !user) return;
    if (!canDelete(user.role)) {
      toast.error(t("没有权限", "You don't have permission"), { description: t("只有管理员可以删除内容。", "Only admins can delete content.") });
      setConfirmDialog({ open: false, type: "delete", reading: null });
      return;
    }
    deleteReading(confirmDialog.reading.id);
    refreshData();
    setConfirmDialog({ open: false, type: "delete", reading: null });
    toast.success(t("阅读已删除", "Reading deleted"));
  };

  const handleViewHistory = (readingId: string) => {
    setHistoryReadingId(readingId);
    setIsHistoryOpen(true);
  };

  const historyRecords = historyReadingId ? getReviewRecords()[historyReadingId] || [] : [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created": return <Plus className="h-4 w-4" />;
      case "edited": return <Pencil className="h-4 w-4" />;
      case "submitted_for_review": return <Send className="h-4 w-4" />;
      case "approved":
      case "published": return <CheckCircle className="h-4 w-4 text-success" />;
      case "rejected": return <XCircle className="h-4 w-4 text-warning" />;
      case "archived": return <Archive className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "created": return t("已创建", "Created");
      case "edited": return t("已编辑", "Edited");
      case "submitted_for_review": return t("已提交审核", "Submitted for Review");
      case "approved": return t("已批准并发布", "Approved & Published");
      case "rejected": return t("已拒绝", "Rejected");
      case "published": return t("已发布", "Published");
      case "archived": return t("已归档", "Archived");
      default: return action;
    }
  };

  const handleGenerateSlug = () => {
    if (editingReading?.title) {
      setEditingReading((prev) => ({
        ...prev,
        slug: generateSlug(prev?.title || ""),
      }));
    }
  };

  const handleGenerateGeoSnippet = () => {
    if (editingReading?.summary) {
      const words = editingReading.glossary?.map((g) => g.word) || [];
      setEditingReading((prev) => ({
        ...prev,
        geo_snippet: generateGeoSnippet(prev?.summary || "", words),
      }));
    }
  };

  // Glossary management
  const handleAddGlossaryItem = () => {
    setEditingReading((prev) => ({
      ...prev,
      glossary: [...(prev?.glossary || []), { word: "", pinyin: "", meaning: "" }],
    }));
  };

  const handleUpdateGlossaryItem = (index: number, field: keyof GlossaryItem, value: string) => {
    setEditingReading((prev) => {
      const glossary = [...(prev?.glossary || [])];
      glossary[index] = { ...glossary[index], [field]: value };
      return { ...prev, glossary };
    });
  };

  const handleRemoveGlossaryItem = (index: number) => {
    setEditingReading((prev) => ({
      ...prev,
      glossary: prev?.glossary?.filter((_, i) => i !== index) || [],
    }));
  };

  // FAQ management
  const handleAddFAQ = () => {
    setEditingReading((prev) => ({
      ...prev,
      faq: [...(prev?.faq || []), { question: "", answer: "" }],
    }));
  };

  const handleUpdateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    setEditingReading((prev) => {
      const faq = [...(prev?.faq || [])];
      faq[index] = { ...faq[index], [field]: value };
      return { ...prev, faq };
    });
  };

  const handleRemoveFAQ = (index: number) => {
    setEditingReading((prev) => ({
      ...prev,
      faq: prev?.faq?.filter((_, i) => i !== index) || [],
    }));
  };

  const columns: Column<Reading>[] = [
    {
      key: "title",
      label: t("标题", "Title"),
      sortable: true,
      render: (reading) => (
        <div>
          <p className="font-medium">{reading.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{reading.summary}</p>
        </div>
      ),
    },
    {
      key: "level",
      label: t("等级", "Level"),
      sortable: true,
      render: (reading) => (
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
          {reading.level}
        </Badge>
      ),
    },
    {
      key: "status",
      label: t("状态", "Status"),
      render: (reading) => <StatusBadge status={reading.status} />,
    },
    {
      key: "updatedAt",
      label: t("更新时间", "Updated"),
      sortable: true,
      render: (reading) =>
        new Date(reading.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "author",
      label: t("作者", "Owner"),
      render: (reading) => <span className="text-muted-foreground">{reading.author}</span>,
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

  const renderActions = (reading: Reading) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-border/50 rounded-xl">
        <DropdownMenuItem onClick={() => handleView(reading)}>
          <Eye className="mr-2 h-4 w-4" />
          {t("查看", "View")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(reading)} disabled={!user || !canEdit(user.role)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("编辑", "Edit")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicate(reading)} disabled={!user || !canEdit(user.role)}>
          <Copy className="mr-2 h-4 w-4" />
          {t("复制", "Duplicate")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleViewHistory(reading.id)}>
          <History className="mr-2 h-4 w-4" />
          {t("历史", "History")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        {reading.status === "draft" && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "submit_review", reading })}
            disabled={!user || !canSubmitForReview(user.role)}
          >
            <Send className="mr-2 h-4 w-4" />
            {t("提交审核", "Submit for Review")}
          </DropdownMenuItem>
        )}
        {reading.status === "in_review" && (
          <>
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, type: "approve", reading })}
              disabled={!user || !canApproveReview(user.role)}
              className="text-success focus:text-success"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("批准并发布", "Approve & Publish")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, type: "reject", reading })}
              disabled={!user || !canApproveReview(user.role)}
              className="text-warning focus:text-warning"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {t("拒绝", "Reject")}
            </DropdownMenuItem>
          </>
        )}
        {(reading.status === "published" || reading.status === "draft") && (
          <DropdownMenuItem
            onClick={() => setConfirmDialog({ open: true, type: "archive", reading })}
            disabled={!user || !canArchive(user.role)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {t("归档", "Archive")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem
          onClick={() => setConfirmDialog({ open: true, type: "delete", reading })}
          className="text-destructive focus:text-destructive"
          disabled={!user || !canDelete(user.role)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("删除", "Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const handleStatusChange = (reading: Reading, newStatus: ContentStatus) => {
    if (!user) return;
    const now = new Date().toISOString();
    const updated: Reading = {
      ...reading,
      status: newStatus,
      updatedAt: now,
    };
    saveReading(updated);
    saveReviewRecord(reading.id, {
      id: generateId(),
      action: newStatus === "published" ? "approved" : "archived",
      fromStatus: reading.status,
      toStatus: newStatus,
      user: user.name,
      timestamp: now,
    });
    refreshData();
    setConfirmDialog({ open: false, type: "delete", reading: null });
    toast.success(newStatus === "published" ? t("已发布", "Published") : t("已归档", "Archived"));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("阅读", "Readings")}</h1>
          <p className="text-muted-foreground">{t("管理阅读材料和故事", "Manage reading materials and stories")}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="rounded-xl bg-primary hover:bg-primary/90"
          disabled={!user || !canEdit(user.role)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("新建阅读", "New Reading")}
        </Button>
      </div>

      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="pt-6">
          <DataTable
            data={readings}
            columns={columns}
            searchKey="title"
            searchPlaceholder={t("搜索阅读...", "Search readings...")}
            filters={filters}
            renderActions={renderActions}
          />
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <ContentDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title={isViewMode ? t("查看阅读", "View Reading") : editingReading?.id ? t("编辑阅读", "Edit Reading") : t("新建阅读", "New Reading")}
        description={isViewMode ? t("查看阅读详情", "View reading details") : t("请填写以下阅读信息", "Fill in the reading details below")}
        onSave={handleSave}
        onCancel={() => {
          setIsDrawerOpen(false);
          setEditingReading(null);
        }}
        isNew={!editingReading?.id}
        disabled={isViewMode}
      >
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-xl">
            <TabsTrigger value="content" className="rounded-lg">{t("内容", "Content")}</TabsTrigger>
            <TabsTrigger value="glossary" className="rounded-lg">{t("词汇表", "Glossary")}</TabsTrigger>
            <TabsTrigger value="seo" className="rounded-lg">{t("SEO 和 FAQ", "SEO & FAQ")}</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("标题", "Title")} *</Label>
              <Input
                value={editingReading?.title || ""}
                onChange={(e) => setEditingReading((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t("输入阅读标题", "Enter reading title")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("别名", "Slug")}</Label>
              <div className="flex gap-2">
                <Input
                  value={editingReading?.slug || ""}
                  onChange={(e) => setEditingReading((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder={t("阅读别名", "reading-slug")}
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
                <Label>{t("等级", "Level")}</Label>
                <Select
                  value={editingReading?.level || "HSK1"}
                  onValueChange={(value) => setEditingReading((prev) => ({ ...prev, level: value as HSKLevel }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50 rounded-xl">
                    {HSK_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("状态", "Status")}</Label>
                <Select
                  value={editingReading?.status || "draft"}
                  onValueChange={(value) => setEditingReading((prev) => ({ ...prev, status: value as ContentStatus }))}
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
            </div>

            <div className="space-y-2">
              <Label>{t("标签", "Tags")}</Label>
              <ChipInput
                value={editingReading?.tags || []}
                onChange={(tags) => setEditingReading((prev) => ({ ...prev, tags }))}
                placeholder={t("添加标签...", "Add tags...")}
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("摘要", "Summary")}</Label>
              <Textarea
                value={editingReading?.summary || ""}
                onChange={(e) => setEditingReading((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder={t("简要阅读摘要...", "Brief reading summary...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("阅读内容 (Markdown)", "Reading Body (Markdown)")}</Label>
              <Textarea
                value={editingReading?.reading_body || ""}
                onChange={(e) => setEditingReading((prev) => ({ ...prev, reading_body: e.target.value }))}
                placeholder={t("# 阅读标题\n\n在这里编写阅读内容...", "# Reading Title\n\nWrite your reading content here...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[200px] font-mono text-sm"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("音频链接", "Audio URL")}</Label>
              <Input
                value={editingReading?.audio_url || ""}
                onChange={(e) => setEditingReading((prev) => ({ ...prev, audio_url: e.target.value }))}
                placeholder={t("/audio/阅读.mp3", "/audio/reading.mp3")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>
          </TabsContent>

          <TabsContent value="glossary" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>{t(`词汇表 (${editingReading?.glossary?.length || 0} 项)`, `Glossary (${editingReading?.glossary?.length || 0} items)`)}</Label>
              {!isViewMode && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddGlossaryItem} className="rounded-xl bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("添加词汇", "Add Word")}
                </Button>
              )}
            </div>

            {(editingReading?.glossary?.length || 0) > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>{t("词汇", "Word")}</TableHead>
                    <TableHead>{t("拼音", "Pinyin")}</TableHead>
                    <TableHead>{t("含义", "Meaning")}</TableHead>
                    {!isViewMode && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editingReading?.glossary?.map((item, index) => (
                    <TableRow key={index} className="border-border/50">
                      <TableCell>
                        <Input
                          value={item.word}
                          onChange={(e) => handleUpdateGlossaryItem(index, "word", e.target.value)}
                          placeholder="中文"
                          className="bg-secondary/30 border-border/50 rounded-lg h-8 text-sm"
                          disabled={isViewMode}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.pinyin}
                          onChange={(e) => handleUpdateGlossaryItem(index, "pinyin", e.target.value)}
                          placeholder="zhōngwén"
                          className="bg-secondary/30 border-border/50 rounded-lg h-8 text-sm"
                          disabled={isViewMode}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.meaning}
                          onChange={(e) => handleUpdateGlossaryItem(index, "meaning", e.target.value)}
                          placeholder="Chinese"
                          className="bg-secondary/30 border-border/50 rounded-lg h-8 text-sm"
                          disabled={isViewMode}
                        />
                      </TableCell>
                      {!isViewMode && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveGlossaryItem(index)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {(!editingReading?.glossary || editingReading.glossary.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("暂无词汇项。", "No glossary items yet.")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("SEO 标题", "SEO Title")}</Label>
              <Input
                value={editingReading?.seo_title || ""}
                onChange={(e) => setEditingReading((prev) => ({ ...prev, seo_title: e.target.value }))}
                placeholder={t("SEO 优化标题...", "SEO optimized title...")}
                className="bg-secondary/50 border-border/50 rounded-xl"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("SEO 描述", "SEO Description")}</Label>
              <Textarea
                value={editingReading?.seo_description || ""}
                onChange={(e) => setEditingReading((prev) => ({ ...prev, seo_description: e.target.value }))}
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
                value={editingReading?.geo_snippet || ""}
                onChange={(e) => setEditingReading((prev) => ({ ...prev, geo_snippet: e.target.value }))}
                placeholder={t("地理搜索摘要...", "Geographic search snippet...")}
                className="bg-secondary/50 border-border/50 rounded-xl min-h-[80px]"
                disabled={isViewMode}
              />
              <p className="text-xs text-muted-foreground">{editingReading?.geo_snippet?.length || 0}/200 {t("字符", "characters")}</p>
            </div>

            {/* FAQ Section */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label>{t(`常见问题 (${editingReading?.faq?.length || 0} 项)`, `FAQ (${editingReading?.faq?.length || 0} items)`)}</Label>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFAQ} className="rounded-xl bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("添加问题", "Add FAQ")}
                  </Button>
                )}
              </div>

              {editingReading?.faq?.map((item, index) => (
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
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: "delete", reading: null })}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "delete" && t("删除阅读", "Delete Reading")}
              {confirmDialog.type === "archive" && t("归档阅读", "Archive Reading")}
              {confirmDialog.type === "submit_review" && t("提交审核", "Submit for Review")}
              {confirmDialog.type === "approve" && t("批准并发布", "Approve & Publish")}
              {confirmDialog.type === "reject" && t("拒绝提交", "Reject Submission")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmDialog.type === "delete" && t("此操作无法撤销。阅读将被永久删除。", "This action cannot be undone. The reading will be permanently deleted.")}
              {confirmDialog.type === "archive" && t("这将归档阅读。稍后可以恢复。", "This will archive the reading. It can be restored later.")}
              {confirmDialog.type === "submit_review" && t("这将提交阅读进行管理员审核。", "This will submit the reading for admin review.")}
              {confirmDialog.type === "approve" && t("这将批准阅读并立即发布。", "This will approve the reading and publish it immediately.")}
              {confirmDialog.type === "reject" && t("这将把阅读退回草稿状态进行修改。", "This will send the reading back to draft status for revision.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, type: "delete", reading: null })} className="rounded-xl bg-transparent">
              {t("取消", "Cancel")}
            </Button>
            {confirmDialog.type === "delete" && (
              <Button onClick={handleDelete} variant="destructive" className="rounded-xl">{t("删除", "Delete")}</Button>
            )}
            {confirmDialog.type === "archive" && (
              <Button onClick={handleArchive} variant="secondary" className="rounded-xl">{t("归档", "Archive")}</Button>
            )}
            {confirmDialog.type === "submit_review" && (
              <Button onClick={handleSubmitForReview} className="rounded-xl bg-primary">{t("提交审核", "Submit for Review")}</Button>
            )}
            {confirmDialog.type === "approve" && (
              <Button onClick={handleApproveAndPublish} className="rounded-xl bg-success text-success-foreground hover:bg-success/90">{t("批准并发布", "Approve & Publish")}</Button>
            )}
            {confirmDialog.type === "reject" && (
              <Button onClick={handleReject} variant="secondary" className="rounded-xl">{t("拒绝", "Reject")}</Button>
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
                {historyRecords.map((record) => (
                  <div key={record.id} className="relative pl-10 pb-6">
                    <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border/50">
                      {getActionIcon(record.action)}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{getActionLabel(record.action)}</p>
                      <p className="text-sm text-muted-foreground">{t("由", "by")} {record.user}</p>
                      {record.comment && (
                        <p className="text-sm text-muted-foreground italic">&quot;{record.comment}&quot;</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.timestamp).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
                          month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
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
