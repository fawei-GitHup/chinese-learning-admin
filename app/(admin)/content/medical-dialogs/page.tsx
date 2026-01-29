"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Eye,
  Send,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  FileText,
  User,
  UserCog,
  Database,
  HardDrive,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAdminLocale } from "@/lib/admin-locale";
import { useAuth, canEdit, canDelete, canApproveReview } from "@/lib/auth-context";
import { ChipInput } from "@/components/admin/chip-input";
import { PublishingPanel, isPublishReady } from "@/components/admin/PublishingPanel";
import { type PublishingData, validatePublishing, generateSlug } from "@/lib/validatePublishing";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchMedicalDialogs,
  upsertMedicalDialog,
  deleteMedicalDialogById,
  medicalDialogItemToUI,
  type MedicalDialogUIEntry,
  type MedicalDialogExchange,
  type MedicalDialogParticipant,
  type MedicalDialogVocabulary,
} from "@/lib/supabase/content-items-service";
import {
  getMedicalDialogItems as getLocalMedicalDialogs,
  saveMedicalDialogEntry as saveLocalMedicalDialog,
  deleteMedicalDialogEntry as deleteLocalMedicalDialog,
  type MedicalDialogEntry,
} from "@/lib/admin-mock";

// Generate a standard UUID v4 format compatible with Supabase UUID column
const generateId = () => crypto.randomUUID();

const DIALOG_TYPES = ["conversation", "article"] as const;

// Convert local mock format to UI format
function localToUI(entry: MedicalDialogEntry): MedicalDialogUIEntry {
  return {
    id: entry.id,
    title: entry.title,
    dialog_type: entry.dialog_type,
    participants: entry.participants,
    exchanges: entry.exchanges,
    article_body: entry.article_body,
    vocabulary: entry.vocabulary,
    medical_context: entry.medical_context,
    publishing: {
      slug: entry.slug || generateSlug(entry.title),
      status: entry.status === "published" ? "published" : "draft",
      publishedAt: entry.publishedAt || undefined,
      seo: { title: entry.seo_title || entry.title, description: entry.seo_description || "" },
      geo: { snippet: entry.geo_snippet, keyPoints: entry.key_points },
      faq: entry.faq_json,
    },
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    author: entry.author,
  };
}

// Convert UI format to local mock format
function uiToLocal(entry: MedicalDialogUIEntry): MedicalDialogEntry {
  return {
    id: entry.id,
    title: entry.title,
    slug: entry.publishing.slug || generateSlug(entry.title),
    dialog_type: entry.dialog_type,
    participants: entry.participants,
    exchanges: entry.exchanges,
    article_body: entry.article_body,
    vocabulary: entry.vocabulary,
    medical_context: entry.medical_context,
    geo_snippet: entry.publishing.geo?.snippet || "",
    key_points: entry.publishing.geo?.keyPoints || [],
    faq_json: entry.publishing.faq || [],
    seo_title: entry.publishing.seo?.title || "",
    seo_description: entry.publishing.seo?.description || "",
    status: entry.publishing.status === "published" ? "published" : "draft",
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
     publishedAt: entry.publishing.publishedAt || undefined,
    author: entry.author,
  };
}

const emptyEntry: MedicalDialogUIEntry = {
  id: "",
  title: "",
  dialog_type: "conversation",
  participants: [],
  exchanges: [],
  article_body: "",
  vocabulary: [],
  medical_context: "",
  publishing: {
    slug: "",
    status: "draft",
    publishedAt: null,
    seo: { title: "", description: "" },
    geo: { snippet: "", keyPoints: [] },
    faq: [],
  },
  createdAt: "",
  updatedAt: "",
  author: "",
};

