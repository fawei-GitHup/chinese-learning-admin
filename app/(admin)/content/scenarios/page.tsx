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
  Theater,
  User,
  UserCog,
  Database,
  HardDrive,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  fetchScenarios,
  upsertScenario,
  deleteScenarioById,
  type SupabaseScenario,
} from "@/lib/supabase/admin-service";
import {
  getScenarios as getLocalScenarios,
  saveScenario as saveLocalScenario,
  deleteScenario as deleteLocalScenario,
  type MedicalScenario,
  type ConversationLine,
} from "@/lib/admin-mock";

// Generate a standard UUID v4 format compatible with Supabase UUID column
const generateId = () => crypto.randomUUID();

const CATEGORIES = ["急诊", "挂号", "问诊", "检查", "用药", "缴费", "药房"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

// Unified entry type for UI
interface ScenarioUIEntry {
  id: string;
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  conversation: ConversationLine[];
  key_phrases: string[];
  checklist: string[];
  warnings: Array<{ type: string; message: string }>;
  publishing: PublishingData & { faq?: Array<{ question: string; answer: string }> };
  createdAt: string;
  updatedAt: string;
  author: string;
}

const emptyEntry: ScenarioUIEntry = {
  id: "",
  title: "",
  category: "急诊",
  difficulty: "Beginner",
  conversation: [],
  key_phrases: [],
  checklist: [],
  warnings: [],
  publishing: {
    slug: "",
    status: "draft",
    seo: { title: "", description: "" },
    geo: { snippet: "", keyPoints: [] },
    faq: [],
  },
  createdAt: "",
  updatedAt: "",
  author: "",
};

// Convert Supabase format to UI format
function supabaseToUI(entry: SupabaseScenario): ScenarioUIEntry {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    difficulty: entry.difficulty as "Beginner" | "Intermediate" | "Advanced",
    conversation: entry.conversation || [],
    key_phrases: entry.key_phrases || [],
    checklist: entry.checklist || [],
    warnings: entry.warnings || [],
    publishing: entry.publishing || emptyEntry.publishing,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    author: entry.created_by || "Unknown",
  };
}

// Convert local mock format to UI format
function localToUI(entry: MedicalScenario): ScenarioUIEntry {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    difficulty: entry.difficulty,
    conversation: entry.conversation,
    key_phrases: entry.key_phrases,
    checklist: entry.checklist,
    warnings: entry.warnings,
    publishing: {
      slug: entry.slug,
      status: entry.status === "published" ? "published" : "draft",
      seo: { title: entry.title, description: entry.geo_intro },
      geo: { snippet: entry.geo_intro, keyPoints: entry.key_takeaways },
      faq: entry.faq_json,
    },
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    author: entry.author,
  };
}

// Convert UI format to Supabase format
function uiToSupabase(entry: ScenarioUIEntry): Partial<SupabaseScenario> {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    difficulty: entry.difficulty,
    conversation: entry.conversation,
    key_phrases: entry.key_phrases,
    checklist: entry.checklist,
    warnings: entry.warnings,
    publishing: entry.publishing,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    created_by: entry.author,
  };
}

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

