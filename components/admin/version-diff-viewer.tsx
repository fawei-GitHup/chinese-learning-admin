"use client";

import { useState, useMemo } from "react";
import { X, ArrowRight, Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type ContentVersion,
  type VersionDiff,
  compareVersions,
} from "@/lib/supabase/content-items-service";
import { type MockContentVersion, mockCompareVersions } from "@/lib/admin-mock";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// Unified version type
type UnifiedVersion = ContentVersion | MockContentVersion;

interface VersionDiffViewerProps {
  oldVersion: UnifiedVersion;
  newVersion: UnifiedVersion;
  open: boolean;
  onClose: () => void;
  locale?: "en" | "zh";
}

const translations = {
  en: {
    title: "Version Comparison",
    oldVersion: "Old Version",
    newVersion: "New Version",
    noChanges: "No changes",
    changed: "Changed",
    unchanged: "Unchanged",
    allFields: "All Fields",
    changedOnly: "Changed Only",
    sideBySide: "Side by Side",
    inline: "Inline",
    close: "Close",
    added: "Added",
    removed: "Removed",
    modified: "Modified",
  },
  zh: {
    title: "版本对比",
    oldVersion: "旧版本",
    newVersion: "新版本",
    noChanges: "无变更",
    changed: "已变更",
    unchanged: "未变更",
    allFields: "全部字段",
    changedOnly: "仅显示变更",
    sideBySide: "并排对比",
    inline: "内联对比",
    close: "关闭",
    added: "新增",
    removed: "删除",
    modified: "修改",
  },
};