function StatusBadgeLocal({ status, locale }: { status: "draft" | "published" | undefined; locale: string }) {
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  if (status === "published") {
    return (
      <Badge className="bg-success/20 text-success border-success/30 rounded-lg">
        <CheckCircle className="mr-1 h-3 w-3" />
        {t("已发布", "Published")}
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-border rounded-lg">
      {t("草稿", "Draft")}
    </Badge>
  );
}

export default function MedicalDialogsPage() {
  const { locale } = useAdminLocale();
  const { user } = useAuth();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  const [entries, setEntries] = useState<MedicalDialogUIEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase] = useState(isSupabaseConfigured);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<MedicalDialogUIEntry>(emptyEntry);
  const [isViewMode, setIsViewMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; entry: MedicalDialogUIEntry | null }>({
    open: false,
    entry: null,
  });

  // Exchange editor state
  const [newExchange, setNewExchange] = useState<MedicalDialogExchange>({ speaker: "", text: "", pinyin: "" });
  // Participant editor state
  const [newParticipant, setNewParticipant] = useState<MedicalDialogParticipant>({ name: "", role: "Patient" });
  // Vocabulary editor state
  const [newVocab, setNewVocab] = useState<MedicalDialogVocabulary>({ term: "", definition: "", pinyin: "" });

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useSupabase && isSupabaseConfigured) {
        try {
          const data = await fetchMedicalDialogs();
          setEntries(data.map(medicalDialogItemToUI));
          return;
        } catch (supabaseError) {
          console.warn("Supabase fetch failed, falling back to local data:", supabaseError);
        }
      }
      // Use local mock storage
      const data = getLocalMedicalDialogs();
      setEntries(data.map(localToUI));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(locale === "zh" ? "加载数据失败" : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [useSupabase, locale]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filteredEntries = entries.filter((entry) => {
    const matchSearch = entry.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "draft" && entry.publishing.status !== "published") ||
      (statusFilter === "published" && entry.publishing.status === "published");
    const matchType = typeFilter === "all" || entry.dialog_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Statistics
  const stats = {
    total: entries.length,
    draft: entries.filter(e => e.publishing.status !== "published").length,
    published: entries.filter(e => e.publishing.status === "published").length,
    conversations: entries.filter(e => e.dialog_type === "conversation").length,
    articles: entries.filter(e => e.dialog_type === "article").length,
  };

  const handleNew = () => {
    setEditEntry({
      ...emptyEntry,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: user?.name || "Unknown",
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleEdit = (entry: MedicalDialogUIEntry) => {
    setEditEntry({ ...entry });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleView = (entry: MedicalDialogUIEntry) => {
    setEditEntry({ ...entry });
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (entry: MedicalDialogUIEntry) => {
    setEditEntry({
      ...entry,
      id: generateId(),
      title: `${entry.title} (${t("副本", "Copy")})`,
      publishing: { ...entry.publishing, status: "draft", slug: `${entry.publishing.slug}-copy` },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleSave = async (publish: boolean) => {
    // Permission check
    if (!user || !canEdit(user.role)) {
      toast.error(t("您没有编辑权限", "You don't have edit permission"));
      return;
    }

    if (!editEntry.title.trim()) {
      toast.error(t("请填写标题", "Please fill in the title"));
      return;
    }

    if (publish) {
      const validation = validatePublishing(editEntry.publishing);
      if (!validation.valid) {
        toast.error(t("发布条件不满足", "Publishing requirements not met"), {
          description: validation.errors.join(", "),
        });
        return;
      }
    }

    const updated: MedicalDialogUIEntry = {
      ...editEntry,
      updatedAt: new Date().toISOString(),
      publishing: {
        ...editEntry.publishing,
        slug: editEntry.publishing.slug || generateSlug(editEntry.title),
        status: publish ? "published" : "draft",
        publishedAt: publish ? new Date().toISOString() : editEntry.publishing.publishedAt,
      },
    };

    try {
      let saved = false;
      if (useSupabase && isSupabaseConfigured) {
        try {
          const result = await upsertMedicalDialog(updated);
          if (result) {
            saved = true;
          }
        } catch (supabaseError) {
          console.warn("Supabase save failed, falling back to local storage:", supabaseError);
        }
      }
      
      // Fallback to local storage if Supabase is not available or failed
      if (!saved) {
        saveLocalMedicalDialog(uiToLocal(updated));
      }

      await refreshData();
      setIsDrawerOpen(false);
      toast.success(publish ? t("发布成功", "Published successfully") : t("保存成功", "Saved successfully"));
    } catch (error) {
      console.error("Save error:", error);
      toast.error(t("保存失败", "Failed to save"));
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.entry || !user || !canDelete(user.role)) {
      toast.error(t("您没有权限", "You don't have permission"));
      setDeleteDialog({ open: false, entry: null });
      return;
    }

    try {
      let deleted = false;
      if (useSupabase && isSupabaseConfigured) {
        try {
          const success = await deleteMedicalDialogById(deleteDialog.entry.id);
          if (success) {
            deleted = true;
          }
        } catch (supabaseError) {
          console.warn("Supabase delete failed, falling back to local storage:", supabaseError);
        }
      }
      
      // Fallback to local storage if Supabase is not available or failed
      if (!deleted) {
        deleteLocalMedicalDialog(deleteDialog.entry.id);
      }

      await refreshData();
      setDeleteDialog({ open: false, entry: null });
      toast.success(t("删除成功", "Deleted successfully"));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("删除失败", "Failed to delete"));
    }
  };

  // Exchange management
  const addExchange = () => {
    if (!newExchange.speaker.trim() || !newExchange.text.trim()) return;
    setEditEntry({
      ...editEntry,
      exchanges: [...editEntry.exchanges, { ...newExchange }],
    });
    setNewExchange({ speaker: "", text: "", pinyin: "" });
  };

  const removeExchange = (index: number) => {
    setEditEntry({
      ...editEntry,
      exchanges: editEntry.exchanges.filter((_, i) => i !== index),
    });
  };

  // Participant management
  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;
    setEditEntry({
      ...editEntry,
      participants: [...editEntry.participants, { ...newParticipant }],
    });
    setNewParticipant({ name: "", role: "Patient" });
  };

  const removeParticipant = (index: number) => {
    setEditEntry({
      ...editEntry,
      participants: editEntry.participants.filter((_, i) => i !== index),
    });
  };

  // Vocabulary management
  const addVocabulary = () => {
    if (!newVocab.term.trim()) return;
    setEditEntry({
      ...editEntry,
      vocabulary: [...editEntry.vocabulary, { ...newVocab }],
    });
    setNewVocab({ term: "", definition: "", pinyin: "" });
  };

  const removeVocabulary = (index: number) => {
    setEditEntry({
      ...editEntry,
      vocabulary: editEntry.vocabulary.filter((_, i) => i !== index),
    });
  };

  const canPublish = (entry: MedicalDialogUIEntry) => {
    return isPublishReady(entry.publishing) && user && canEdit(user.role);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" />
            {t("医疗对话/文章 (Medical Dialogs)", "Medical Dialogs")}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {t("管理医疗对话和文章内容", "Manage medical dialogue and article content")}
            <Badge variant="outline" className="ml-2 gap-1">
              {useSupabase && isSupabaseConfigured ? (
                <>
                  <Database className="h-3 w-3" />
                  Supabase (content_items)
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3" />
                  Local Mock
                </>
              )}
            </Badge>
          </p>
        </div>
        {user && canEdit(user.role) && (
          <Button onClick={handleNew} className="rounded-xl bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            {t("新建内容", "New Content")}
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-card border-border/50 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("总数", "Total")}</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("草稿", "Draft")}</p>
            <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">{t("已发布", "Published")}</p>
            <p className="text-2xl font-bold text-success">{stats.published}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("对话", "Dialogs")}
            </p>
            <p className="text-2xl font-bold">{stats.conversations}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {t("文章", "Articles")}
            </p>
            <p className="text-2xl font-bold">{stats.articles}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t("搜索标题...", "Search title...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl bg-secondary/50 border-border/50"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl bg-secondary/50 border border-border/50 px-4 py-2 text-foreground"
            >
              <option value="all">{t("所有类型", "All Types")}</option>
              <option value="conversation">{t("对话", "Conversation")}</option>
              <option value="article">{t("文章", "Article")}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-secondary/50 border border-border/50 px-4 py-2 text-foreground"
            >
              <option value="all">{t("所有状态", "All Status")}</option>
              <option value="draft">{t("草稿", "Draft")}</option>
              <option value="published">{t("已发布", "Published")}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">{t("标题", "Title")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("类型", "Type")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("状态", "Status")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("发布就绪", "Publish Ready")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("更新时间", "Updated")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("操作", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {t("暂无数据", "No data")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => {
                    const publishReady = isPublishReady(entry.publishing);
                    return (
                      <TableRow key={entry.id} className="border-border/30 hover:bg-secondary/30">
                        <TableCell className="font-medium text-foreground">
                          <div>
                            <p>{entry.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.dialog_type === "conversation"
                                ? `${entry.exchanges.length} ${t("行对话", "lines")}`
                                : t("文章", "Article")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg gap-1">
                            {entry.dialog_type === "conversation" ? (
                              <>
                                <MessageSquare className="h-3 w-3" />
                                {t("对话", "Dialog")}
                              </>
                            ) : (
                              <>
                                <FileText className="h-3 w-3" />
                                {t("文章", "Article")}
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadgeLocal status={entry.publishing.status} locale={locale} />
                        </TableCell>
                        <TableCell>
                          {publishReady ? (
                            <Badge className="bg-success/20 text-success border-success/30 rounded-lg">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {t("就绪", "Ready")}
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/20 text-warning border-warning/30 rounded-lg">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {t("未完成", "Incomplete")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(entry.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-border/50 rounded-xl">
                              <DropdownMenuItem onClick={() => handleView(entry)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("查看", "View")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(entry)}
                                disabled={!user || !canEdit(user.role)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("编辑", "Edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(entry)}
                                disabled={!user || !canEdit(user.role)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {t("复制", "Duplicate")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border/50" />
                              <DropdownMenuItem
                                onClick={() => setDeleteDialog({ open: true, entry })}
                                className="text-destructive focus:text-destructive"
                                disabled={!user || !canDelete(user.role)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("删除", "Delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Editor Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="glass-card border-border/50 w-full sm:max-w-2xl flex flex-col h-full">
          <SheetHeader className="shrink-0">
            <SheetTitle>
              {isViewMode
                ? t("查看内容", "View Content")
                : editEntry.id && !entries.find((e) => e.id === editEntry.id)
                ? t("新建内容", "New Content")
                : t("编辑内容", "Edit Content")}
            </SheetTitle>
            <SheetDescription>
              {t("填写内容信息，完成发布设置后可发布", "Fill in content details and complete publishing settings to publish")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-6">
            <Tabs defaultValue="basic" className="">
              <TabsList className="grid w-full grid-cols-4 rounded-xl bg-secondary/50">
                <TabsTrigger value="basic" className="rounded-lg text-xs">
                  {t("基本", "Basic")}
                </TabsTrigger>
                <TabsTrigger value="content" className="rounded-lg text-xs">
                  {t("内容", "Content")}
                </TabsTrigger>
                <TabsTrigger value="vocab" className="rounded-lg text-xs">
                  {t("词汇", "Vocab")}
                </TabsTrigger>
                <TabsTrigger value="publishing" className="rounded-lg text-xs">
                  {t("发布", "Publish")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-4 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                    {t("基本信息", "Basic Info")}
                  </h3>
                  <div className="space-y-2">
                    <Label>{t("标题", "Title")} *</Label>
                    <Input
                      value={editEntry.title}
                      onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                      disabled={isViewMode}
                      placeholder={t("例如：看医生 - Seeing a Doctor", "e.g., Seeing a Doctor")}
                      className="rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("内容类型", "Content Type")}</Label>
                    <Select
                      value={editEntry.dialog_type}
                      onValueChange={(v) => setEditEntry({ ...editEntry, dialog_type: v as "conversation" | "article" })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className="rounded-xl bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50 rounded-xl">
                        <SelectItem value="conversation">
                          <span className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            {t("对话", "Conversation")}
                          </span>
                        </SelectItem>
                        <SelectItem value="article">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t("文章", "Article")}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("医疗背景", "Medical Context")}</Label>
                    <Textarea
                      value={editEntry.medical_context || ""}
                      onChange={(e) => setEditEntry({ ...editEntry, medical_context: e.target.value })}
                      disabled={isViewMode}
                      placeholder={t("描述这段对话/文章的医疗场景...", "Describe the medical context...")}
                      rows={3}
                      className="rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>

                {/* Participants (for conversation type) */}
                {editEntry.dialog_type === "conversation" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                      {t("参与者", "Participants")} ({editEntry.participants.length})
                    </h3>
                    <div className="space-y-2">
                      {editEntry.participants.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                            {p.role === "Patient" ? <User className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.role}</p>
                          </div>
                          {!isViewMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => removeParticipant(i)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {!isViewMode && (
                        <div className="flex gap-2 mt-3">
                          <Input
                            value={newParticipant.name}
                            onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                            placeholder={t("姓名", "Name")}
                            className="flex-1 rounded-xl bg-secondary/50 border-border/50"
                          />
                          <Select
                            value={newParticipant.role}
                            onValueChange={(v) => setNewParticipant({ ...newParticipant, role: v })}
                          >
                            <SelectTrigger className="w-32 rounded-xl bg-secondary/50 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-border/50 rounded-xl">
                              <SelectItem value="Patient">{t("患者", "Patient")}</SelectItem>
                              <SelectItem value="Doctor">{t("医生", "Doctor")}</SelectItem>
                              <SelectItem value="Nurse">{t("护士", "Nurse")}</SelectItem>
                              <SelectItem value="Receptionist">{t("接待员", "Receptionist")}</SelectItem>
                              <SelectItem value="Pharmacist">{t("药剂师", "Pharmacist")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button onClick={addParticipant} className="rounded-xl">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="content" className="mt-4 space-y-6">
                {editEntry.dialog_type === "conversation" ? (
                  /* Conversation Exchanges */
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                      {t("对话内容", "Conversation")} ({editEntry.exchanges.length} {t("行", "lines")})
                    </h3>
                    <div className="space-y-2">
                      {editEntry.exchanges.map((ex, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-xl ${
                            ex.speaker.includes("Patient") || ex.speaker.includes("患者")
                              ? "bg-primary/10"
                              : "bg-accent/10"
                          }`}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                            {ex.speaker.includes("Patient") || ex.speaker.includes("患者") ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <UserCog className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground">{ex.speaker}</p>
                            <p className="text-foreground">{ex.text}</p>
                            {ex.pinyin && <p className="text-xs text-muted-foreground mt-1">{ex.pinyin}</p>}
                          </div>
                          {!isViewMode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => removeExchange(i)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {!isViewMode && (
                        <div className="space-y-2 mt-3 p-3 border border-dashed border-border/50 rounded-xl">
                          <div className="flex gap-2">
                            <Input
                              value={newExchange.speaker}
                              onChange={(e) => setNewExchange({ ...newExchange, speaker: e.target.value })}
                              placeholder={t("说话人 (如：王医生)", "Speaker (e.g., Dr. Wang)")}
                              className="w-40 rounded-xl bg-secondary/50 border-border/50"
                            />
                            <Input
                              value={newExchange.text}
                              onChange={(e) => setNewExchange({ ...newExchange, text: e.target.value })}
                              placeholder={t("对话内容 (中文)...", "Dialogue text (Chinese)...")}
                              className="flex-1 rounded-xl bg-secondary/50 border-border/50"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newExchange.pinyin || ""}
                              onChange={(e) => setNewExchange({ ...newExchange, pinyin: e.target.value })}
                              placeholder={t("拼音 (可选)", "Pinyin (optional)")}
                              className="flex-1 rounded-xl bg-secondary/50 border-border/50"
                            />
                            <Button onClick={addExchange} className="rounded-xl">
                              <Plus className="h-4 w-4 mr-2" />
                              {t("添加", "Add")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Article Body */
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                      {t("文章正文", "Article Body")}
                    </h3>
                    <Textarea
                      value={editEntry.article_body || ""}
                      onChange={(e) => setEditEntry({ ...editEntry, article_body: e.target.value })}
                      disabled={isViewMode}
                      placeholder={t("输入文章正文内容 (支持 Markdown)...", "Enter article body (Markdown supported)...")}
                      rows={15}
                      className="rounded-xl bg-secondary/50 border-border/50 font-mono"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vocab" className="mt-4 space-y-6">
                {/* Vocabulary */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                    {t("词汇表", "Vocabulary")} ({editEntry.vocabulary.length})
                  </h3>
                  <div className="space-y-2">
                    {editEntry.vocabulary.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{v.term}</p>
                            {v.pinyin && <p className="text-sm text-muted-foreground">({v.pinyin})</p>}
                          </div>
                          <p className="text-sm text-muted-foreground">{v.definition}</p>
                        </div>
                        {!isViewMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeVocabulary(i)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {!isViewMode && (
                      <div className="space-y-2 mt-3 p-3 border border-dashed border-border/50 rounded-xl">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={newVocab.term}
                            onChange={(e) => setNewVocab({ ...newVocab, term: e.target.value })}
                            placeholder={t("术语", "Term")}
                            className="rounded-xl bg-secondary/50 border-border/50"
                          />
                          <Input
                            value={newVocab.pinyin || ""}
                            onChange={(e) => setNewVocab({ ...newVocab, pinyin: e.target.value })}
                            placeholder={t("拼音", "Pinyin")}
                            className="rounded-xl bg-secondary/50 border-border/50"
                          />
                          <Input
                            value={newVocab.definition}
                            onChange={(e) => setNewVocab({ ...newVocab, definition: e.target.value })}
                            placeholder={t("定义", "Definition")}
                            className="rounded-xl bg-secondary/50 border-border/50"
                          />
                        </div>
                        <Button onClick={addVocabulary} className="rounded-xl w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("添加词汇", "Add Vocabulary")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="publishing" className="mt-4">
                <PublishingPanel
                  value={editEntry.publishing}
                  onChange={(publishing) => setEditEntry({ ...editEntry, publishing })}
                  title={editEntry.title}
                  disabled={isViewMode}
                  faq={editEntry.publishing.faq}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Actions */}
          {!isViewMode && (
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50 shrink-0 bg-background">
              <Button
                variant="outline"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-xl bg-transparent"
              >
                {t("取消", "Cancel")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                className="rounded-xl"
                disabled={!user || !canEdit(user.role)}
              >
                {t("保存草稿", "Save Draft")}
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={!canPublish(editEntry)}
                className="rounded-xl bg-success text-success-foreground hover:bg-success/90"
              >
                <Send className="mr-2 h-4 w-4" />
                {t("发布", "Publish")}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, entry: null })}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{t("删除内容", "Delete Content")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t(
                `确定要删除 "${deleteDialog.entry?.title}" 吗？此操作无法撤销。`,
                `Are you sure you want to delete "${deleteDialog.entry?.title}"? This action cannot be undone.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, entry: null })}
              className="rounded-xl bg-transparent"
            >
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={handleDelete} variant="destructive" className="rounded-xl">
              {t("删除", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
