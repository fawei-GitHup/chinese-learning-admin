"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAdminLocale } from "@/lib/admin-locale";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAllProfiles,
  searchProfiles,
  updateProfileRole,
  updateProfileStatus,
  fetchUserStats,
  type Profile,
  type UserStats,
} from "@/lib/supabase/admin-service";
import {
  mockFetchAllProfiles,
  mockSearchProfiles,
  mockUpdateProfileRole,
  mockUpdateProfileStatus,
  mockFetchUserStats,
  type MockProfile,
  type MockUserStats,
} from "@/lib/admin-mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Edit3,
  Eye,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCog,
  AlertTriangle,
} from "lucide-react";

type UserProfile = Profile | MockProfile;

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { locale } = useAdminLocale();

  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  // State
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats | MockUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "editor" | "viewer">("viewer");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      let fetchedProfiles: UserProfile[];
      let fetchedStats: UserStats | MockUserStats | null;

      if (isSupabaseConfigured) {
        // Try Supabase first, fall back to mock if it fails
        fetchedProfiles = await fetchAllProfiles();
        fetchedStats = await fetchUserStats();
        
        // If Supabase returns empty (RPC not set up), fall back to mock
        if (fetchedProfiles.length === 0 && !fetchedStats) {
          console.log("[Users] Supabase returned empty, using mock data");
          fetchedProfiles = mockFetchAllProfiles();
          fetchedStats = mockFetchUserStats();
        }
      } else {
        fetchedProfiles = mockFetchAllProfiles();
        fetchedStats = mockFetchUserStats();
      }

      setProfiles(fetchedProfiles);
      setStats(fetchedStats);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fall back to mock data on error
      console.log("[Users] Error fetching from Supabase, using mock data");
      setProfiles(mockFetchAllProfiles());
      setStats(mockFetchUserStats());
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
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.email.toLowerCase().includes(query) ||
          (p.name && p.name.toLowerCase().includes(query))
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((p) => p.role === roleFilter);
    }

    return result;
  }, [profiles, searchQuery, roleFilter]);

  // Pagination
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProfiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Open edit dialog
  const handleEdit = (profile: UserProfile) => {
    setEditingUser(profile);
    setEditRole(profile.role);
    setEditIsActive(profile.is_active);
  };

  // Save changes
  const handleSave = async () => {
    if (!editingUser) return;

    // Prevent self-role modification
    if (editingUser.id === user?.id && editRole !== editingUser.role) {
      toast.error(t("不能修改自己的角色", "Cannot modify your own role"));
      return;
    }

    setIsSaving(true);
    try {
      let roleResult: { success: boolean; error?: string };
      let statusResult: { success: boolean; error?: string };

      // Update role if changed
      if (editRole !== editingUser.role) {
        if (isSupabaseConfigured) {
          roleResult = await updateProfileRole(editingUser.id, editRole);
        } else {
          roleResult = mockUpdateProfileRole(editingUser.id, editRole);
        }

        if (!roleResult.success) {
          toast.error(roleResult.error || t("更新角色失败", "Failed to update role"));
          setIsSaving(false);
          return;
        }
      }

      // Update status if changed
      if (editIsActive !== editingUser.is_active) {
        if (isSupabaseConfigured) {
          statusResult = await updateProfileStatus(editingUser.id, editIsActive);
        } else {
          statusResult = mockUpdateProfileStatus(editingUser.id, editIsActive);
        }

        if (!statusResult.success) {
          toast.error(statusResult.error || t("更新状态失败", "Failed to update status"));
          setIsSaving(false);
          return;
        }
      }

      toast.success(t("用户已更新", "User updated"));
      setEditingUser(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || t("更新失败", "Update failed"));
    } finally {
      setIsSaving(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  // Get role badge color
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

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  // Access denied (non-admin trying to access)
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("用户管理", "User Management")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("管理系统用户和角色权限", "Manage users and role permissions")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("搜索用户...", "Search users...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("总用户数", "Total Users")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("管理员", "Admins")}
            </CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.admin_count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("编辑员", "Editors")}
            </CardTitle>
            <Edit3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats?.editor_count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("查看者", "Viewers")}
            </CardTitle>
            <Eye className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats?.viewer_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("筛选:", "Filter:")}</span>
        <div className="flex gap-1">
          {["all", "admin", "editor", "viewer"].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role === "all"
                ? t("全部", "All")
                : role === "admin"
                ? t("管理员", "Admin")
                : role === "editor"
                ? t("编辑员", "Editor")
                : t("查看者", "Viewer")}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("用户", "User")}</TableHead>
                <TableHead>{t("邮箱", "Email")}</TableHead>
                <TableHead>{t("角色", "Role")}</TableHead>
                <TableHead>{t("状态", "Status")}</TableHead>
                <TableHead>{t("最后登录", "Last Login")}</TableHead>
                <TableHead>{t("创建时间", "Created")}</TableHead>
                <TableHead className="text-right">{t("操作", "Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {t("没有找到用户", "No users found")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {profile.avatar_url && (
                            <AvatarImage src={profile.avatar_url} alt={profile.name || profile.email} />
                          )}
                          <AvatarFallback className="text-xs">
                            {getInitials(profile.name, profile.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {profile.name || t("未设置", "Not set")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                    <TableCell>{getRoleBadge(profile.role)}</TableCell>
                    <TableCell>
                      {profile.is_active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                          {t("激活", "Active")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                          {t("禁用", "Disabled")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(profile.last_login_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(profile.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(profile)}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              {t("编辑用户", "Edit User")}
            </DialogTitle>
            <DialogDescription>
              {editingUser?.email}
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  {editingUser.avatar_url && (
                    <AvatarImage src={editingUser.avatar_url} alt={editingUser.name || editingUser.email} />
                  )}
                  <AvatarFallback>
                    {getInitials(editingUser.name, editingUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingUser.name || t("未设置姓名", "Name not set")}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>

              {/* Self-edit warning */}
              {editingUser.id === user?.id && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-500">
                    {t(
                      "这是您自己的账户。您不能修改自己的角色。",
                      "This is your own account. You cannot modify your own role."
                    )}
                  </p>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>{t("角色", "Role")}</Label>
                <Select
                  value={editRole}
                  onValueChange={(v) => setEditRole(v as "admin" | "editor" | "viewer")}
                  disabled={editingUser.id === user?.id}
                >
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

              {/* Status Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("账户状态", "Account Status")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {editIsActive
                      ? t("账户已激活，用户可以登录", "Account is active, user can log in")
                      : t("账户已禁用，用户无法登录", "Account is disabled, user cannot log in")}
                  </p>
                </div>
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                  disabled={editingUser.id === user?.id}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("保存中...", "Saving...") : t("保存", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
