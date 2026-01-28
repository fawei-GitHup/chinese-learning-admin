"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Globe,
  Code,
  Eye,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChipInput } from "@/components/admin/chip-input";
import {
  type PublishingData,
  type ValidationResult,
  validatePublishing,
  generateSlug,
  generateJSONLD,
} from "@/lib/validatePublishing";
import { useAdminLocale } from "@/lib/admin-locale";

interface PublishingPanelProps {
  value: PublishingData;
  onChange: (value: PublishingData) => void;
  title?: string;
  disabled?: boolean;
  faq?: Array<{ question: string; answer: string }>;
}

export function PublishingPanel({
  value,
  onChange,
  title = "",
  disabled = false,
  faq = [],
}: PublishingPanelProps) {
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  
  const [validation, setValidation] = useState<ValidationResult>({ valid: false, errors: [], warnings: [] });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setValidation(validatePublishing(value));
  }, [value]);

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const autoGenerateSlug = () => {
    if (title) {
      onChange({ ...value, slug: generateSlug(title) });
    }
  };

  const jsonldOutput = generateJSONLD("Article", {
    title: value.seo?.title || title,
    description: value.seo?.description || value.geo?.snippet || "",
    datePublished: value.publishedAt || undefined,
    dateModified: new Date().toISOString(),
    faq,
  });

  const faqJsonld = faq.length > 0 ? generateJSONLD("FAQPage", {
    title: value.seo?.title || title,
    description: value.seo?.description || "",
    faq,
  }) : null;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {!validation.valid && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">
                {t("发布前需修复以下问题", "Fix these issues before publishing")}
              </p>
              <ul className="mt-1 text-sm text-destructive/80 list-disc list-inside">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">{t("建议", "Suggestions")}</p>
              <ul className="mt-1 text-sm text-warning/80 list-disc list-inside">
                {validation.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validation.valid && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="font-medium text-success">
              {t("所有字段验证通过，可以发布", "All fields validated. Ready to publish.")}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="seo" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-secondary/50">
          <TabsTrigger value="seo" className="rounded-lg gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="geo" className="rounded-lg gap-2">
            <Globe className="h-4 w-4" />
            GEO
          </TabsTrigger>
          <TabsTrigger value="jsonld" className="rounded-lg gap-2">
            <Code className="h-4 w-4" />
            JSON-LD
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-lg gap-2">
            <Eye className="h-4 w-4" />
            {t("预览", "Preview")}
          </TabsTrigger>
        </TabsList>

        {/* SEO Tab */}
        <TabsContent value="seo" className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("Slug (URL 路径)", "Slug (URL Path)")}</Label>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={autoGenerateSlug}
                  className="h-7 text-xs"
                >
                  {t("自动生成", "Auto-generate")}
                </Button>
              )}
            </div>
            <Input
              value={value.slug || ""}
              onChange={(e) => onChange({ ...value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              disabled={disabled}
              placeholder="my-content-slug"
              className="rounded-xl bg-secondary/50 border-border/50 font-mono text-sm"
            />
            {value.slug && (
              <p className="text-xs text-muted-foreground">
                URL: /content/{value.slug}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t("SEO 标题", "SEO Title")}
              <span className="ml-2 text-xs text-muted-foreground">
                ({(value.seo?.title || "").length}/60)
              </span>
            </Label>
            <Input
              value={value.seo?.title || ""}
              onChange={(e) => onChange({ ...value, seo: { ...value.seo, title: e.target.value } })}
              disabled={disabled}
              placeholder={t("搜索引擎显示的标题", "Title shown in search engines")}
              className="rounded-xl bg-secondary/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t("SEO 描述", "SEO Description")}
              <span className="ml-2 text-xs text-muted-foreground">
                ({(value.seo?.description || "").length}/160)
              </span>
            </Label>
            <Textarea
              value={value.seo?.description || ""}
              onChange={(e) => onChange({ ...value, seo: { ...value.seo, description: e.target.value } })}
              disabled={disabled}
              rows={3}
              placeholder={t("搜索引擎显示的描述", "Description shown in search engines")}
              className="rounded-xl bg-secondary/50 border-border/50"
            />
          </div>
        </TabsContent>

        {/* GEO Tab */}
        <TabsContent value="geo" className="mt-4 space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                {t("GEO 优化 (Generative Engine Optimization)", "GEO (Generative Engine Optimization)")}
              </CardTitle>
              <CardDescription>
                {t(
                  "为 AI 搜索引擎优化内容，提高在 ChatGPT、Perplexity 等中的可见性",
                  "Optimize content for AI search engines like ChatGPT, Perplexity"
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-2">
            <Label>{t("GEO 片段 (AI 引用文本)", "GEO Snippet (AI Citation Text)")}</Label>
            <Textarea
              value={value.geo?.snippet || ""}
              onChange={(e) => onChange({ ...value, geo: { ...value.geo, snippet: e.target.value } })}
              disabled={disabled}
              rows={4}
              placeholder={t(
                "简洁、信息丰富的段落，适合 AI 直接引用...",
                "A concise, informative paragraph suitable for AI citation..."
              )}
              className="rounded-xl bg-secondary/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t("关键要点 (3-5个必填)", "Key Points (3-5 required)")}
              <Badge
                variant="outline"
                className={`ml-2 ${
                  (value.geo?.keyPoints?.length || 0) >= 3
                    ? "border-success/30 text-success"
                    : "border-warning/30 text-warning"
                }`}
              >
                {value.geo?.keyPoints?.length || 0}/3+
              </Badge>
            </Label>
            <ChipInput
              values={value.geo?.keyPoints || []}
              onChange={(keyPoints) => onChange({ ...value, geo: { ...value.geo, keyPoints } })}
              disabled={disabled}
              placeholder={t("输入要点后按回车", "Type and press Enter")}
            />
          </div>
        </TabsContent>

        {/* JSON-LD Tab */}
        <TabsContent value="jsonld" className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("Article 结构化数据", "Article Structured Data")}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(JSON.stringify(jsonldOutput, null, 2), "article")}
                className="h-7 gap-1"
              >
                {copied === "article" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {t("复制", "Copy")}
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-secondary/50 border border-border/50 overflow-x-auto text-xs font-mono text-foreground">
              {JSON.stringify(jsonldOutput, null, 2)}
            </pre>
          </div>

          {faqJsonld && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("FAQ 结构化数据", "FAQ Structured Data")}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(faqJsonld, null, 2), "faq")}
                  className="h-7 gap-1"
                >
                  {copied === "faq" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {t("复制", "Copy")}
                </Button>
              </div>
              <pre className="p-4 rounded-xl bg-secondary/50 border border-border/50 overflow-x-auto text-xs font-mono text-foreground">
                {JSON.stringify(faqJsonld, null, 2)}
              </pre>
            </div>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4 space-y-6">
          {/* Google Snippet Preview */}
          <div className="space-y-2">
            <Label>{t("Google 搜索预览", "Google Search Preview")}</Label>
            <Card className="bg-background border-border/50 rounded-xl p-4">
              <div className="space-y-1">
                <p className="text-primary text-lg hover:underline cursor-pointer truncate">
                  {value.seo?.title || title || t("标题未设置", "Title not set")}
                </p>
                <p className="text-success text-sm truncate">
                  example.com/content/{value.slug || "..."}
                </p>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {value.seo?.description || t("描述未设置", "Description not set")}
                </p>
              </div>
            </Card>
          </div>

          {/* GEO Citation Preview */}
          <div className="space-y-2">
            <Label>{t("AI 引用预览 (GEO)", "AI Citation Preview (GEO)")}</Label>
            <Card className="bg-primary/5 border-primary/20 rounded-xl p-4">
              <div className="space-y-3">
                <p className="text-foreground text-sm leading-relaxed">
                  {value.geo?.snippet || t("GEO 片段未设置...", "GEO snippet not set...")}
                </p>
                {(value.geo?.keyPoints?.length || 0) > 0 && (
                  <div className="pt-2 border-t border-primary/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {t("关键要点", "Key Points")}:
                    </p>
                    <ul className="text-sm text-foreground space-y-1">
                      {value.geo?.keyPoints?.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export validation check for external use
export function isPublishReady(publishing: PublishingData): boolean {
  return validatePublishing(publishing).valid;
}
