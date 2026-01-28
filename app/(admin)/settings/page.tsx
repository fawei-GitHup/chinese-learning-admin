"use client";

import { useState, useEffect } from "react";
import {
  User,
  Users,
  GitBranch,
  Plug,
  Save,
  RefreshCw,
  Plus,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Database,
  Webhook,
  Search as SearchIcon,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, canManageTeam, canChangeSettings } from "@/lib/auth-context";
import {
  type UserRole,
  type TeamMember,
  type WorkflowRule,
  mockTeamMembers,
  mockWorkflowRules,
} from "@/lib/mock/data";
import { toast } from "sonner";
import { useAdminLocale } from "@/lib/admin-locale";

export default function SettingsPage() {
  const { user, switchRole } = useAuth();
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  const [activeTab, setActiveTab] = useState("account");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");

  // Workflow state
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>(mockWorkflowRules);

  // Load from localStorage
  useEffect(() => {
    const storedTeam = localStorage.getItem("admin_team_members");
    if (storedTeam) {
      try {
        setTeamMembers(JSON.parse(storedTeam));
      } catch {
        // ignore
      }
    }
    const storedWorkflow = localStorage.getItem("admin_workflow_rules");
    if (storedWorkflow) {
      try {
        setWorkflowRules(JSON.parse(storedWorkflow));
      } catch {
        // ignore
      }
    }
  }, []);

  const saveTeamMembers = (members: TeamMember[]) => {
    setTeamMembers(members);
    localStorage.setItem("admin_team_members", JSON.stringify(members));
  };

  const saveWorkflowRules = (rules: WorkflowRule[]) => {
    setWorkflowRules(rules);
    localStorage.setItem("admin_workflow_rules", JSON.stringify(rules));
  };

  const handleSaveSettings = async () => {
    if (!user || !canChangeSettings(user.role)) {
      toast.error("You don't have permission", { description: "Only admins can change settings." });
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success(t("设置已保存", "Settings saved"), { description: t("您的设置已成功更新。", "Your settings have been updated successfully.") });
  };

  const handleResetData = () => {
    if (!user || user.role !== "admin") {
      toast.error(t("没有权限", "You don't have permission"), { description: t("只有管理员可以重置数据。", "Only admins can reset data.") });
      return;
    }
    setIsResetDialogOpen(true);
  };

  const confirmResetData = () => {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("admin_"));
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    setIsResetDialogOpen(false);
    toast.success(t("数据已重置", "Data reset"), { description: t("所有模拟数据已重置，请刷新页面。", "All mock data has been reset. Refresh the page.") });
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleInviteMember = () => {
    if (!inviteEmail) {
      toast.error(t("需要邮箱地址", "Email required"));
      return;
    }
    if (teamMembers.some((m) => m.email === inviteEmail)) {
      toast.error(t("成员已存在", "Member already exists"));
      return;
    }

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    saveTeamMembers([...teamMembers, newMember]);
    setInviteEmail("");
    setInviteRole("viewer");
    setIsInviteDialogOpen(false);
    toast.success(t("邀请已发送", "Invitation sent"), { description: t(`已将 ${inviteEmail} 邀请为 ${inviteRole}。`, `Invited ${inviteEmail} as ${inviteRole}.`) });
  };

  const handleUpdateMemberRole = (memberId: string, newRole: UserRole) => {
    if (!user || !canManageTeam(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      return;
    }
    const updated = teamMembers.map((m) => (m.id === memberId ? { ...m, role: newRole } : m));
    saveTeamMembers(updated);
    toast.success(t("角色已更新", "Role updated"));
  };

  const handleRemoveMember = (memberId: string) => {
    if (!user || !canManageTeam(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      return;
    }
    saveTeamMembers(teamMembers.filter((m) => m.id !== memberId));
    toast.success(t("成员已移除", "Member removed"));
  };

  const handleToggleWorkflowRule = (ruleId: string) => {
    if (!user || !canChangeSettings(user.role)) {
      toast.error(t("没有权限", "You don't have permission"));
      return;
    }
    const updated = workflowRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    saveWorkflowRules(updated);
    toast.success(t("工作流规则已更新", "Workflow rule updated"));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-primary/20 text-primary border-primary/30";
      case "editor":
        return "bg-accent/20 text-accent border-accent/30";
      case "viewer":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("今天", "Today");
    if (diffDays === 1) return t("昨天", "Yesterday");
    if (diffDays < 7) return t(`${diffDays} 天前`, `${diffDays} days ago`);
    return formatDate(dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("设置", "Settings")}</h1>
        <p className="text-muted-foreground">{t("管理您的账户、团队和系统偏好设置", "Manage your account, team, and system preferences")}</p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-card border-border/50 rounded-xl p-1">
          <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-primary/20">
            <User className="mr-2 h-4 w-4" />
            {t("账户", "Account")}
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-primary/20">
            <Users className="mr-2 h-4 w-4" />
            {t("团队", "Team")}
          </TabsTrigger>
          <TabsTrigger value="workflow" className="rounded-lg data-[state=active]:bg-primary/20">
            <GitBranch className="mr-2 h-4 w-4" />
            {t("工作流", "Workflow")}
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:bg-primary/20">
            <Plug className="mr-2 h-4 w-4" />
            {t("集成", "Integrations")}
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-foreground">{t("个人资料设置", "Profile Settings")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("您的账户信息和偏好设置", "Your account information and preferences")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 text-3xl font-bold text-primary">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge className={`mt-2 ${getRoleBadgeColor(user?.role || "viewer")}`}>
                    {user?.role === "admin" ? t("管理员", "Admin") : user?.role === "editor" ? t("编辑", "Editor") : t("查看者", "Viewer")}
                  </Badge>
                </div>
              </div>

              {/* Role Switcher (for demo) */}
              <div className="rounded-xl bg-secondary/30 p-4 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{t("切换角色（演示）", "Switch Role (Demo)")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("测试不同的权限级别", "Test different permission levels")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={user?.role === "admin" ? "default" : "outline"}
                    onClick={() => switchRole("admin")}
                    className={`rounded-xl ${
                      user?.role === "admin"
                        ? "bg-primary"
                        : "bg-transparent border-primary/30 text-primary hover:bg-primary/10"
                    }`}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {t("管理员", "Admin")}
                  </Button>
                  <Button
                    variant={user?.role === "editor" ? "default" : "outline"}
                    onClick={() => switchRole("editor")}
                    className={`rounded-xl ${
                      user?.role === "editor"
                        ? "bg-accent text-accent-foreground"
                        : "bg-transparent border-accent/30 text-accent hover:bg-accent/10"
                    }`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t("编辑", "Editor")}
                  </Button>
                  <Button
                    variant={user?.role === "viewer" ? "default" : "outline"}
                    onClick={() => switchRole("viewer")}
                    className={`rounded-xl ${
                      user?.role === "viewer"
                        ? "bg-muted text-foreground"
                        : "bg-transparent border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t("查看者", "Viewer")}
                  </Button>
                </div>
              </div>

              {/* Role Descriptions */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t("角色权限", "Role Permissions")}</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-primary/10 p-4 border border-primary/20">
                    <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                      {t("管理员", "Admin")}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {t("完全访问权限：创建、编辑、审核、发布、删除。管理用户和设置。", "Full access: Create, edit, review, publish, delete. Manage users and settings.")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-accent/10 p-4 border border-accent/20">
                    <Badge className="bg-accent/20 text-accent border-accent/30 mb-2">
                      {t("编辑", "Editor")}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {t("创建、编辑、提交审核。无法发布或删除。", "Create, edit, submit for review. Cannot publish or delete.")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-4 border border-border/30">
                    <Badge className="bg-muted text-muted-foreground border-muted mb-2">
                      {t("查看者", "Viewer")}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {t("只读访问。可以查看所有内容但无法进行更改。", "Read-only access. Can view all content but cannot make changes.")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass-card border-destructive/30 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-destructive">{t("危险区域", "Danger Zone")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("不可逆操作，请谨慎操作。", "Irreversible actions. Proceed with caution.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t("重置模拟数据", "Reset Mock Data")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("清除所有本地存储并重置为默认模拟数据", "Clear all localStorage and reset to default mock data")}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleResetData}
                  disabled={!user || user.role !== "admin"}
                  className="rounded-xl"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("重置数据", "Reset Data")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">{t("团队成员", "Team Members")}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t("管理您的团队及其权限", "Manage your team and their permissions")}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsInviteDialogOpen(true)}
                  disabled={!user || !canManageTeam(user.role)}
                  className="rounded-xl bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("邀请成员", "Invite Member")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl bg-secondary/30 p-4 border border-border/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 font-semibold text-primary">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground hidden md:block">
                        <p>{t("加入于", "Joined")} {formatDate(member.joinedAt)}</p>
                        <p>{t("活跃", "Active")} {formatRelativeTime(member.lastActive)}</p>
                      </div>
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateMemberRole(member.id, value as UserRole)
                        }
                        disabled={!user || !canManageTeam(user.role)}
                      >
                        <SelectTrigger className="w-28 bg-secondary/50 border-border/50 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/50 rounded-xl">
                          <SelectItem value="admin">{t("管理员", "Admin")}</SelectItem>
                          <SelectItem value="editor">{t("编辑", "Editor")}</SelectItem>
                          <SelectItem value="viewer">{t("查看者", "Viewer")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={!user || !canManageTeam(user.role)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="glass-card border-border/50 rounded-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("移除", "Remove")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-foreground">{t("审核工作流", "Review Workflow")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("配置内容如何通过审核流程", "Configure how content moves through the review process")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Workflow Diagram */}
              <div className="rounded-xl bg-secondary/30 p-6 border border-border/30">
                <h4 className="font-medium text-foreground mb-4">{t("内容生命周期", "Content Lifecycle")}</h4>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Badge className="bg-warning/20 text-warning border-warning/30 px-4 py-2">
                    {t("草稿", "Draft")}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
                    {t("审核中", "In Review")}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge className="bg-success/20 text-success border-success/30 px-4 py-2">
                    {t("已发布", "Published")}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge className="bg-muted text-muted-foreground px-4 py-2">
                    {t("已归档", "Archived")}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">{t("编辑创建", "Editor creates")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">{t("编辑提交", "Editor submits")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">{t("管理员批准", "Admin approves")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">{t("管理员/编辑归档", "Admin/Editor archives")}</p>
                  </div>
                </div>
              </div>

              {/* Workflow Rules */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{t("工作流规则", "Workflow Rules")}</h4>
                {workflowRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-xl bg-secondary/30 p-4 border border-border/30"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          rule.enabled
                            ? "bg-success/20 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rule.enabled ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleWorkflowRule(rule.id)}
                      disabled={!user || !canChangeSettings(user.role)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-foreground">{t("集成", "Integrations")}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("连接外部服务以增强您的工作流程", "Connect external services to enhance your workflow")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supabase */}
              <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4 border border-border/30">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3ECF8E]/20">
                    <Database className="h-6 w-6 text-[#3ECF8E]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Supabase</p>
                    <p className="text-sm text-muted-foreground">
                      {t("数据库、认证和存储", "Database, authentication, and storage")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl bg-transparent"
                  disabled
                >
                  {t("即将推出", "Coming Soon")}
                </Button>
              </div>

              {/* Webhook */}
              <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4 border border-border/30">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                    <Webhook className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Webhooks</p>
                    <p className="text-sm text-muted-foreground">
                      {t("在内容更改时触发外部操作", "Trigger external actions on content changes")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl bg-transparent"
                  disabled
                >
                  {t("即将推出", "Coming Soon")}
                </Button>
              </div>

              {/* Search */}
              <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-4 border border-border/30">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                    <SearchIcon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("搜索集成", "Search Integration")}</p>
                    <p className="text-sm text-muted-foreground">
                      Algolia, Meilisearch, {t("或", "or")} Typesense
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl bg-transparent"
                  disabled
                >
                  {t("即将推出", "Coming Soon")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving || !user || !canChangeSettings(user.role)}
          className="rounded-xl bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              {t("保存中...", "Saving...")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("保存设置", "Save Settings")}
            </>
          )}
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("重置所有数据", "Reset All Data")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t(
                "这将清除所有本地存储数据并重置为默认模拟数据。此操作无法撤销，您确定吗？",
                "This will clear all localStorage data and reset everything to the default mock data. This action cannot be undone. Are you sure?"
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              className="rounded-xl bg-transparent"
            >
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={confirmResetData} variant="destructive" className="rounded-xl">
              {t("重置所有数据", "Reset All Data")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="glass-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("邀请团队成员", "Invite Team Member")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t(
                "发送邀请加入您的团队。他们将收到包含登录说明的邮件。",
                "Send an invitation to join your team. They will receive an email with login instructions."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("邮箱地址", "Email Address")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="bg-secondary/50 border-border/50 rounded-xl pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("角色", "Role")}</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-border/50 rounded-xl">
                  <SelectItem value="admin">{t("管理员 - 完全访问", "Admin - Full access")}</SelectItem>
                  <SelectItem value="editor">{t("编辑 - 创建和编辑", "Editor - Create & edit")}</SelectItem>
                  <SelectItem value="viewer">{t("查看者 - 只读", "Viewer - Read only")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
              className="rounded-xl bg-transparent"
            >
              {t("取消", "Cancel")}
            </Button>
            <Button onClick={handleInviteMember} className="rounded-xl bg-primary hover:bg-primary/90">
              <Mail className="mr-2 h-4 w-4" />
              {t("发送邀请", "Send Invitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
