"use client";

import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User, ChevronDown, Languages } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useAdminLocale, useTranslation } from "@/lib/admin-locale";

export function AdminTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { locale, setLocale } = useAdminLocale();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
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

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 glass border-b border-border/50">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={locale === "zh" ? "搜索内容、资源、设置..." : "Search content, assets, settings..."}
            className="pl-10 bg-secondary/50 border-border/50 rounded-xl focus:bg-secondary/80"
          />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Locale Toggle */}
          <div className="flex items-center rounded-xl border border-border/50 bg-secondary/30 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale("zh")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                locale === "zh"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              中文
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocale("en")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                locale === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </Button>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              3
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-secondary/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-foreground">
                    {user?.name || "User"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${getRoleBadgeColor(user?.role || "viewer")}`}
                  >
                    {user?.role || "viewer"}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 glass-card border-border/50 rounded-xl"
            >
              <DropdownMenuLabel className="text-muted-foreground">
                {locale === "zh" ? "我的账户" : "My Account"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem className="rounded-lg cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                {locale === "zh" ? "个人资料" : "Profile"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem
                className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {locale === "zh" ? "退出登录" : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
