"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAdminLocale } from "@/lib/admin-locale";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAllowedEmails,
  addAllowedEmail,
  removeAllowedEmail,
  updateAllowedEmail,
  bulkImportEmails,
  parseEmailsFromText,
  getAllowlistStats,
  type AllowedEmail,
} from "@/lib/supabase/allowlist-service";
import {
  mockFetchAllowedEmails,
  mockAddAllowedEmail,
  mockRemoveAllowedEmail,
  mockUpdateAllowedEmail,
  mockBulkImportEmails,
  mockGetAllowlistStats,
  type MockAllowedEmail,
  type MockAllowlistStats,
} from "@/lib/admin-mock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Mail,
  Globe,
  Shield,
  Edit3,
  Eye,
  Plus,
  Trash2,
  Pencil,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Upload,
  Info,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type AllowedEmailEntry = AllowedEmail | MockAllowedEmail;
type AllowlistStatsType = { total: number; domainPatterns: number; adminDefaults: number; editorDefaults: number; viewerDefaults: number } | MockAllowlistStats | null;

const ITEMS_PER_PAGE = 10;

export default function AllowlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { locale } = useAdminLocale();

  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  // State
  const [entries, setEntries] = useState<AllowedEmailEntry[]>([]);
  const [stats, setStats] = useState<AllowlistStatsType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Add dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [newNotes, setNewNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Edit dialog state
  const [editingEntry, setEditingEntry] = useState<AllowedEmailEntry | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deletingEntry, setDeletingEntry] = useState<AllowedEmailEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk import dialog state
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.push("/admin/403");
    }
  }, [user, authLoading, router]);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let fetchedEntries: AllowedEmailEntry[];
      let fetchedStats: AllowlistStatsType;

      if (isSupabaseConfigured) {
        fetchedEntries = await fetchAllowedEmails();
        fetchedStats = await getAllowlistStats();

        // Fall back to mock if Supabase returns empty
        if (fetchedEntries.length === 0 && !fetchedStats) {
          console.log("[Allowlist] Supabase returned empty, using mock data");
          fetchedEntries = mockFetchAllowedEmails();
          fetchedStats = mockGetAllowlistStats();
        }
      } else {
        fetchedEntries = mockFetchAllowedEmails();
        fetchedStats = mockGetAllowlistStats();
      }

      setEntries(fetchedEntries);
      setStats(fetchedStats);
    } catch (error) {
      console.error("Error fetching allowlist:", error);
      setEntries(mockFetchAllowedEmails());
      setStats(mockGetAllowlistStats());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchData();
    }
  }, [authLoading, user]);

  // Filter and search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;

    const query = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.email.toLowerCase().includes(query) ||
        (e.notes && e.notes.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  // Pagination
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle add email
  const handleAdd = async () => {
    if (!newEmail.trim()) {
      toast.error(t("请输入邮箱地址", "Please enter an email address"));
      return;
    }

    setIsAdding(true);
    try {
      let result;
      if (isSupabaseConfigured) {
        result = await addAllowedEmail(newEmail, newRole, newNotes || undefined);
      } else {
        result = mockAddAllowedEmail(newEmail, newRole, newNotes || undefined);
      }

      if (result.success) {
        toast.success(t("邮箱已添加到白名单", "Email added to allowlist"));
        setShowAddDialog(false);
        setNewEmail("");
        setNewRole("viewer");
        setNewNotes("");
        fetchData();
      } else {
        toast.error(result.error || t("添加失败", "Failed to add"));
      }
    } catch (error: any) {
      toast.error(error.message || t("添加失败", "Failed to add"));
    } finally {
      setIsAdding(false);
    }
  };

  // Handle edit
  const openEditDialog = (entry: AllowedEmailEntry) => {
    setEditingEntry(entry);
    setEditRole(entry.default_role);
    setEditNotes(entry.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    setIsSaving(true);
    try {
      let result;
      if (isSupabaseConfigured) {
        result = await updateAllowedEmail(editingEntry.id, {
          default_role: editRole,
          notes: editNotes || undefined,
        });
      } else {
        result = mockUpdateAllowedEmail(editingEntry.id, {
          default_role: editRole,
          notes: editNotes || undefined,
        });
      }

      if (result.success) {
        toast.success(t("已更新", "Updated"));
        setEditingEntry(null);
        fetchData();
      } else {
        toast.error(result.error || t("更新失败", "Failed to update"));
      }
    } catch (error: any) {
      toast.error(error.message || t("更新失败", "Failed to update"));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingEntry) return;

    setIsDeleting(true);
    try {
      let result;
      if (isSupabaseConfigured) {
        result = await removeAllowedEmail(deletingEntry.id);
      } else {
        result = mockRemoveAllowedEmail(deletingEntry.id);
      }

      if (result.success) {
        toast.success(t("已删除", "Deleted"));
        setDeletingEntry(null);
        fetchData();
      } else {
        toast.error(result.error || t("删除失败", "Failed to delete"));
      }
    } catch (error: any) {
      toast.error(error.message || t("删除失败", "Failed to delete"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      toast.error(t("请输入邮箱列表", "Please enter email list"));
      return;
    }

    const emails = parseEmailsFromText(bulkImportText);
    if (emails.length === 0) {
      toast.error(t("没有找到有效的邮箱地址", "No valid email addresses found"));
      return;
    }

    setIsBulkImporting(true);
    try {
      let result;
      if (isSupabaseConfigured) {
        result = await bulkImportEmails(emails);
      } else {
        result = mockBulkImportEmails(emails);
      }

      const message = t(
        `导入完成: ${result.success} 成功, ${result.failed} 失败`,
        `Import complete: ${result.success} succeeded, ${result.failed} failed`
      );

      if (result.failed === 0) {
        toast.success(message);
      } else {
        toast.warning(message);
        if (result.errors.length > 0) {
          console.log("Import errors:", result.errors);
        }
      }

      setShowBulkImportDialog(false);
      setBulkImportText("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || t("导入失败", "Failed to import"));
    } finally {
      setIsBulkImporting(false);
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <Shield className="w-3 h-3 mr-1" />
            {t("管理员", "Admin")}
          </Badge>
        );
      case "editor":
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Edit3 className="w-3 h-3 mr-1" />
            {t("编辑员", "Editor")}
          </Badge>
        );
      case "viewer":
        return (
          <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">
            <Eye className="w-3 h-3 mr-1" />
            {t("查看者", "Viewer")}
          </Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Get type badge
  const getTypeBadge = (isDomainPattern: boolean) => {
    if (isDomainPattern) {
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
          <Globe className="w-3 h-3 mr-1" />
          {t("域名", "Domain")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
        <Mail className="w-3 h-3 mr-1" />
        {t("邮箱", "Email")}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading state
  if (authLoading || (user?.role === "admin" && isLoading)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Access denied
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("登录白名单管理", "Login Allowlist Management")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("管理允许登录系统的邮箱和域名", "Manage emails and domains allowed to log in")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("搜索...", "Search...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            {t("批量导入", "Bulk Import")}
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("添加", "Add")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("总条目", "Total Entries")}
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("域名模式", "Domain Patterns")}
              </CardTitle>
              <Globe className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{stats.domainPatterns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("管理员默认", "Admin Default")}
              </CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.adminDefaults}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("编辑员默认", "Editor Default")}
              </CardTitle>
              <Edit3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.editorDefaults}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("查看者默认", "Viewer Default")}
              </CardTitle>
              <Eye className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{stats.viewerDefaults}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                {t("域名通配符说明", "Domain Wildcard Usage")}
              </p>
              <p>
                {t(
                  "使用 *@domain.com 格式允许整个域名的邮箱登录。例如 *@company.com 将允许所有 @company.com 的邮箱地址。较长的模式优先级更高。",
                  "Use *@domain.com format to allow all emails from a domain. For example, *@company.com allows all @company.com addresses. Longer patterns have higher priority."
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("邮箱/模式", "Email/Pattern")}</TableHead>
                <TableHead>{t("类型", "Type")}</TableHead>
                <TableHead>{t("默认角色", "Default Role")}</TableHead>
                <TableHead>{t("备注", "Notes")}</TableHead>
                <TableHead>{t("创建时间", "Created")}</TableHead>
                <TableHead className="text-right">{t("操作", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {searchQuery
                      ? t("没有找到匹配的条目", "No matching entries found")
                      : t("白名单为空", "Allowlist is empty")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.email}</TableCell>
                    <TableCell>{getTypeBadge(entry.is_domain_pattern)}</TableCell>
                    <TableCell>{getRoleBadge(entry.default_role)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-48 truncate">
                      {entry.notes || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingEntry(entry)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("添加白名单条目", "Add Allowlist Entry")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "添加邮箱地址或域名模式到白名单。使用 *@domain.com 允许整个域名。",
                "Add an email or domain pattern. Use *@domain.com to allow an entire domain."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("邮箱或域名模式", "Email or Domain Pattern")}</Label>
              <Input
                type="text"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com, *@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("默认角色", "Default Role")}</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      {t("管理员", "Admin")}
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-blue-500" />
                      {t("编辑员", "Editor")}
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      {t("查看者", "Viewer")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("备注（可选）", "Notes (Optional)")}</Label>
              <Input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={t("例如：外部顾问", "e.g., External consultant")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={isAdding}>
              {isAdding ? t("添加中...", "Adding...") : t("添加", "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              {t("编辑白名单条目", "Edit Allowlist Entry")}
            </DialogTitle>
            <DialogDescription className="font-mono">{editingEntry?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("默认角色", "Default Role")}</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      {t("管理员", "Admin")}
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4 text-blue-500" />
                      {t("编辑员", "Editor")}
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      {t("查看者", "Viewer")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("备注", "Notes")}</Label>
              <Input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t("可选备注", "Optional notes")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? t("保存中...", "Saving...") : t("保存", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEntry} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("确认删除", "Confirm Delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("确定要从白名单中删除", "Are you sure you want to remove")}{" "}
              <span className="font-mono font-medium">{deletingEntry?.email}</span>{" "}
              {t("吗？此操作无法撤销。", "from the allowlist? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("删除中...", "Deleting...") : t("删除", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("批量导入邮箱", "Bulk Import Emails")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "每行输入一个邮箱。可选格式: email, role, notes",
                "Enter one email per line. Optional format: email, role, notes"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("邮箱列表", "Email List")}</Label>
              <Textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder={`user1@example.com
user2@example.com, editor, Team member
*@company.com, viewer, Company domain`}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t("支持的格式:", "Supported formats:")}</p>
              <ul className="list-disc list-inside ml-2">
                <li>email@example.com</li>
                <li>email@example.com, role</li>
                <li>email@example.com, role, notes</li>
              </ul>
              <p>{t("角色可以是: admin, editor, viewer", "Role can be: admin, editor, viewer")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkImportDialog(false)}>
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={handleBulkImport} disabled={isBulkImporting}>
              {isBulkImporting ? t("导入中...", "Importing...") : t("导入", "Import")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
