"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Rocket,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  BookMarked,
  Languages,
  Theater,
  Clock,
  Info,
  ExternalLink,
  Database,
  Sparkles,
  Stethoscope,
  CheckSquare,
  Square,
  Archive,
  Upload,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useAdminLocale } from "@/lib/admin-locale";
import { useAuth, canPublish, canArchive } from "@/lib/auth-context";
import {
  validatePublishing,
  calculatePublishingStats,
  getSeverity,
  type ContentRow,
  type ValidationResult,
} from "@/lib/publishing";
import { fetchAllContent, fetchRecentlyPublished, batchPublish, batchArchive, type FetchResult, type BatchOperationResult } from "./actions";
import { toast } from "sonner";
import Link from "next/link";

interface ProblematicRow extends ContentRow {
  type: "lexicon" | "grammar" | "scenario" | "medical_lexicon";
  validation: ValidationResult;
}

interface SelectableRow extends ContentRow {
  type: "lexicon" | "grammar" | "scenario" | "medical_lexicon";
}

type BatchAction = "publish" | "archive";

export default function PublishCenterPage() {
  const { locale } = useAdminLocale();
  const { user } = useAuth();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<FetchResult | null>(null);
  const [recentlyPublished, setRecentlyPublished] = useState<Array<ContentRow & { type: string }>>([]);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  // Batch operation state
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [pendingBatchAction, setPendingBatchAction] = useState<BatchAction | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchResult, setBatchResult] = useState<BatchOperationResult | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [contentResult, recentResult] = await Promise.all([
        fetchAllContent(),
        fetchRecentlyPublished(),
      ]);
      setData(contentResult);
      setRecentlyPublished(recentResult.items);
      if (contentResult.error) {
        toast.warning(locale === "zh" ? "使用本地数据" : "Using local data", {
          description: contentResult.error,
        });
      }
    } catch {
      toast.error(locale === "zh" ? "加载失败" : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get all content rows for selection
  const allRows = useMemo<SelectableRow[]>(() => {
    if (!data) return [];
    const rows: SelectableRow[] = [];
    
    for (const item of data.lexicon) {
      rows.push({ ...item, type: "lexicon" });
    }
    for (const item of data.grammar) {
      rows.push({ ...item, type: "grammar" });
    }
    for (const item of data.scenarios) {
      rows.push({ ...item, type: "scenario" });
    }
    for (const item of data.medicalLexicon) {
      rows.push({ ...item, type: "medical_lexicon" });
    }
    
    return rows;
  }, [data]);

  // Filter rows by status for batch operations
  const publishableRows = useMemo(() => 
    allRows.filter(row => row.publishing.status === "draft" || row.publishing.status === "in_review"),
  [allRows]);
  
  const archivableRows = useMemo(() => 
    allRows.filter(row => row.publishing.status === "published"),
  [allRows]);

  // Selected items grouped by action type
  const selectedForPublish = useMemo(() => 
    Array.from(selectedIds).filter(id => 
      publishableRows.some(row => row.id === id)
    ),
  [selectedIds, publishableRows]);

  const selectedForArchive = useMemo(() => 
    Array.from(selectedIds).filter(id => 
      archivableRows.some(row => row.id === id)
    ),
  [selectedIds, archivableRows]);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === allRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allRows.map(row => row.id)));
    }
  }, [allRows, selectedIds.size]);

  const handleSelectRow = useCallback((id: string, index: number, shiftKey: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      
      // Shift+Click for range selection
      if (shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        for (let i = start; i <= end; i++) {
          newSet.add(allRows[i].id);
        }
      } else {
        // Toggle single selection
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      }
      
      return newSet;
    });
    setLastSelectedIndex(index);
  }, [allRows, lastSelectedIndex]);

  // Batch action handlers
  const handleBatchPublishClick = useCallback(() => {
    if (selectedForPublish.length === 0) {
      toast.error(t("没有可发布的选中项", "No publishable items selected"), {
        description: t("请选择状态为 draft 或 in_review 的内容", "Please select items with draft or in_review status"),
      });
      return;
    }
    setPendingBatchAction("publish");
    setBatchDialogOpen(true);
  }, [selectedForPublish.length, t]);

  const handleBatchArchiveClick = useCallback(() => {
    if (selectedForArchive.length === 0) {
      toast.error(t("没有可归档的选中项", "No archivable items selected"), {
        description: t("请选择状态为 published 的内容", "Please select items with published status"),
      });
      return;
    }
    setPendingBatchAction("archive");
    setBatchDialogOpen(true);
  }, [selectedForArchive.length, t]);

  const handleConfirmBatchAction = useCallback(async () => {
    if (!pendingBatchAction || !user) return;

    const contentIds = pendingBatchAction === "publish" ? selectedForPublish : selectedForArchive;
    
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: contentIds.length });
    
    try {
      let result: BatchOperationResult;
      
      if (pendingBatchAction === "publish") {
        result = await batchPublish(contentIds, user.id);
      } else {
        result = await batchArchive(contentIds, user.id);
      }
      
      setBatchResult(result);
      
      // Show result toast
      if (result.failed.length === 0) {
        toast.success(
          t(`成功${pendingBatchAction === "publish" ? "发布" : "归档"} ${result.success.length} 项`, 
            `Successfully ${pendingBatchAction === "publish" ? "published" : "archived"} ${result.success.length} items`)
        );
      } else {
        toast.warning(
          t(`${result.success.length} 项成功，${result.failed.length} 项失败`,
            `${result.success.length} succeeded, ${result.failed.length} failed`)
        );
      }
      
      // Clear selection and refresh data
      setSelectedIds(new Set());
      await loadData();
    } catch (err) {
      toast.error(t("批量操作失败", "Batch operation failed"), {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress(null);
      setBatchDialogOpen(false);
      setPendingBatchAction(null);
    }
  }, [pendingBatchAction, user, selectedForPublish, selectedForArchive, loadData, t]);

  // Permission checks
  const canPerformPublish = user ? canPublish(user.role) : false;
  const canPerformArchive = user ? canArchive(user.role) : false;

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats using validatePublishing
  const lexiconStats = calculatePublishingStats(data.lexicon);
  const grammarStats = calculatePublishingStats(data.grammar);
  const scenarioStats = calculatePublishingStats(data.scenarios);
  const medicalLexiconStats = calculatePublishingStats(data.medicalLexicon);

  const totalStats = {
    total: lexiconStats.total + grammarStats.total + scenarioStats.total + medicalLexiconStats.total,
    publishable: lexiconStats.publishable + grammarStats.publishable + scenarioStats.publishable + medicalLexiconStats.publishable,
    publishablePercent:
      lexiconStats.total + grammarStats.total + scenarioStats.total + medicalLexiconStats.total > 0
        ? Math.round(
            ((lexiconStats.publishable + grammarStats.publishable + scenarioStats.publishable + medicalLexiconStats.publishable) /
              (lexiconStats.total + grammarStats.total + scenarioStats.total + medicalLexiconStats.total)) *
              100
          )
        : 0,
    missingSEO: lexiconStats.missingSEO + grammarStats.missingSEO + scenarioStats.missingSEO + medicalLexiconStats.missingSEO,
    missingGEO: lexiconStats.missingGEO + grammarStats.missingGEO + scenarioStats.missingGEO + medicalLexiconStats.missingGEO,
  };

  // Get problematic rows
  const getProblematicRows = (): ProblematicRow[] => {
    const rows: ProblematicRow[] = [];

    for (const item of data.lexicon) {
      const validation = validatePublishing(item.publishing);
      if (!validation.isPublishable) {
        rows.push({ ...item, type: "lexicon", validation });
      }
    }
    for (const item of data.grammar) {
      const validation = validatePublishing(item.publishing);
      if (!validation.isPublishable) {
        rows.push({ ...item, type: "grammar", validation });
      }
    }
    for (const item of data.scenarios) {
      const validation = validatePublishing(item.publishing);
      if (!validation.isPublishable) {
        rows.push({ ...item, type: "scenario", validation });
      }
    }
    for (const item of data.medicalLexicon) {
      const validation = validatePublishing(item.publishing);
      if (!validation.isPublishable) {
        rows.push({ ...item, type: "medical_lexicon", validation });
      }
    }

    return rows;
  };

  const problematicRows = getProblematicRows();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lexicon":
        return <BookMarked className="h-4 w-4 text-primary" />;
      case "grammar":
        return <Languages className="h-4 w-4 text-accent" />;
      case "scenario":
        return <Theater className="h-4 w-4 text-chart-4" />;
      case "medical_lexicon":
        return <Stethoscope className="h-4 w-4 text-chart-3" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "lexicon":
        return t("词典", "Lexicon");
      case "grammar":
        return t("语法", "Grammar");
      case "scenario":
        return t("情景", "Scenario");
      case "medical_lexicon":
        return t("医疗词汇", "Medical Lexicon");
      default:
        return type;
    }
  };

  const getEditLink = (type: string) => {
    switch (type) {
      case "lexicon":
        return "/content/lexicon";
      case "grammar":
        return "/content/grammar";
      case "scenario":
        return "/content/scenarios";
      case "medical_lexicon":
        return "/content/medical-lexicon";
      default:
        return "/content";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTitle = (item: ContentRow) => {
    return item.title || item.term || item.slug;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("已发布", "Published")}
          </Badge>
        );
      case "in_review":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            <Clock className="mr-1 h-3 w-3" />
            {t("待审核", "In Review")}
          </Badge>
        );
      case "archived":
        return (
          <Badge className="bg-muted/50 text-muted-foreground border-muted">
            <Archive className="mr-1 h-3 w-3" />
            {t("已归档", "Archived")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            {t("草稿", "Draft")}
          </Badge>
        );
    }
  };

  // Get items to display in batch confirm dialog
  const getSelectedItemsForDialog = () => {
    const targetIds = pendingBatchAction === "publish" ? selectedForPublish : selectedForArchive;
    return allRows.filter(row => targetIds.includes(row.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Rocket className="h-7 w-7 text-primary" />
            {t("发布中心", "Publish Center")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("SEO + GEO 发布就绪检查报告", "SEO + GEO publishing readiness report")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.isUsingMock && (
            <Badge variant="outline" className="border-warning/50 text-warning">
              <Database className="mr-1 h-3 w-3" />
              {t("本地数据", "Mock Data")}
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="rounded-xl bg-transparent"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {t("刷新", "Refresh")}
          </Button>
        </div>
      </div>

      {/* Batch Operations Bar */}
      {selectedIds.size > 0 && (
        <Card className="glass-card border-primary/30 bg-primary/5 rounded-2xl">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {t(`已选择 ${selectedIds.size} 项`, `${selectedIds.size} items selected`)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedForPublish.length > 0 && (
                    <span className="mr-3">
                      {t(`${selectedForPublish.length} 可发布`, `${selectedForPublish.length} publishable`)}
                    </span>
                  )}
                  {selectedForArchive.length > 0 && (
                    <span>
                      {t(`${selectedForArchive.length} 可归档`, `${selectedForArchive.length} archivable`)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canPerformPublish && (
                  <Button
                    onClick={handleBatchPublishClick}
                    disabled={selectedForPublish.length === 0 || isBatchProcessing}
                    className="rounded-xl"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("批量发布", "Batch Publish")}
                    {selectedForPublish.length > 0 && ` (${selectedForPublish.length})`}
                  </Button>
                )}
                {canPerformArchive && (
                  <Button
                    variant="outline"
                    onClick={handleBatchArchiveClick}
                    disabled={selectedForArchive.length === 0 || isBatchProcessing}
                    className="rounded-xl"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    {t("批量归档", "Batch Archive")}
                    {selectedForArchive.length > 0 && ` (${selectedForArchive.length})`}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-xl"
                >
                  {t("清除选择", "Clear Selection")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Publishable */}
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("可发布率", "Publishable Rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">{totalStats.publishablePercent}%</span>
              <span className="text-sm text-muted-foreground mb-1">
                ({totalStats.publishable}/{totalStats.total})
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  totalStats.publishablePercent >= 80
                    ? "bg-success"
                    : totalStats.publishablePercent >= 50
                      ? "bg-warning"
                      : "bg-destructive"
                }`}
                style={{ width: `${totalStats.publishablePercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Missing SEO */}
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("缺失 SEO", "Missing SEO")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-destructive">{totalStats.missingSEO}</span>
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("需要 SEO title + description", "Need SEO title + description")}
            </p>
          </CardContent>
        </Card>

        {/* Missing GEO */}
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("缺失 GEO", "Missing GEO")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-warning">{totalStats.missingGEO}</span>
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("需要 GEO snippet + key_points", "Need GEO snippet + key_points")}
            </p>
          </CardContent>
        </Card>

        {/* Data Source */}
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("数据源", "Data Source")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {data.isUsingMock ? (
                <>
                  <Sparkles className="h-6 w-6 text-warning" />
                  <span className="text-lg font-medium text-warning">{t("本地 Mock", "Local Mock")}</span>
                </>
              ) : (
                <>
                  <Database className="h-6 w-6 text-success" />
                  <span className="text-lg font-medium text-success">Supabase</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.isUsingMock
                ? t("配置 Supabase 连接真实数据", "Configure Supabase for real data")
                : t("实时从数据库读取", "Live from database")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-type breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t("词典", "Lexicon"), stats: lexiconStats, icon: BookMarked, color: "primary" },
          { label: t("语法", "Grammar"), stats: grammarStats, icon: Languages, color: "accent" },
          { label: t("情景", "Scenarios"), stats: scenarioStats, icon: Theater, color: "chart-4" },
          { label: t("医疗词汇", "Medical Lexicon"), stats: medicalLexiconStats, icon: Stethoscope, color: "chart-3" },
        ].map(({ label, stats, icon: Icon, color }) => (
          <Card key={label} className="glass-card border-border/50 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Icon className={`h-5 w-5 text-${color}`} />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-foreground">{stats.publishablePercent}%</span>
                <span className="text-sm text-muted-foreground mb-1">
                  ({stats.publishable}/{stats.total})
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("缺 SEO", "Missing SEO")}</span>
                  <span className="text-destructive">{stats.missingSEO}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("缺 GEO", "Missing GEO")}</span>
                  <span className="text-warning">{stats.missingGEO}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("缺 FAQ", "Missing FAQ")}</span>
                  <span className="text-muted-foreground">{stats.missingFAQ}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Content List with Selection */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            {t("全部内容", "All Content")}
          </CardTitle>
          <CardDescription>
            {t("选择内容进行批量操作，支持 Shift+Click 范围选择", "Select content for batch operations, Shift+Click for range selection")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === allRows.length && allRows.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label={t("全选", "Select all")}
                  />
                </TableHead>
                <TableHead className="text-muted-foreground">{t("类型", "Type")}</TableHead>
                <TableHead className="text-muted-foreground">{t("标题", "Title")}</TableHead>
                <TableHead className="text-muted-foreground">{t("状态", "Status")}</TableHead>
                <TableHead className="text-muted-foreground">{t("发布就绪", "Publish Ready")}</TableHead>
                <TableHead className="text-muted-foreground">{t("更新时间", "Updated")}</TableHead>
                <TableHead className="text-muted-foreground">{t("操作", "Action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRows.map((item, index) => {
                const validation = validatePublishing(item.publishing);
                const isSelected = selectedIds.has(item.id);
                
                return (
                  <TableRow 
                    key={`${item.type}-${item.id}`} 
                    className={`border-border/30 cursor-pointer ${isSelected ? "bg-primary/10" : "hover:bg-secondary/30"}`}
                    onClick={(e) => handleSelectRow(item.id, index, e.shiftKey)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectRow(item.id, index, false)}
                        aria-label={t("选择", "Select")}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-[200px] truncate">
                      {getTitle(item)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.publishing.status)}
                    </TableCell>
                    <TableCell>
                      {validation.isPublishable ? (
                        <Badge className="bg-success/20 text-success border-success/30">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t("就绪", "Ready")}
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                          <XCircle className="mr-1 h-3 w-3" />
                          {t("未就绪", "Not Ready")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(item.updated_at)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-primary hover:text-primary hover:bg-primary/10"
                        asChild
                      >
                        <Link href={getEditLink(item.type)}>
                          {t("编辑", "Edit")}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Problematic Rows */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t("问题内容", "Problematic Content")}
          </CardTitle>
          <CardDescription>
            {t("以下内容无法发布，需要补充 SEO/GEO 字段", "The following content cannot be published, needs SEO/GEO fields")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {problematicRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <p className="text-lg font-medium text-foreground">
                {t("所有内容都已就绪", "All content is ready")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("太棒了！所有内容都可以发布", "Great! All content can be published")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">{t("类型", "Type")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("标题", "Title")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("问题", "Issues")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("严重性", "Severity")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("操作", "Action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problematicRows.slice(0, 20).map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} className="border-border/30 hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{getTitle(item)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.validation.errors.slice(0, 2).map((err, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs border-destructive/30 text-destructive"
                          >
                            {err.includes("SEO") ? t("SEO", "SEO") : t("GEO", "GEO")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSeverity(item.validation) === "error" ? (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                          <XCircle className="mr-1 h-3 w-3" />
                          {t("阻塞", "Blocking")}
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/20 text-warning border-warning/30">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {t("警告", "Warning")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-primary hover:text-primary hover:bg-primary/10"
                        asChild
                      >
                        <Link href={getEditLink(item.type)}>
                          {t("编辑", "Edit")}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recently Published */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t("最近发布", "Recently Published")}
          </CardTitle>
          <CardDescription>
            {t("按发布时间倒序排列", "Ordered by published_at desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentlyPublished.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("暂无已发布内容", "No published content yet")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">{t("类型", "Type")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("标题", "Title")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("发布时间", "Published At")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyPublished.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} className="border-border/30 hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{getTitle(item)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.publishing.published_at || item.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* How User App Updates */}
      <Card className="glass-card border-border/50 rounded-2xl border-l-4 border-l-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-accent" />
            {t("用户端如何更新", "How User App Updates")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {t("用户端只读取 published 状态", "User app only reads published status")}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(
                    "用户端应用查询 Supabase 时使用 .eq('publishing->>status', 'published')",
                    "User app queries Supabase with .eq('publishing->>status', 'published')"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {t("发布即生效", "Publish takes effect immediately")}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(
                    "无需导出 JSON，Admin 发布后用户端立即可见",
                    "No JSON export needed, visible to users immediately after admin publishes"
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {t("RLS 保护草稿", "RLS protects drafts")}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(
                    "行级安全策略确保匿名用户只能访问已发布内容",
                    "Row Level Security ensures anonymous users can only access published content"
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border/30">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{t("用户端示例查询", "User App Example Query")}:</strong>
            </p>
            <pre className="mt-2 text-xs text-muted-foreground font-mono overflow-x-auto">
{`// User app: fetch published lexicon
const { data } = await supabase
  .from('medical_lexicon')
  .select('slug, term, pinyin, definition, publishing')
  .eq('publishing->>status', 'published')

// Each row's publishing.geo contains:
// { snippet, key_points, intro, key_takeaways }`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Batch Confirm Dialog */}
      <AlertDialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingBatchAction === "publish" 
                ? t("确认批量发布", "Confirm Batch Publish")
                : t("确认批量归档", "Confirm Batch Archive")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBatchAction === "publish"
                ? t(`以下 ${selectedForPublish.length} 项内容将被发布：`, `The following ${selectedForPublish.length} items will be published:`)
                : t(`以下 ${selectedForArchive.length} 项内容将被归档：`, `The following ${selectedForArchive.length} items will be archived:`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("类型", "Type")}</TableHead>
                  <TableHead>{t("标题", "Title")}</TableHead>
                  <TableHead>{t("当前状态", "Current Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSelectedItemsForDialog().map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{getTitle(item)}</TableCell>
                    <TableCell>{getStatusBadge(item.publishing.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {batchProgress && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t(`处理中: ${batchProgress.current}/${batchProgress.total}`, 
                   `Processing: ${batchProgress.current}/${batchProgress.total}`)}
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {batchResult && batchResult.failed.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm font-medium text-destructive mb-2">
                {t(`${batchResult.failed.length} 项操作失败:`, `${batchResult.failed.length} items failed:`)}
              </p>
              <ul className="text-xs text-destructive space-y-1">
                {batchResult.failed.slice(0, 5).map((fail) => (
                  <li key={fail.id}>• {fail.error}</li>
                ))}
                {batchResult.failed.length > 5 && (
                  <li>... {t(`还有 ${batchResult.failed.length - 5} 项`, `and ${batchResult.failed.length - 5} more`)}</li>
                )}
              </ul>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchProcessing}>
              {t("取消", "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmBatchAction}
              disabled={isBatchProcessing}
              className={pendingBatchAction === "archive" ? "bg-warning hover:bg-warning/90" : ""}
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("处理中...", "Processing...")}
                </>
              ) : pendingBatchAction === "publish" ? (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("确认发布", "Confirm Publish")}
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  {t("确认归档", "Confirm Archive")}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
