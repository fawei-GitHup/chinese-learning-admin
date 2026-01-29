"use client";

import React, { useState } from "react";
import {
  FileJson,
  Check,
  Copy,
  Eye,
  Plus,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useAdminLocale } from "@/lib/admin-locale";
import {
  type StructuredDataTemplate,
  type ExtendedContentType,
  getTemplatesForContentType,
  formatJsonLd,
  generateScriptTag,
} from "@/lib/structured-data-templates";

export interface StructuredDataTemplatePickerProps {
  /** 当前内容类型 */
  contentType: ExtendedContentType;
  /** 当应用模板时的回调函数，传递 JSON-LD 字符串 */
  onApply?: (jsonLd: string) => void;
  /** 当前的 JSON-LD 值（用于显示是否已有内容） */
  currentValue?: string;
  /** 是否处于紧凑模式（用于侧边栏等） */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 结构化数据模板选择器组件
 * 用于选择和应用 JSON-LD Schema 模板
 */
export function StructuredDataTemplatePicker({
  contentType,
  onApply,
  currentValue,
  compact = false,
  className = "",
}: StructuredDataTemplatePickerProps) {
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  const [selectedTemplate, setSelectedTemplate] = useState<StructuredDataTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<string[]>([]);

  // 获取当前内容类型对应的模板
  const availableTemplates = getTemplatesForContentType(contentType);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(t("已复制到剪贴板", "Copied to clipboard"));
  };

  const handlePreview = (template: StructuredDataTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleApply = (template: StructuredDataTemplate) => {
    const jsonLdString = formatJsonLd(template.schema);
    onApply?.(jsonLdString);
    toast.success(
      t(`已应用「${template.name.zh}」模板`, `Applied "${template.name.en}" template`)
    );
    setPreviewOpen(false);
  };

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  // 没有可用模板时的提示
  if (availableTemplates.length === 0) {
    return (
      <Card className={`glass-card border-border/50 rounded-2xl ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("当前内容类型没有可用的模板", "No templates available for this content type")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 紧凑模式：适用于侧边栏
  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <FileJson className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {t("结构化数据模板", "Structured Data Templates")}
          </span>
        </div>
        <div className="space-y-2">
          {availableTemplates.map(template => (
            <Collapsible
              key={template.id}
              open={expandedTemplates.includes(template.id)}
              onOpenChange={() => toggleExpanded(template.id)}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                >
                  <span className="text-sm font-medium">
                    {locale === "zh" ? template.name.zh : template.name.en}
                  </span>
                  {expandedTemplates.includes(template.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <p className="text-xs text-muted-foreground mb-2 px-2">
                  {locale === "zh" ? template.description.zh : template.description.en}
                </p>
                <div className="flex gap-2 px-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs rounded-lg"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {t("预览", "Preview")}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs rounded-lg"
                    onClick={() => handleApply(template)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t("应用", "Apply")}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* 预览对话框 */}
        <TemplatePreviewDialog
          template={selectedTemplate}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onApply={handleApply}
          onCopy={handleCopy}
          copiedField={copiedField}
          locale={locale}
          t={t}
        />
      </div>
    );
  }

  // 完整模式
  return (
    <Card className={`glass-card border-border/50 rounded-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileJson className="h-5 w-5 text-primary" />
          {t("结构化数据模板", "Structured Data Templates")}
        </CardTitle>
        <CardDescription>
          {t(
            "为当前内容类型选择适合的 JSON-LD Schema 模板",
            "Select a suitable JSON-LD Schema template for the current content type"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 当前值提示 */}
        {currentValue && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-500">
              {t(
                "应用模板将覆盖当前的 JSON-LD 内容",
                "Applying a template will overwrite the current JSON-LD content"
              )}
            </p>
          </div>
        )}

        {/* 模板列表 */}
        <div className="space-y-3">
          {availableTemplates.map(template => (
            <div
              key={template.id}
              className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">
                      {locale === "zh" ? template.name.zh : template.name.en}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {template.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "zh" ? template.description.zh : template.description.en}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.requiredFields.map(field => (
                      <Badge
                        key={field}
                        variant="secondary"
                        className="text-xs bg-primary/10 text-primary"
                      >
                        {field}*
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t("预览", "Preview")}
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-lg"
                    onClick={() => handleApply(template)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("应用", "Apply")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* 预览对话框 */}
      <TemplatePreviewDialog
        template={selectedTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onApply={handleApply}
        onCopy={handleCopy}
        copiedField={copiedField}
        locale={locale}
        t={t}
      />
    </Card>
  );
}

// 预览对话框组件
interface TemplatePreviewDialogProps {
  template: StructuredDataTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (template: StructuredDataTemplate) => void;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
  locale: "zh" | "en";
  t: (zh: string, en: string) => string;
}

function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onApply,
  onCopy,
  copiedField,
  locale,
  t,
}: TemplatePreviewDialogProps) {
  if (!template) return null;

  const jsonLdString = formatJsonLd(template.schema);
  const scriptTagString = generateScriptTag(template.schema);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-card border-border/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            {locale === "zh" ? template.name.zh : template.name.en}
          </DialogTitle>
          <DialogDescription>
            {locale === "zh" ? template.description.zh : template.description.en}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 必填字段提示 */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
            <p className="text-sm font-medium mb-2">
              {t("必填字段", "Required Fields")}
            </p>
            <div className="flex flex-wrap gap-1">
              {template.requiredFields.map(field => (
                <Badge
                  key={field}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary"
                >
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          {/* JSON-LD 预览 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{t("JSON-LD 结构", "JSON-LD Structure")}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg"
                onClick={() => onCopy(jsonLdString, "preview-json")}
              >
                {copiedField === "preview-json" ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-1">{t("复制", "Copy")}</span>
              </Button>
            </div>
            <ScrollArea className="h-64">
              <pre className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-sm font-mono overflow-x-auto">
                {jsonLdString}
              </pre>
            </ScrollArea>
          </div>

          {/* Script 标签预览 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{t("Script 标签", "Script Tag")}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg"
                onClick={() => onCopy(scriptTagString, "preview-script")}
              >
                {copiedField === "preview-script" ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-1">{t("复制", "Copy")}</span>
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-xs font-mono overflow-x-auto">
              {scriptTagString}
            </pre>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {t("取消", "Cancel")}
          </Button>
          <Button className="rounded-xl" onClick={() => onApply(template)}>
            <Plus className="h-4 w-4 mr-1" />
            {t("应用模板", "Apply Template")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StructuredDataTemplatePicker;
