"use client";

import { useState, useEffect, useCallback } from "react";
import { History, RotateCcw, GitCompare, ChevronDown, ChevronRight, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type ContentVersion,
  fetchVersionHistory,
  rollbackToVersion,
} from "@/lib/supabase/content-items-service";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  type MockContentVersion,
  mockGetVersionHistory,
  mockRollbackToVersion,
} from "@/lib/admin-mock";
import { toast } from "sonner";

// Unified version type for both Supabase and Mock
type UnifiedVersion = ContentVersion | MockContentVersion;

interface VersionHistoryProps {
  contentId: string;
  currentVersion?: number;
  onRollback?: (versionId: string) => void;
  onCompare?: (version1: UnifiedVersion, version2: UnifiedVersion) => void;
  locale?: "en" | "zh";
}

const translations = {
  en: {
    title: "Version History",
    noVersions: "No version history available",
    current: "Current",
    restore: "Restore",
    compare: "Compare",
    rollbackTitle: "Confirm Rollback",
    rollbackDesc: "Are you sure you want to restore this version? This action will create a new version with the current state before applying the rollback.",
    cancel: "Cancel",
    confirm: "Confirm Rollback",
    rollbackSuccess: "Successfully rolled back to version",
    rollbackError: "Failed to rollback",
    loading: "Loading versions...",
    selectToCompare: "Select to compare",
    compareSelected: "Compare Selected",
    clearSelection: "Clear Selection",
    version: "Version",
    by: "by",
  },
  zh: {
    title: "版本历史",
    noVersions: "暂无版本历史",
    current: "当前",
    restore: "恢复",
    compare: "对比",
    rollbackTitle: "确认回滚",
    rollbackDesc: "确定要恢复到此版本吗？系统会在回滚前创建当前状态的快照。",
    cancel: "取消",
    confirm: "确认回滚",
    rollbackSuccess: "已成功回滚到版本",
    rollbackError: "回滚失败",
    loading: "加载版本历史中...",
    selectToCompare: "选择以对比",
    compareSelected: "对比选中版本",
    clearSelection: "清除选择",
    version: "版本",
    by: "作者",
  },
};

function formatDate(dateString: string, locale: "en" | "zh"): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "published":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "draft":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "archived":
      return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    default:
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  }
}