export default function ScenariosPage() {
  const { locale } = useAdminLocale();
  const { user } = useAuth();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  const [entries, setEntries] = useState<ScenarioUIEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase] = useState(isSupabaseConfigured);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ScenarioUIEntry>(emptyEntry);
  const [isViewMode, setIsViewMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; entry: ScenarioUIEntry | null }>({
    open: false,
    entry: null,
  });

  // Conversation editor state
  const [newLine, setNewLine] = useState<ConversationLine>({ speaker: "Patient", line: "" });

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useSupabase && isSupabaseConfigured) {
        const data = await fetchScenarios();
        setEntries(data.map(supabaseToUI));
      } else {
        const data = getLocalScenarios();
        setEntries(data.map(localToUI));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("加载数据失败", "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [useSupabase]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filteredEntries = entries.filter((entry) => {
    const matchSearch = entry.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "draft" && entry.publishing.status !== "published") ||
      (statusFilter === "published" && entry.publishing.status === "published");
    const matchCategory = categoryFilter === "all" || entry.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

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

  const handleEdit = (entry: ScenarioUIEntry) => {
    setEditEntry({ ...entry });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleView = (entry: ScenarioUIEntry) => {
    setEditEntry({ ...entry });
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (entry: ScenarioUIEntry) => {
    setEditEntry({
      ...entry,
      id: generateId(),
      title: `${entry.title} (副本)`,
      publishing: { ...entry.publishing, status: "draft", slug: `${entry.publishing.slug}-copy` },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleSave = async (publish: boolean) => {
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

    const updated: ScenarioUIEntry = {
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
      if (useSupabase && isSupabaseConfigured) {
        const result = await upsertScenario(uiToSupabase(updated));
        if (!result) {
          throw new Error("Failed to save to Supabase");
        }
      } else {
        const localEntry: MedicalScenario = {
          id: updated.id,
          title: updated.title,
          slug: updated.publishing.slug || generateSlug(updated.title),
          category: updated.category,
          difficulty: updated.difficulty,
          conversation: updated.conversation,
          key_phrases: updated.key_phrases,
          checklist: updated.checklist,
          warnings: updated.warnings as Array<{ type: "caution" | "urgent"; message: string }>,
          geo_intro: updated.publishing.geo?.snippet || "",
          key_takeaways: updated.publishing.geo?.keyPoints || [],
          faq_json: updated.publishing.faq || [],
          status: publish ? "published" : "draft",
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          author: updated.author,
        };
        saveLocalScenario(localEntry);
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
      if (useSupabase && isSupabaseConfigured) {
        const success = await deleteScenarioById(deleteDialog.entry.id);
        if (!success) throw new Error("Failed to delete");
      } else {
        deleteLocalScenario(deleteDialog.entry.id);
      }

      await refreshData();
      setDeleteDialog({ open: false, entry: null });
      toast.success(t("删除成功", "Deleted successfully"));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("删除失败", "Failed to delete"));
    }
  };

  const addConversationLine = () => {
    if (!newLine.line.trim()) return;
    setEditEntry({
      ...editEntry,
      conversation: [...editEntry.conversation, { ...newLine }],
    });
    setNewLine({ speaker: "Patient", line: "" });
  };

  const removeConversationLine = (index: number) => {
    setEditEntry({
      ...editEntry,
      conversation: editEntry.conversation.filter((_, i) => i !== index),
    });
  };

  const canPublish = (entry: ScenarioUIEntry) => {
    return isPublishReady(entry.publishing) && user && canApproveReview(user.role);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Theater className="h-7 w-7 text-chart-4" />
            {t("医学情景 (Scenarios)", "Medical Scenarios")}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {t("管理医院场景对话和情景练习", "Manage hospital scenario dialogues and practice")}
            <Badge variant="outline" className="ml-2 gap-1">
              {useSupabase && isSupabaseConfigured ? (
                <>
                  <Database className="h-3 w-3" />
                  Supabase
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
          <Button onClick={handleNew} className="rounded-xl bg-chart-4 hover:bg-chart-4/90 text-chart-4-foreground">
            <Plus className="mr-2 h-4 w-4" />
            {t("新建情景", "New Scenario")}
          </Button>
        )}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl bg-secondary/50 border border-border/50 px-4 py-2 text-foreground"
            >
              <option value="all">{t("所有分类", "All Categories")}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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
                  <TableHead className="text-muted-foreground">{t("分类", "Category")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("难度", "Difficulty")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("状态", "Status")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("发布就绪", "Publish Ready")}</TableHead>
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
                        <TableCell className="font-medium text-foreground">{entry.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg">{entry.category}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{entry.difficulty}</TableCell>
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
        <SheetContent className="glass-card border-border/50 w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isViewMode
                ? t("查看情景", "View Scenario")
                : editEntry.id && !entries.find((e) => e.id === editEntry.id)
                  ? t("新建情景", "New Scenario")
                  : t("编辑情景", "Edit Scenario")}
            </SheetTitle>
            <SheetDescription>
              {t("填写情景信息，完成发布设置后可发布", "Fill in scenario details and complete publishing settings to publish")}
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="content" className="mt-6">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/50">
              <TabsTrigger value="content" className="rounded-lg">
                {t("内容", "Content")}
              </TabsTrigger>
              <TabsTrigger value="publishing" className="rounded-lg">
                {t("发布设置", "Publishing")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                  {t("基本信息", "Basic Info")}
                </h3>
                <div className="space-y-2">
                  <Label>{t("标题", "Title")}</Label>
                  <Input
                    value={editEntry.title}
                    onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                    disabled={isViewMode}
                    className="rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("分类", "Category")}</Label>
                    <Select
                      value={editEntry.category}
                      onValueChange={(v) => setEditEntry({ ...editEntry, category: v })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className="rounded-xl bg-secondary/50 border-border/50">
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
                      value={editEntry.difficulty}
                      onValueChange={(v) => setEditEntry({ ...editEntry, difficulty: v as typeof DIFFICULTIES[number] })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className="rounded-xl bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50 rounded-xl">
                        {DIFFICULTIES.map((diff) => (
                          <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                  {t("对话", "Conversation")}
                </h3>
                <div className="space-y-2">
                  {editEntry.conversation.map((line, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-xl ${
                        line.speaker === "Patient" ? "bg-primary/10" : "bg-accent/10"
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                        {line.speaker === "Patient" ? <User className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">{line.speaker}</p>
                        <p className="text-foreground">{line.line}</p>
                      </div>
                      {!isViewMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeConversationLine(i)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isViewMode && (
                    <div className="flex gap-2 mt-3">
                      <Select
                        value={newLine.speaker}
                        onValueChange={(v) => setNewLine({ ...newLine, speaker: v })}
                      >
                        <SelectTrigger className="w-32 rounded-xl bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/50 rounded-xl">
                          <SelectItem value="Patient">{t("患者", "Patient")}</SelectItem>
                          <SelectItem value="Doctor">{t("医生", "Doctor")}</SelectItem>
                          <SelectItem value="Nurse">{t("护士", "Nurse")}</SelectItem>
                          <SelectItem value="Receptionist">{t("接待员", "Receptionist")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={newLine.line}
                        onChange={(e) => setNewLine({ ...newLine, line: e.target.value })}
                        placeholder={t("输入对话内容...", "Enter dialogue...")}
                        className="flex-1 rounded-xl bg-secondary/50 border-border/50"
                        onKeyDown={(e) => e.key === "Enter" && addConversationLine()}
                      />
                      <Button onClick={addConversationLine} className="rounded-xl">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Phrases */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                  {t("关键短语", "Key Phrases")}
                </h3>
                <ChipInput
                  value={editEntry.key_phrases}
                  onChange={(value) => setEditEntry({ ...editEntry, key_phrases: value })}
                  disabled={isViewMode}
                  placeholder={t("输入后按回车", "Type and press Enter")}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                  {t("检查清单", "Checklist")}
                </h3>
                <ChipInput
                  value={editEntry.checklist}
                  onChange={(value) => setEditEntry({ ...editEntry, checklist: value })}
                  disabled={isViewMode}
                  placeholder={t("输入后按回车", "Type and press Enter")}
                />
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

          {/* Actions */}
          {!isViewMode && (
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/50">
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
            <DialogTitle>{t("删除情景", "Delete Scenario")}</DialogTitle>
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
