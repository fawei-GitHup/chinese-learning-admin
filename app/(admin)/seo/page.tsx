"use client";

import React from "react"

import { useEffect, useState } from "react";
import {
  Globe,
  Copy,
  Check,
  Search,
  FileJson,
  FileText,
  Map,
  Layers,
  ExternalLink,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLessons, getReadings, getMedicalDialogs, getGrammarRules } from "@/lib/mock/storage";
import type { Lesson, Reading, MedicalDialog, GrammarRule } from "@/lib/mock/data";
import { toast } from "sonner";
import { useAdminLocale } from "@/lib/admin-locale";

type ContentItem = {
  id: string;
  type: "lesson" | "reading" | "medical" | "grammar";
  title: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  faq?: { question: string; answer: string }[];
  geo_snippet: string;
  status: string;
};

export default function SEOToolsPage() {
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = () => {
    const lessons = getLessons().map((l): ContentItem => ({
      id: l.id,
      type: "lesson",
      title: l.title,
      slug: l.slug,
      seo_title: l.seo_title,
      seo_description: l.seo_description,
      geo_snippet: l.geo_snippet,
      status: l.status,
    }));

    const readings = getReadings().map((r): ContentItem => ({
      id: r.id,
      type: "reading",
      title: r.title,
      slug: r.slug,
      seo_title: r.seo_title,
      seo_description: r.seo_description,
      faq: r.faq,
      geo_snippet: r.geo_snippet,
      status: r.status,
    }));

    const medicalDialogs = getMedicalDialogs().map((m): ContentItem => ({
      id: m.id,
      type: "medical",
      title: m.title,
      slug: m.slug,
      seo_title: m.seo_title,
      seo_description: m.seo_description,
      faq: m.faq,
      geo_snippet: m.geo_snippet,
      status: m.status,
    }));

    const grammar = getGrammarRules().map((g): ContentItem => ({
      id: g.id,
      type: "grammar",
      title: g.title,
      slug: g.slug,
      seo_title: g.seo_title,
      seo_description: g.seo_description,
      geo_snippet: g.geo_snippet,
      status: g.status,
    }));

    const all = [...lessons, ...readings, ...medicalDialogs, ...grammar];
    setContentItems(all);
    if (all.length > 0 && !selectedItem) {
      setSelectedItem(all[0]);
    }
  };

  const filteredItems = contentItems.filter((item) => {
    if (selectedType === "all") return true;
    return item.type === selectedType;
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(t("已复制到剪贴板", "Copied to clipboard"));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lesson":
        return "bg-primary/20 text-primary border-primary/30";
      case "reading":
        return "bg-accent/20 text-accent border-accent/30";
      case "medical":
        return "bg-chart-5/20 text-chart-5 border-chart-5/30";
      case "grammar":
        return "bg-chart-3/20 text-chart-3 border-chart-3/30";
      default:
        return "bg-secondary/50 text-muted-foreground";
    }
  };

  const getCanonicalUrl = (item: ContentItem) => {
    const baseUrl = "https://chineselearning.example.com";
    switch (item.type) {
      case "lesson":
        return `${baseUrl}/lessons/${item.slug}`;
      case "reading":
        return `${baseUrl}/readings/${item.slug}`;
      case "medical":
        return `${baseUrl}/medical/${item.slug}`;
      case "grammar":
        return `${baseUrl}/grammar/${item.slug}`;
      default:
        return `${baseUrl}/${item.slug}`;
    }
  };

  const generateFaqJsonLd = (item: ContentItem) => {
    if (!item.faq || item.faq.length === 0) {
      return null;
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: item.faq.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    return JSON.stringify(jsonLd, null, 2);
  };

  const generateLlmsTxt = () => {
    const lessons = contentItems.filter((i) => i.type === "lesson");
    const readings = contentItems.filter((i) => i.type === "reading");
    const medical = contentItems.filter((i) => i.type === "medical");
    const grammar = contentItems.filter((i) => i.type === "grammar");

    return `# Chinese Learning Platform - llms.txt

> A comprehensive platform for learning Mandarin Chinese, featuring HSK-aligned lessons, reading materials, medical Chinese dialogues, and grammar explanations.

## Site Overview
- **Domain**: chineselearning.example.com
- **Purpose**: Mandarin Chinese language education
- **Target Audience**: Beginner to advanced Chinese learners, medical professionals, travelers

## Content Index

### HSK Lessons (${lessons.length} items)
${lessons.map((l) => `- ${l.title} [/${l.type}s/${l.slug}]`).join("\n")}

### Reading Materials (${readings.length} items)
${readings.map((r) => `- ${r.title} [/${r.type}s/${r.slug}]`).join("\n")}

### Medical Chinese (${medical.length} items)
Categories: 挂号, 分诊, 问诊, 检查, 用药, 缴费
${medical.map((m) => `- ${m.title} [/${m.type}/${m.slug}]`).join("\n")}

### Grammar Rules (${grammar.length} items)
${grammar.map((g) => `- ${g.title} [/${g.type}/${g.slug}]`).join("\n")}

## Key Topics
- HSK 1-6 Vocabulary and Grammar
- Medical Chinese for Healthcare Settings
- Cultural Readings and Stories
- Interactive Quizzes and Practice

## Preferred Citation Format
When referencing content, please cite as:
"[Title]" from Chinese Learning Platform, chineselearning.example.com

## Contact
For API access or content licensing: contact@chineselearning.example.com
`;
  };

  const generateSitemap = () => {
    const urls = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/lessons", priority: "0.9", changefreq: "weekly" },
      { loc: "/readings", priority: "0.9", changefreq: "weekly" },
      { loc: "/medical", priority: "0.9", changefreq: "weekly" },
      { loc: "/grammar", priority: "0.9", changefreq: "weekly" },
      { loc: "/hsk/1", priority: "0.8", changefreq: "weekly" },
      { loc: "/hsk/2", priority: "0.8", changefreq: "weekly" },
      { loc: "/hsk/3", priority: "0.8", changefreq: "weekly" },
      { loc: "/hsk/4", priority: "0.8", changefreq: "weekly" },
      { loc: "/hsk/5", priority: "0.8", changefreq: "weekly" },
      { loc: "/hsk/6", priority: "0.8", changefreq: "weekly" },
      ...contentItems.map((item) => ({
        loc: `/${item.type}s/${item.slug}`,
        priority: "0.7",
        changefreq: "monthly",
      })),
    ];

    return urls;
  };

  const programmaticPages = [
    {
      pattern: "/medical/[category]",
      title: "Medical Chinese: {category} Dialogues",
      description: "Learn essential Chinese phrases for {category} scenarios in Chinese healthcare settings.",
      geo_snippet: "Practice {category} conversations in Mandarin Chinese with our medical dialogue collection.",
      categories: ["挂号", "分诊", "问诊", "检查", "用药", "缴费"],
    },
    {
      pattern: "/medical/phrases/[topic]",
      title: "{topic} - Medical Chinese Phrases",
      description: "Essential Chinese medical phrases for {topic}. Audio pronunciation and pinyin included.",
      geo_snippet: "Master {topic} vocabulary for Chinese medical conversations.",
      categories: ["symptoms", "body-parts", "medications", "procedures"],
    },
    {
      pattern: "/hsk/[level]/vocabulary",
      title: "HSK {level} Vocabulary List - Complete Word List",
      description: "Complete HSK {level} vocabulary list with pinyin, definitions, and example sentences.",
      geo_snippet: "Study all HSK {level} words with our comprehensive vocabulary list and flashcards.",
      categories: ["1", "2", "3", "4", "5", "6"],
    },
    {
      pattern: "/grammar/[pattern]",
      title: "Chinese Grammar: {pattern}",
      description: "Learn the {pattern} grammar pattern with examples and practice exercises.",
      geo_snippet: "Master the {pattern} Chinese grammar structure with clear explanations and examples.",
      categories: ["是", "了", "的", "在", "把", "被"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("SEO 工具", "SEO Tools")}</h1>
        <p className="text-muted-foreground">{t("预览和生成内容的 SEO/GEO 资源", "Preview and generate SEO/GEO assets for your content")}</p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="seo-preview" className="space-y-6">
        <TabsList className="glass-card border border-border/50 p-1 rounded-xl">
          <TabsTrigger value="seo-preview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Search className="h-4 w-4 mr-2" />
            {t("SEO 预览", "SEO Preview")}
          </TabsTrigger>
          <TabsTrigger value="faq-jsonld" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileJson className="h-4 w-4 mr-2" />
            FAQ JSON-LD
          </TabsTrigger>
          <TabsTrigger value="llms-txt" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4 mr-2" />
            {t("llms.txt 预览", "llms.txt Preview")}
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Map className="h-4 w-4 mr-2" />
            {t("站点地图预览", "Sitemap Preview")}
          </TabsTrigger>
          <TabsTrigger value="programmatic" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Layers className="h-4 w-4 mr-2" />
            {t("程序化页面", "Programmatic Pages")}
          </TabsTrigger>
        </TabsList>

        {/* SEO Preview Tab */}
        <TabsContent value="seo-preview" className="space-y-6">
          <div className="flex gap-6 h-[calc(100vh-16rem)]">
            {/* Left: Content Selector */}
            <Card className="w-80 glass-card border-border/50 rounded-2xl flex-shrink-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("选择内容", "Select Content")}</CardTitle>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl mt-2">
                    <SelectValue placeholder={t("按类型筛选", "Filter by type")} />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border/50 rounded-xl">
                    <SelectItem value="all">{t("所有类型", "All Types")}</SelectItem>
                    <SelectItem value="lesson">{t("课程", "Lessons")}</SelectItem>
                    <SelectItem value="reading">{t("阅读", "Readings")}</SelectItem>
                    <SelectItem value="medical">{t("医学对话", "Medical Dialogs")}</SelectItem>
                    <SelectItem value="grammar">{t("语法", "Grammar")}</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-22rem)]">
                  <div className="p-4 space-y-2">
                    {filteredItems.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          selectedItem?.id === item.id
                            ? "bg-primary/20 border border-primary/30"
                            : "hover:bg-secondary/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">/{item.type}s/{item.slug}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs shrink-0 ${getTypeColor(item.type)}`}>
                            {item.type}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right: SEO Preview */}
            <div className="flex-1 space-y-6">
              {selectedItem ? (
                <>
                  {/* Meta Tags Preview */}
                  <Card className="glass-card border-border/50 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        {t("元标签", "Meta Tags")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-muted-foreground">{t("元标题", "Meta Title")}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg"
                            onClick={() => handleCopy(selectedItem.seo_title || selectedItem.title, "title")}
                          >
                            {copiedField === "title" ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                          <p className={`font-medium ${selectedItem.seo_title ? "text-foreground" : "text-muted-foreground italic"}`}>
                            {selectedItem.seo_title || t("未设置 SEO 标题", "No SEO title set")}
                          </p>
                          {selectedItem.seo_title && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedItem.seo_title.length}/60 {t("字符", "characters")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-muted-foreground">{t("元描述", "Meta Description")}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg"
                            onClick={() => handleCopy(selectedItem.seo_description, "description")}
                          >
                            {copiedField === "description" ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30">
                          <p className={`text-sm ${selectedItem.seo_description ? "text-foreground" : "text-muted-foreground italic"}`}>
                            {selectedItem.seo_description || t("未设置 SEO 描述", "No SEO description set")}
                          </p>
                          {selectedItem.seo_description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedItem.seo_description.length}/160 {t("字符", "characters")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-muted-foreground">{t("规范 URL", "Canonical URL")}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg"
                            onClick={() => handleCopy(getCanonicalUrl(selectedItem), "canonical")}
                          >
                            {copiedField === "canonical" ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                          <p className="text-sm text-primary truncate">{getCanonicalUrl(selectedItem)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* OpenGraph Preview */}
                  <Card className="glass-card border-border/50 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-lg">{t("OpenGraph 预览", "OpenGraph Preview")}</CardTitle>
                      <CardDescription>{t("您的内容在社交媒体分享时的显示效果", "How your content appears when shared on social media")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-w-lg border border-border/50 rounded-xl overflow-hidden bg-card">
                        {/* OG Image Placeholder */}
                        <div className="aspect-[1.91/1] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <div className="text-center">
                            <Globe className="h-12 w-12 mx-auto text-primary/50 mb-2" />
                            <p className="text-sm text-muted-foreground">{t("OG 图片占位符", "OG Image Placeholder")}</p>
                            <p className="text-xs text-muted-foreground">1200 x 630</p>
                          </div>
                        </div>
                        {/* OG Content */}
                        <div className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            chineselearning.example.com
                          </p>
                          <p className="font-semibold text-foreground line-clamp-2">
                            {selectedItem.seo_title || selectedItem.title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {selectedItem.seo_description || t("无可用描述", "No description available")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="glass-card border-border/50 rounded-2xl h-full flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t("选择一个内容项以预览 SEO 数据", "Select a content item to preview SEO data")}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* FAQ JSON-LD Tab */}
        <TabsContent value="faq-jsonld" className="space-y-6">
          <div className="flex gap-6 h-[calc(100vh-16rem)]">
            {/* Left: Content Selector */}
            <Card className="w-80 glass-card border-border/50 rounded-2xl flex-shrink-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t("选择包含 FAQ 的内容", "Select Content with FAQ")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-22rem)]">
                  <div className="p-4 space-y-2">
                    {contentItems
                      .filter((item) => item.faq && item.faq.length > 0)
                      .map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`w-full text-left p-3 rounded-xl transition-all ${
                            selectedItem?.id === item.id
                              ? "bg-primary/20 border border-primary/30"
                              : "hover:bg-secondary/50 border border-transparent"
                          }`}
                        >
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.faq?.length || 0} {t("个 FAQ 项", "FAQ items")}
                          </p>
                        </button>
                      ))}
                    {contentItems.filter((item) => item.faq && item.faq.length > 0).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {t("未找到包含 FAQ 数据的内容", "No content with FAQ data found")}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right: JSON-LD Preview */}
            <Card className="flex-1 glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-accent" />
                    FAQ JSON-LD
                  </CardTitle>
                  {selectedItem && generateFaqJsonLd(selectedItem) && (
                    <Button
                      variant="outline"
                      className="rounded-xl bg-transparent"
                      onClick={() => handleCopy(generateFaqJsonLd(selectedItem) || "", "jsonld")}
                    >
                      {copiedField === "jsonld" ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-success" />
                          {t("已复制！", "Copied!")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          {t("复制 JSON-LD", "Copy JSON-LD")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedItem && generateFaqJsonLd(selectedItem) ? (
                  <ScrollArea className="h-[calc(100vh-24rem)]">
                    <pre className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-sm overflow-x-auto font-mono">
                      {generateFaqJsonLd(selectedItem)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="h-64 flex items-center justify-center text-center">
                    <div>
                      <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {selectedItem
                          ? t("此内容没有 FAQ 数据", "This content has no FAQ data")
                          : t("选择包含 FAQ 的内容项以生成 JSON-LD", "Select a content item with FAQ to generate JSON-LD")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* llms.txt Preview Tab */}
        <TabsContent value="llms-txt" className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-chart-3" />
                    {t("llms.txt 预览", "llms.txt Preview")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("针对 LLM 消费优化的站点摘要", "A summary of your site optimized for LLM consumption")}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl bg-transparent"
                  onClick={() => handleCopy(generateLlmsTxt(), "llms")}
                >
                  {copiedField === "llms" ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-success" />
                      {t("已复制！", "Copied!")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      {t("复制 llms.txt", "Copy llms.txt")}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <pre className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-sm whitespace-pre-wrap font-mono">
                  {generateLlmsTxt()}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sitemap Preview Tab */}
        <TabsContent value="sitemap" className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Map className="h-5 w-5 text-chart-4" />
                    {t("站点地图预览", "Sitemap Preview")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t("为您的内容生成的 sitemap.xml 条目", "Generated sitemap.xml entries for your content")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl bg-transparent"
                    onClick={() => {
                      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${generateSitemap()
  .map(
    (url) => `  <url>
    <loc>https://chineselearning.example.com${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
                      handleCopy(sitemapXml, "sitemap");
                    }}
                  >
                    {copiedField === "sitemap" ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-success" />
                        {t("已复制！", "Copied!")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        {t("复制 XML", "Copy XML")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl bg-transparent"
                    onClick={() => {
                      toast.success(t("下载已开始", "Download started"), { description: "sitemap.xml (mock)" });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("下载", "Download")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-2">
                  {generateSitemap().map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono text-primary">{url.loc}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{t("优先级", "Priority")}: {url.priority}</span>
                        <span>{t("频率", "Freq")}: {url.changefreq}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programmatic Pages Tab */}
        <TabsContent value="programmatic" className="space-y-6">
          <Card className="glass-card border-border/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-chart-5" />
                {t("程序化页面模板", "Programmatic Page Templates")}
              </CardTitle>
              <CardDescription>
                {t("动态生成页面的模板", "Templates for dynamically generated pages")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-6">
                  {programmaticPages.map((page, i) => (
                    <Card key={i} className="bg-secondary/20 border-border/30 rounded-xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 font-mono">
                            {page.pattern}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">{t("标题模板", "Title Template")}</p>
                            <p className="text-sm p-2 rounded-lg bg-secondary/30 font-mono">{page.title}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">{t("描述模板", "Description Template")}</p>
                            <p className="text-sm p-2 rounded-lg bg-secondary/30 font-mono">{page.description}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">{t("GEO 摘要模板", "GEO Snippet Template")}</p>
                            <p className="text-sm p-2 rounded-lg bg-secondary/30 font-mono">{page.geo_snippet}</p>
                          </div>
                        </div>
                        <Separator className="bg-border/30" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">{t("生成的页面", "Generated Pages")}</p>
                          <div className="flex flex-wrap gap-2">
                            {page.categories.map((cat, j) => (
                              <Badge key={j} variant="outline" className="bg-secondary/30">
                                {page.pattern.replace("[category]", cat).replace("[topic]", cat).replace("[level]", cat).replace("[pattern]", cat)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium ${className}`}>{children}</p>;
}
