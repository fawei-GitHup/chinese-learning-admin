"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Stethoscope,
  Languages,
  ImageIcon,
  Search,
  Settings,
  ChevronDown,
  Globe,
  BookMarked,
  Theater,
  Rocket,
  HeartPulse,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useAdminLocale } from "@/lib/admin-locale";
import { useAuth } from "@/lib/auth-context";

type UserRole = "admin" | "editor" | "viewer";

export function AdminSidebar() {
  const pathname = usePathname();
  const [contentOpen, setContentOpen] = useState(true);
  const { locale } = useAdminLocale();
  const { hasPermission } = useAuth();

  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  const contentItems = [
    { title: t("课程", "Lessons"), href: "/content/lessons", icon: BookOpen },
    { title: t("阅读", "Readings"), href: "/content/readings", icon: FileText },
    { title: t("医学对话", "Medical Dialogs"), href: "/content/medical-dialogs", icon: Stethoscope },
    { title: t("语法", "Grammar"), href: "/content/grammar", icon: Languages },
    { title: t("医学词典", "Medical Lexicon"), href: "/content/lexicon", icon: BookMarked },
    { title: t("医疗词汇", "Medical Lexicon WB"), href: "/content/medical-lexicon", icon: HeartPulse },
    { title: t("医学情景", "Scenarios"), href: "/content/scenarios", icon: Theater },
    { title: t("医疗场景", "Medical Scenarios"), href: "/content/medical-scenario", icon: Theater },
  ];

  const mainItems = [
    { title: t("仪表盘", "Dashboard"), href: "/dashboard", icon: LayoutDashboard },
  ];

  const allBottomItems: { title: string; href: string; icon: any; roles: UserRole[]; }[] = [
    { title: t("资源", "Assets"), href: "/assets", icon: ImageIcon, roles: ["admin", "editor"] },
    { title: t("SEO 工具", "SEO Tools"), href: "/seo", icon: Search, roles: ["admin", "editor"] },
    { title: t("SEO / GEO", "SEO / GEO"), href: "/seo-geo", icon: Globe, roles: ["admin", "editor"] },
    { title: t("发布中心", "Publish Center"), href: "/publish-center", icon: Rocket, roles: ["admin"] },
    { title: t("用户管理", "User Management"), href: "/users", icon: Users, roles: ["admin"] },
    { title: t("设置", "Settings"), href: "/settings", icon: Settings, roles: ["admin"] },
  ];

  const bottomItems = allBottomItems.filter(item => hasPermission(item.roles));

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isContentActive = hasPermission(["admin", "editor"]) && contentItems.some((item) => isActive(item.href));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 glass-card border-r border-border/50">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            C
          </div>
          <span className="text-lg font-semibold text-foreground">
            {t("中文管理后台", "Chinese Admin")}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {/* Main Items */}
          {mainItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}

          {/* Content Section */}
          {hasPermission(["admin", "editor"]) && (
            <Collapsible open={contentOpen} onOpenChange={setContentOpen}>
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  isContentActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  {t("内容管理", "Content")}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    contentOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-4 mt-1 space-y-1">
                {contentItems.map((item) => (
  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all",
                      isActive(item.href)
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="my-4 border-t border-border/30" />

          {/* Bottom Items */}
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-4">
          <p className="text-xs text-muted-foreground text-center">
            {t("管理后台 v1.0", "Admin Console v1.0")}
          </p>
        </div>
      </div>
    </aside>
  );
}
