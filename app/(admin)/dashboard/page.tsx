"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Stethoscope,
  Languages,
  TrendingUp,
  Clock,
  Eye,
  PenLine,
  Plus,
  AlertTriangle,
  CheckCircle,
  Archive,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLessons,
  getReadings,
  getMedicalDialogs,
  getGrammarRules,
} from "@/lib/mock/storage";
import type { Lesson, Reading, MedicalDialog, GrammarRule } from "@/lib/mock/data";
import { useAuth } from "@/lib/auth-context";
import { useAdminLocale } from "@/lib/admin-locale";

interface Stats {
  totalItems: number;
  publishedContent: number;
  draftContent: number;
  inReviewContent: number;
  archivedContent: number;
  sevenDayEdits: number;
  sevenDayViews: number;
}

type RecentItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: string;
  author: string;
};

interface ContentHealth {
  missingSEOTitle: number;
  missingFAQ: number;
  missingGEOSnippet: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  const [stats, setStats] = useState<Stats>({
    totalItems: 0,
    publishedContent: 0,
    draftContent: 0,
    inReviewContent: 0,
    archivedContent: 0,
    sevenDayEdits: 0,
    sevenDayViews: 0,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [contentHealth, setContentHealth] = useState<ContentHealth>({
    missingSEOTitle: 0,
    missingFAQ: 0,
    missingGEOSnippet: 0,
  });

  useEffect(() => {
    const lessons = getLessons();
    const readings = getReadings();
    const dialogs = getMedicalDialogs();
    const grammar = getGrammarRules();

    const allContent = [
      ...lessons.map((l) => ({ ...l, type: "Lesson" })),
      ...readings.map((r) => ({ ...r, type: "Reading" })),
      ...dialogs.map((d) => ({ ...d, type: "Medical Dialog" })),
      ...grammar.map((g) => ({ ...g, type: "Grammar" })),
    ];

    const published = allContent.filter((c) => c.status === "published").length;
    const draft = allContent.filter((c) => c.status === "draft").length;
    const inReview = allContent.filter((c) => c.status === "in_review").length;
    const archived = allContent.filter((c) => c.status === "archived").length;

    // Calculate 7-day edits (mock: count items updated in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentEdits = allContent.filter(
      (c) => new Date(c.updatedAt) >= sevenDaysAgo
    ).length;

    // Mock 7-day views (random but consistent)
    const mockViews = Math.floor(allContent.length * 45 + 120);

    setStats({
      totalItems: allContent.length,
      publishedContent: published,
      draftContent: draft,
      inReviewContent: inReview,
      archivedContent: archived,
      sevenDayEdits: recentEdits,
      sevenDayViews: mockViews,
    });

    // Get recent items with author info
    const recent = allContent
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        updatedAt: item.updatedAt,
        author: item.author,
      }));
    setRecentItems(recent);

    // Calculate content health (mock data - assume some items are missing fields)
    setContentHealth({
      missingSEOTitle: Math.floor(allContent.length * 0.2),
      missingFAQ: Math.floor(allContent.length * 0.35),
      missingGEOSnippet: Math.floor(allContent.length * 0.45),
    });
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-success/20 text-success border-success/30">Published</Badge>;
      case "draft":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Draft</Badge>;
      case "in_review":
        return <Badge className="bg-primary/20 text-primary border-primary/30">In Review</Badge>;
      case "archived":
        return <Badge className="bg-muted text-muted-foreground border-muted">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Lesson":
        return <BookOpen className="h-4 w-4 text-primary" />;
      case "Reading":
        return <FileText className="h-4 w-4 text-accent" />;
      case "Medical Dialog":
        return <Stethoscope className="h-4 w-4 text-chart-3" />;
      case "Grammar":
        return <Languages className="h-4 w-4 text-chart-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const kpiCards = [
    { title: t("内容总数", "Total Items"), value: stats.totalItems, icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10" },
    { title: t("草稿", "Draft"), value: stats.draftContent, icon: PenLine, color: "text-warning", bgColor: "bg-warning/10" },
    { title: t("审核中", "In Review"), value: stats.inReviewContent, icon: Clock, color: "text-primary", bgColor: "bg-primary/10" },
    { title: t("已发布", "Published"), value: stats.publishedContent, icon: CheckCircle, color: "text-success", bgColor: "bg-success/10" },
    { title: t("7天编辑", "7-day Edits"), value: stats.sevenDayEdits, icon: Eye, color: "text-accent", bgColor: "bg-accent/10" },
  ];

  const quickActions = [
    { title: t("新建课程", "New Lesson"), href: "/content/lessons", icon: BookOpen, color: "bg-primary/20 text-primary" },
    { title: t("新建阅读", "New Reading"), href: "/content/readings", icon: FileText, color: "bg-accent/20 text-accent" },
    { title: t("新建对话", "New Medical Dialog"), href: "/content/medical-dialogs", icon: Stethoscope, color: "bg-chart-4/20 text-chart-4" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("仪表盘", "Dashboard")}</h1>
        <p className="text-muted-foreground mt-1">
          {t(`欢迎回来，${user?.name}！这是您的内容概览。`, `Welcome back, ${user?.name}! Here's an overview of your content.`)}
        </p>
      </div>
      <Badge variant="outline" className="text-sm px-3 py-1">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Badge>
      {/* Overview KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((stat) => (
          <Card key={stat.title} className="glass-card border-border/50 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Table - Takes 2 columns */}
        <Card className="glass-card border-border/50 rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              {t("最近活动", "Recent Activity")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t("团队的最新内容更新", "Latest content updates from your team")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Updated</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Editor</th>
                  </tr>
                </thead>
                <tbody>
                  {recentItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <span className="font-medium text-foreground">{item.title}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="text-sm text-muted-foreground">{item.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">{item.author}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Right sidebar */}
        <div className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Plus className="h-5 w-5 text-primary" />
                {t("快捷操作", "Quick Actions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.title}
                    asChild
                    className={`w-full justify-start gap-3 rounded-xl ${action.color} text-primary-foreground`}
                  >
                    <Link href={action.href}>
                      <Icon className="h-4 w-4" />
                      {action.title}
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Content Health Card */}
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-warning" />
                {t("内容健康", "Content Health")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("缺失字段提醒", "Missing field reminders")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-sm text-foreground">{t("无 SEO 标题", "No SEO Title")}</span>
                </div>
                <Badge variant="outline" className="border-destructive/30 text-destructive">
                  {contentHealth.missingSEOTitle}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-sm text-foreground">{t("无 FAQ", "No FAQ")}</span>
                </div>
                <Badge variant="outline" className="border-warning/30 text-warning">
                  {contentHealth.missingFAQ}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-sm text-foreground">{t("无 GEO 片段", "No GEO Snippet")}</span>
                </div>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  {contentHealth.missingGEOSnippet}
                </Badge>
              </div>
              <Button variant="outline" className="w-full rounded-xl mt-2 bg-transparent" asChild>
                <Link href="/seo">{t("查看所有问题", "View All Issues")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {getLessons().length}
                </p>
                <p className="text-sm text-muted-foreground">{t("课程", "Lessons")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {getReadings().length}
                </p>
                <p className="text-sm text-muted-foreground">{t("阅读", "Readings")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-3/10">
                <Stethoscope className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {getMedicalDialogs().length}
                </p>
                <p className="text-sm text-muted-foreground">{t("医学对话", "Medical Dialogs")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-4/10">
                <Languages className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {getGrammarRules().length}
                </p>
                <p className="text-sm text-muted-foreground">{t("语法规则", "Grammar Rules")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