interface DiffItem extends VersionDiff {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  hasChanges: boolean;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(empty)";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

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

function DiffLine({
  type,
  content,
  locale,
}: {
  type: "added" | "removed" | "unchanged";
  content: string;
  locale: "en" | "zh";
}) {
  const t = translations[locale];
  
  if (type === "added") {
    return (
      <div className="flex items-start gap-2 bg-green-500/10 px-3 py-1.5 rounded text-sm font-mono">
        <Plus className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
        <span className="text-green-700 dark:text-green-400 whitespace-pre-wrap break-all">
          {content}
        </span>
      </div>
    );
  }
  
  if (type === "removed") {
    return (
      <div className="flex items-start gap-2 bg-red-500/10 px-3 py-1.5 rounded text-sm font-mono">
        <Minus className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <span className="text-red-700 dark:text-red-400 whitespace-pre-wrap break-all line-through">
          {content}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 text-sm font-mono text-muted-foreground">
      <span className="w-4" />
      <span className="whitespace-pre-wrap break-all">{content}</span>
    </div>
  );
}

function FieldDiff({
  diff,
  viewMode,
  locale,
}: {
  diff: DiffItem;
  viewMode: "sideBySide" | "inline";
  locale: "en" | "zh";
}) {
  const t = translations[locale];
  const oldStr = formatValue(diff.oldValue);
  const newStr = formatValue(diff.newValue);

  if (viewMode === "sideBySide") {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
          <span className="font-medium text-sm">{diff.label}</span>
          {diff.hasChanges ? (
            <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
              {t.changed}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700 border-green-500/20">
              {t.unchanged}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-3">
            <div className="text-xs text-muted-foreground mb-1">
              {t.oldVersion} (v{diff.oldValue !== undefined ? "" : "N/A"})
            </div>
            <pre className={`text-sm font-mono whitespace-pre-wrap break-all ${
              diff.hasChanges ? "bg-red-500/5 px-2 py-1 rounded" : ""
            }`}>
              {oldStr}
            </pre>
          </div>
          <div className="p-3">
            <div className="text-xs text-muted-foreground mb-1">
              {t.newVersion}
            </div>
            <pre className={`text-sm font-mono whitespace-pre-wrap break-all ${
              diff.hasChanges ? "bg-green-500/5 px-2 py-1 rounded" : ""
            }`}>
              {newStr}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
        <span className="font-medium text-sm">{diff.label}</span>
        {diff.hasChanges ? (
          <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
            {t.changed}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-700 border-green-500/20">
            {t.unchanged}
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-1">
        {diff.hasChanges ? (
          <>
            <DiffLine type="removed" content={oldStr} locale={locale} />
            <DiffLine type="added" content={newStr} locale={locale} />
          </>
        ) : (
          <DiffLine type="unchanged" content={oldStr} locale={locale} />
        )}
      </div>
    </div>
  );
}

export function VersionDiffViewer({
  oldVersion,
  newVersion,
  open,
  onClose,
  locale = "zh",
}: VersionDiffViewerProps) {
  const t = translations[locale];
  const [showChangedOnly, setShowChangedOnly] = useState(true);
  const [viewMode, setViewMode] = useState<"sideBySide" | "inline">("sideBySide");

  const diffs = useMemo<DiffItem[]>(() => {
    if (isSupabaseConfigured) {
      const result = compareVersions(
        oldVersion as ContentVersion,
        newVersion as ContentVersion
      );
      return result.diffs;
    } else {
      return mockCompareVersions(
        oldVersion as MockContentVersion,
        newVersion as MockContentVersion
      );
    }
  }, [oldVersion, newVersion]);

  const visibleDiffs = useMemo(() => {
    if (showChangedOnly) {
      return diffs.filter((d) => d.hasChanges);
    }
    return diffs;
  }, [diffs, showChangedOnly]);

  const changesCount = diffs.filter((d) => d.hasChanges).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {t.title}
              <Badge variant="secondary" className="text-xs">
                {changesCount} {locale === "zh" ? "处变更" : "changes"}
              </Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Version info bar */}
          <div className="flex items-center gap-3 mt-3 text-sm">
            <div className="flex-1 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  v{oldVersion.version_number}
                </Badge>
                <span className="font-medium truncate">{oldVersion.title}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(oldVersion.created_at, locale)}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex-1 p-2 bg-green-500/5 rounded-lg border border-green-500/10">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  v{newVersion.version_number}
                </Badge>
                <span className="font-medium truncate">{newVersion.title}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(newVersion.created_at, locale)}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filter tabs */}
        <div className="px-6 py-2 border-b shrink-0 flex items-center justify-between">
          <Tabs
            value={showChangedOnly ? "changed" : "all"}
            onValueChange={(v) => setShowChangedOnly(v === "changed")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="changed" className="text-xs h-6 px-3">
                {t.changedOnly} ({changesCount})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs h-6 px-3">
                {t.allFields} ({diffs.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "sideBySide" | "inline")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="sideBySide" className="text-xs h-6 px-3">
                {t.sideBySide}
              </TabsTrigger>
              <TabsTrigger value="inline" className="text-xs h-6 px-3">
                {t.inline}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Diff content */}
        <ScrollArea className="flex-1 px-6 py-4">
          {visibleDiffs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Check className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p>{t.noChanges}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleDiffs.map((diff) => (
                <FieldDiff
                  key={diff.field}
                  diff={diff}
                  viewMode={viewMode}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t shrink-0 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a simpler panel version for embedding
export function VersionDiffPanel({
  oldVersion,
  newVersion,
  locale = "zh",
}: {
  oldVersion: UnifiedVersion;
  newVersion: UnifiedVersion;
  locale?: "en" | "zh";
}) {
  const t = translations[locale];
  const [showChangedOnly, setShowChangedOnly] = useState(true);

  const diffs = useMemo<DiffItem[]>(() => {
    if (isSupabaseConfigured) {
      const result = compareVersions(
        oldVersion as ContentVersion,
        newVersion as ContentVersion
      );
      return result.diffs;
    } else {
      return mockCompareVersions(
        oldVersion as MockContentVersion,
        newVersion as MockContentVersion
      );
    }
  }, [oldVersion, newVersion]);

  const visibleDiffs = useMemo(() => {
    if (showChangedOnly) {
      return diffs.filter((d) => d.hasChanges);
    }
    return diffs;
  }, [diffs, showChangedOnly]);

  const changesCount = diffs.filter((d) => d.hasChanges).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">v{oldVersion.version_number}</Badge>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <Badge variant="outline">v{newVersion.version_number}</Badge>
          <Badge variant="secondary" className="text-xs ml-2">
            {changesCount} {locale === "zh" ? "处变更" : "changes"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowChangedOnly(!showChangedOnly)}
          className="text-xs h-7"
        >
          {showChangedOnly ? t.allFields : t.changedOnly}
        </Button>
      </div>

      {/* Diffs */}
      {visibleDiffs.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Check className="w-6 h-6 mx-auto mb-2 text-green-500" />
          {t.noChanges}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleDiffs.map((diff) => (
            <FieldDiff
              key={diff.field}
              diff={diff}
              viewMode="inline"
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