export function VersionHistory({
  contentId,
  currentVersion,
  onRollback,
  onCompare,
  locale = "zh",
}: VersionHistoryProps) {
  const t = translations[locale];
  
  const [versions, setVersions] = useState<UnifiedVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [rollbackTarget, setRollbackTarget] = useState<UnifiedVersion | null>(null);
  const [rolling, setRolling] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<UnifiedVersion[]>([]);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const data = await fetchVersionHistory(contentId);
        setVersions(data);
      } else {
        const data = mockGetVersionHistory(contentId);
        setVersions(data);
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
      toast.error(locale === "zh" ? "加载版本历史失败" : "Failed to load version history");
    } finally {
      setLoading(false);
    }
  }, [contentId, locale]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const toggleExpanded = (versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  };

  const handleRollback = async () => {
    if (!rollbackTarget) return;
    
    setRolling(true);
    try {
      if (isSupabaseConfigured) {
        const success = await rollbackToVersion(contentId, rollbackTarget.id);
        if (success) {
          toast.success(`${t.rollbackSuccess} v${rollbackTarget.version_number}`);
          onRollback?.(rollbackTarget.id);
          await loadVersions(); // Refresh versions
        } else {
          toast.error(t.rollbackError);
        }
      } else {
        // Mock rollback - just notify parent
        const result = mockRollbackToVersion(contentId, rollbackTarget.id);
        if (result) {
          toast.success(`${t.rollbackSuccess} v${rollbackTarget.version_number}`);
          onRollback?.(rollbackTarget.id);
        } else {
          toast.error(t.rollbackError);
        }
      }
    } catch (error) {
      console.error("Rollback failed:", error);
      toast.error(t.rollbackError);
    } finally {
      setRolling(false);
      setRollbackTarget(null);
    }
  };

  const toggleSelectForCompare = (version: UnifiedVersion) => {
    setSelectedForCompare((prev) => {
      const exists = prev.find((v) => v.id === version.id);
      if (exists) {
        return prev.filter((v) => v.id !== version.id);
      }
      if (prev.length >= 2) {
        return [prev[1], version];
      }
      return [...prev, version];
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      // Sort by version number to ensure older version comes first
      const sorted = [...selectedForCompare].sort(
        (a, b) => a.version_number - b.version_number
      );
      onCompare?.(sorted[0], sorted[1]);
    }
  };

  const isSelectedForCompare = (versionId: string) => {
    return selectedForCompare.some((v) => v.id === versionId);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="animate-pulse flex items-center justify-center gap-2">
          <History className="w-4 h-4" />
          {t.loading}
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-6 text-center">
        <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">{t.noVersions}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with compare button */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <History className="w-4 h-4" />
          {t.title}
        </h3>
        {onCompare && selectedForCompare.length === 2 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForCompare([])}
              className="h-7 text-xs"
            >
              {t.clearSelection}
            </Button>
            <Button
              size="sm"
              onClick={handleCompare}
              className="h-7 text-xs"
            >
              <GitCompare className="w-3 h-3 mr-1" />
              {t.compareSelected}
            </Button>
          </div>
        )}
      </div>

      {/* Version list */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2 pr-3">
          {versions.map((version, index) => {
            const isLatest = index === 0;
            const isCurrent = currentVersion === version.version_number;
            const isExpanded = expandedVersions.has(version.id);

            return (
              <Collapsible
                key={version.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(version.id)}
              >
                <div
                  className={`border rounded-lg transition-colors ${
                    isSelectedForCompare(version.id)
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  {/* Version header */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              v{version.version_number}
                            </span>
                            {(isLatest || isCurrent) && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {t.current}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${getStatusColor(
                                version.status
                              )}`}
                            >
                              {version.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(version.created_at, locale)}
                            </span>
                            {version.created_by && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {version.created_by}
                              </span>
                            )}
                          </div>

                          {version.change_summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {version.change_summary}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {onCompare && (
                          <Button
                            variant={
                              isSelectedForCompare(version.id)
                                ? "default"
                                : "ghost"
                            }
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectForCompare(version);
                            }}
                            className="h-7 text-xs"
                            title={t.selectToCompare}
                          >
                            <GitCompare className="w-3 h-3" />
                          </Button>
                        )}
                        {!isLatest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRollbackTarget(version);
                            }}
                            className="h-7 text-xs"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            {t.restore}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  <CollapsibleContent>
                    <div className="px-3 pb-3 border-t border-border/30 pt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            {locale === "zh" ? "标题" : "Title"}:
                          </span>
                          <p className="font-medium truncate">{version.title}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {locale === "zh" ? "URL 别名" : "Slug"}:
                          </span>
                          <p className="font-mono text-[11px] truncate">
                            {version.slug}
                          </p>
                        </div>
                      </div>

                      {version.change_summary && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">
                            {locale === "zh" ? "变更说明" : "Change Summary"}:
                          </span>
                          <p className="mt-0.5">{version.change_summary}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                        >
                          {version.seo_json
                            ? locale === "zh"
                              ? "包含 SEO"
                              : "Has SEO"
                            : locale === "zh"
                            ? "无 SEO"
                            : "No SEO"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                        >
                          {version.geo_json
                            ? locale === "zh"
                              ? "包含 GEO"
                              : "Has GEO"
                            : locale === "zh"
                            ? "无 GEO"
                            : "No GEO"}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Rollback confirmation dialog */}
      <AlertDialog
        open={!!rollbackTarget}
        onOpenChange={() => setRollbackTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.rollbackTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rollbackDesc}
              {rollbackTarget && (
                <span className="block mt-2 font-medium text-foreground">
                  {t.version} {rollbackTarget.version_number}:{" "}
                  {rollbackTarget.title}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rolling}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              disabled={rolling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rolling ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {locale === "zh" ? "处理中..." : "Processing..."}
                </span>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t.confirm}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
