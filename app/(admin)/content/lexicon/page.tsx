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
  BookMarked,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAdminLocale } from "@/lib/admin-locale";
import { useAuth, canEdit, canDelete, canApproveReview } from "@/lib/auth-context";
import { ChipInput } from "@/components/admin/chip-input";
import { PublishingPanel, isPublishReady } from "@/components/admin/PublishingPanel";
import { type PublishingData, validatePublishing } from "@/lib/validatePublishing";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchLexicon,
  upsertLexicon,
  deleteLexiconById,
  type SupabaseLexicon,
} from "@/lib/supabase/admin-service";
import {
  getLexicon as getLocalLexicon,
  saveLexiconEntry as saveLocalLexicon,
  deleteLexiconEntry as deleteLocalLexicon,
  type LexiconEntry,
} from "@/lib/admin-mock";

const generateId = () => `lex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Unified entry type for UI
interface LexiconUIEntry {
  id: string;
  term: string;
  pinyin: string;
  definition: string;
  say_it_like: string[];
  dont_say: string[];
  collocations: string[];
  publishing: PublishingData & { faq?: Array<{ question: string; answer: string }> };
  createdAt: string;
  updatedAt: string;
  author: string;
}

const emptyEntry: LexiconUIEntry = {
  id: "",
  term: "",
  pinyin: "",
  definition: "",
  say_it_like: [],
  dont_say: [],
  collocations: [],
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
function supabaseToUI(entry: SupabaseLexicon): LexiconUIEntry {
  return {
    id: entry.id,
    term: entry.term,
    pinyin: entry.pinyin,
    definition: entry.definition,
    say_it_like: entry.usage?.say_it_like || [],
    dont_say: entry.usage?.dont_say || [],
    collocations: entry.usage?.collocations || [],
    publishing: entry.publishing || emptyEntry.publishing,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    author: entry.created_by || "Unknown",
  };
}

// Convert local mock format to UI format
function localToUI(entry: LexiconEntry): LexiconUIEntry {
  return {
    id: entry.id,
    term: entry.term,
    pinyin: entry.pinyin,
    definition: entry.definition,
    say_it_like: entry.say_it_like,
    dont_say: entry.dont_say,
    collocations: entry.collocations,
    publishing: {
      slug: entry.term.toLowerCase().replace(/\s+/g, "-"),
      status: entry.status === "published" ? "published" : "draft",
      seo: { title: entry.term, description: entry.definition },
      geo: { snippet: entry.geo_snippet, keyPoints: entry.key_points },
      faq: entry.faq_json,
    },
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    author: entry.author,
  };
}

// Convert UI format to Supabase format
function uiToSupabase(entry: LexiconUIEntry): Partial<SupabaseLexicon> {
  return {
    id: entry.id,
    term: entry.term,
    pinyin: entry.pinyin,
    definition: entry.definition,
    usage: {
      say_it_like: entry.say_it_like,
      dont_say: entry.dont_say,
      collocations: entry.collocations,
    },
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

export default function LexiconPage() {
  const { locale } = useAdminLocale();
  const { user } = useAuth();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  const [entries, setEntries] = useState<LexiconUIEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(isSupabaseConfigured);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LexiconUIEntry>(emptyEntry);
  const [isViewMode, setIsViewMode] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; entry: LexiconUIEntry | null }>({
    open: false,
    entry: null,
  });

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (useSupabase && isSupabaseConfigured) {
        const data = await fetchLexicon();
        setEntries(data.map(supabaseToUI));
      } else {
        const data = getLocalLexicon();
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
    const matchSearch =
      entry.term.toLowerCase().includes(search.toLowerCase()) ||
      entry.pinyin.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "draft" && entry.publishing.status !== "published") ||
      (statusFilter === "published" && entry.publishing.status === "published");
    return matchSearch && matchStatus;
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

  const handleEdit = (entry: LexiconUIEntry) => {
    setEditEntry({ ...entry });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleView = (entry: LexiconUIEntry) => {
    setEditEntry({ ...entry });
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleDuplicate = (entry: LexiconUIEntry) => {
    setEditEntry({
      ...entry,
      id: generateId(),
      term: `${entry.term} (副本)`,
      publishing: { ...entry.publishing, status: "draft", slug: `${entry.publishing.slug}-copy` },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleSave = async (publish: boolean) => {
    if (!editEntry.term.trim()) {
      toast.error(t("请填写术语", "Please fill in the term"));
      return;
    }

    // Check publishing validation if trying to publish
    if (publish) {
      const validation = validatePublishing(editEntry.publishing);
      if (!validation.valid) {
        toast.error(t("发布条件不满足", "Publishing requirements not met"), {
          description: validation.errors.join(", "),
        });
        return;
      }
    }

    const updated: LexiconUIEntry = {
      ...editEntry,
      updatedAt: new Date().toISOString(),
      publishing: {
        ...editEntry.publishing,
        status: publish ? "published" : "draft",
        publishedAt: publish ? new Date().toISOString() : editEntry.publishing.publishedAt,
      },
    };

    try {
      if (useSupabase && isSupabaseConfigured) {
        const result = await upsertLexicon(uiToSupabase(updated));
        if (!result) {
          throw new Error("Failed to save to Supabase");
        }
      } else {
        // Save to local mock
        const localEntry: LexiconEntry = {
          id: updated.id,
          term: updated.term,
          pinyin: updated.pinyin,
          definition: updated.definition,
          say_it_like: updated.say_it_like,
          dont_say: updated.dont_say,
          collocations: updated.collocations,
          geo_snippet: updated.publishing.geo?.snippet || "",
          key_points: updated.publishing.geo?.keyPoints || [],
          faq_json: updated.publishing.faq || [],
          status: publish ? "published" : "draft",
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          author: updated.author,
        };
        saveLocalLexicon(localEntry);
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
        const success = await deleteLexiconById(deleteDialog.entry.id);
        if (!success) throw new Error("Failed to delete");
      } else {
        deleteLocalLexicon(deleteDialog.entry.id);
      }

      await refreshData();
      setDeleteDialog({ open: false, entry: null });
      toast.success(t("删除成功", "Deleted successfully"));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("删除失败", "Failed to delete"));
    }
  };

  const canPublish = (entry: LexiconUIEntry) => {
    return isPublishReady(entry.publishing) && user && canApproveReview(user.role);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BookMarked className="h-7 w-7 text-primary" />
            {t("医学词典 (Lexicon)", "Medical Lexicon")}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {t("管理医学中文词汇和术语", "Manage medical Chinese vocabulary and terminology")}
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
          <Button onClick={handleNew} className="rounded-xl bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            {t("新建词条", "New Entry")}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t("搜索术语或拼音...", "Search term or pinyin...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl bg-secondary/50 border-border/50"
              />
            </div>
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
                  <TableHead className="text-muted-foreground">{t("术语", "Term")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("拼音", "Pinyin")}</TableHead>
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
                        <TableCell className="font-medium text-foreground">{entry.term}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.pinyin}</TableCell>
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
        <SheetContent className="glass-card border-border/50 w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isViewMode
                ? t("查看词条", "View Entry")
                : editEntry.id && !entries.find((e) => e.id === editEntry.id)
                  ? t("新建词条", "New Entry")
                  : t("编辑词条", "Edit Entry")}
            </SheetTitle>
            <SheetDescription>
              {t("填写词条信息，完成发布设置后可发布", "Fill in entry details and complete publishing settings to publish")}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("术语 (Term)", "Term")}</Label>
                    <Input
                      value={editEntry.term}
                      onChange={(e) => setEditEntry({ ...editEntry, term: e.target.value })}
                      disabled={isViewMode}
                      className="rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("拼音 (Pinyin)", "Pinyin")}</Label>
                    <Input
                      value={editEntry.pinyin}
                      onChange={(e) => setEditEntry({ ...editEntry, pinyin: e.target.value })}
                      disabled={isViewMode}
                      className="rounded-xl bg-secondary/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("定义 (Definition)", "Definition")}</Label>
                  <Textarea
                    value={editEntry.definition}
                    onChange={(e) => setEditEntry({ ...editEntry, definition: e.target.value })}
                    disabled={isViewMode}
                    rows={3}
                    className="rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              {/* Usage */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                  {t("用法示例", "Usage")}
                </h3>
                <div className="space-y-2">
                  <Label>{t("正确说法", "Say It Like")}</Label>
                  <ChipInput
                    values={editEntry.say_it_like}
                    onChange={(values) => setEditEntry({ ...editEntry, say_it_like: values })}
                    disabled={isViewMode}
                    placeholder={t("输入示例后按回车", "Type and press Enter")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("避免说法", "Don't Say")}</Label>
                  <ChipInput
                    values={editEntry.dont_say}
                    onChange={(values) => setEditEntry({ ...editEntry, dont_say: values })}
                    disabled={isViewMode}
                    placeholder={t("输入示例后按回车", "Type and press Enter")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("常用搭配", "Collocations")}</Label>
                  <ChipInput
                    values={editEntry.collocations}
                    onChange={(values) => setEditEntry({ ...editEntry, collocations: values })}
                    disabled={isViewMode}
                    placeholder={t("输入搭配后按回车", "Type and press Enter")}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publishing" className="mt-4">
              <PublishingPanel
                value={editEntry.publishing}
                onChange={(publishing) => setEditEntry({ ...editEntry, publishing })}
                title={editEntry.term}
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
            <DialogTitle>{t("删除词条", "Delete Entry")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t(
                `确定要删除 "${deleteDialog.entry?.term}" 吗？此操作无法撤销。`,
                `Are you sure you want to delete "${deleteDialog.entry?.term}"? This action cannot be undone.`
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
