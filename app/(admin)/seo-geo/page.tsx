"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileJson,
  BookMarked,
  Languages,
  Theater,
  Info,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminLocale } from "@/lib/admin-locale";
import {
  getLexicon,
  getMedicalGrammar,
  getScenarios,
  getGeoStatus,
  exportLexiconJSON,
  exportMedicalGrammarJSON,
  exportScenariosJSON,
  downloadJSON,
  type LexiconEntry,
  type MedicalGrammar,
  type MedicalScenario,
} from "@/lib/admin-mock";
import { toast } from "sonner";

interface GeoStats {
  total: number;
  complete: number;
  partial: number;
  missing: number;
}

function calculateStats(
  items: Array<{ geo_snippet?: string; key_points?: string[]; geo_intro?: string; key_takeaways?: string[] }>
): GeoStats {
  const stats: GeoStats = { total: 0, complete: 0, partial: 0, missing: 0 };
  stats.total = items.length;
  for (const item of items) {
    const status = getGeoStatus(item);
    stats[status]++;
  }
  return stats;
}

function getPercentage(complete: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((complete / total) * 100);
}

export default function SeoGeoPage() {
  const { locale } = useAdminLocale();
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  const [lexicon, setLexicon] = useState<LexiconEntry[]>([]);
  const [grammar, setGrammar] = useState<MedicalGrammar[]>([]);
  const [scenarios, setScenarios] = useState<MedicalScenario[]>([]);

  useEffect(() => {
    setLexicon(getLexicon());
    setGrammar(getMedicalGrammar());
    setScenarios(getScenarios());
  }, []);

  const lexiconStats = calculateStats(lexicon);
  const grammarStats = calculateStats(grammar);
  const scenarioStats = calculateStats(scenarios);

  const handleExport = (type: "lexicon" | "grammar" | "scenarios") => {
    try {
      switch (type) {
        case "lexicon":
          downloadJSON(exportLexiconJSON(), "lexicon.json");
          toast.success(t("导出成功", "Export successful"), {
            description: "lexicon.json",
          });
          break;
        case "grammar":
          downloadJSON(exportMedicalGrammarJSON(), "grammar.json");
          toast.success(t("导出成功", "Export successful"), {
            description: "grammar.json",
          });
          break;
        case "scenarios":
          downloadJSON(exportScenariosJSON(), "scenarios.json");
          toast.success(t("导出成功", "Export successful"), {
            description: "scenarios.json",
          });
          break;
      }
    } catch {
      toast.error(t("导出失败", "Export failed"));
    }
  };

  const getMissingItems = () => {
    const missing: Array<{ type: string; id: string; title: string; status: "partial" | "missing" }> = [];

    for (const item of lexicon) {
      const status = getGeoStatus(item);
      if (status !== "complete") {
        missing.push({ type: "lexicon", id: item.id, title: item.term, status });
      }
    }
    for (const item of grammar) {
      const status = getGeoStatus(item);
      if (status !== "complete") {
        missing.push({ type: "grammar", id: item.id, title: item.title, status });
      }
    }
    for (const item of scenarios) {
      const status = getGeoStatus(item);
      if (status !== "complete") {
        missing.push({ type: "scenario", id: item.id, title: item.title, status });
      }
    }

    return missing;
  };

  const missingItems = getMissingItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Globe className="h-7 w-7 text-primary" />
            {t("SEO / GEO 管理", "SEO / GEO Management")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("管理内容的 GEO 字段并导出 JSON 供用户端使用", "Manage GEO fields and export JSON for user app")}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lexicon GEO */}
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-primary" />
              {t("词典 GEO 覆盖率", "Lexicon GEO Coverage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">
                {getPercentage(lexiconStats.complete, lexiconStats.total)}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                ({lexiconStats.complete}/{lexiconStats.total})
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${getPercentage(lexiconStats.complete, lexiconStats.total)}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                {t("完整", "Complete")}: {lexiconStats.complete}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-warning" />
                {t("部分", "Partial")}: {lexiconStats.partial}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                {t("缺失", "Missing")}: {lexiconStats.missing}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Grammar GEO */}
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Languages className="h-5 w-5 text-accent" />
              {t("语法 GEO 覆盖率", "Grammar GEO Coverage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">
                {getPercentage(grammarStats.complete, grammarStats.total)}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                ({grammarStats.complete}/{grammarStats.total})
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${getPercentage(grammarStats.complete, grammarStats.total)}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                {t("完整", "Complete")}: {grammarStats.complete}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-warning" />
                {t("部分", "Partial")}: {grammarStats.partial}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                {t("缺失", "Missing")}: {grammarStats.missing}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Scenarios GEO */}
        <Card className="glass-card border-border/50 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Theater className="h-5 w-5 text-chart-4" />
              {t("情景 GEO 覆盖率", "Scenarios GEO Coverage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-foreground">
                {getPercentage(scenarioStats.complete, scenarioStats.total)}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                ({scenarioStats.complete}/{scenarioStats.total})
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${getPercentage(scenarioStats.complete, scenarioStats.total)}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success" />
                {t("完整", "Complete")}: {scenarioStats.complete}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-warning" />
                {t("部分", "Partial")}: {scenarioStats.partial}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                {t("缺失", "Missing")}: {scenarioStats.missing}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            {t("导出 JSON", "Export JSON")}
          </CardTitle>
          <CardDescription>
            {t("导出已发布内容的 JSON 文件，包含 GEO 字段", "Export published content as JSON files with GEO fields")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button
            onClick={() => handleExport("lexicon")}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            {t("导出 lexicon.json", "Export lexicon.json")}
          </Button>
          <Button
            onClick={() => handleExport("grammar")}
            className="rounded-xl bg-accent hover:bg-accent/90"
          >
            <Download className="mr-2 h-4 w-4" />
            {t("导出 grammar.json", "Export grammar.json")}
          </Button>
          <Button
            onClick={() => handleExport("scenarios")}
            variant="outline"
            className="rounded-xl bg-transparent border-chart-4/50 text-chart-4 hover:bg-chart-4/10"
          >
            <Download className="mr-2 h-4 w-4" />
            {t("导出 scenarios.json", "Export scenarios.json")}
          </Button>
        </CardContent>
      </Card>

      {/* Missing GEO Table */}
      <Card className="glass-card border-border/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t("缺失 GEO 字段的内容", "Content Missing GEO Fields")}
          </CardTitle>
          <CardDescription>
            {t("以下内容的 GEO 字段不完整，无法发布", "The following content has incomplete GEO fields and cannot be published")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <p className="text-lg font-medium text-foreground">
                {t("所有内容的 GEO 字段都已完整", "All content has complete GEO fields")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("太棒了！可以安全导出 JSON", "Great! JSON export is safe")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">{t("类型", "Type")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("标题", "Title")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("状态", "Status")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("操作", "Action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingItems.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} className="border-border/30 hover:bg-secondary/30">
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg">
                        {item.type === "lexicon" && t("词典", "Lexicon")}
                        {item.type === "grammar" && t("语法", "Grammar")}
                        {item.type === "scenario" && t("情景", "Scenario")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{item.title}</TableCell>
                    <TableCell>
                      {item.status === "missing" ? (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 rounded-lg">
                          <XCircle className="mr-1 h-3 w-3" />
                          {t("缺失", "Missing")}
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/20 text-warning border-warning/30 rounded-lg">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {t("部分", "Partial")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-primary hover:text-primary hover:bg-primary/10"
                      >
                        {t("编辑", "Edit")}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* How to Publish Card */}
      <Card className="glass-card border-border/50 rounded-2xl border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {t("如何发布到用户端", "How to Publish to Site")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 text-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </span>
              <div>
                <p className="font-medium">{t("完善 GEO 字段", "Complete GEO Fields")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(
                    "确保每个内容都有 geo_snippet 和至少 3 个 key_points",
                    "Ensure each content has geo_snippet and at least 3 key_points"
                  )}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </span>
              <div>
                <p className="font-medium">{t("导出 JSON 文件", "Export JSON Files")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(
                    "点击上方导出按钮下载 lexicon.json、grammar.json、scenarios.json",
                    "Click export buttons above to download lexicon.json, grammar.json, scenarios.json"
                  )}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </span>
              <div>
                <p className="font-medium">{t("放置 JSON 到用户端", "Place JSON in User App")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(
                    "将 JSON 文件复制到用户端应用的 /public/data/ 目录",
                    "Copy JSON files to /public/data/ directory of the user app"
                  )}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                4
              </span>
              <div>
                <p className="font-medium">{t("用户端读取 JSON", "User App Reads JSON")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(
                    "用户端页面从 /data/*.json 读取数据渲染词典、语法、情景内容",
                    "User pages read from /data/*.json to render dictionary, grammar, and scenario content"
                  )}
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border/30">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{t("示例代码", "Example Code")}:</strong>
            </p>
            <pre className="mt-2 text-xs text-muted-foreground font-mono overflow-x-auto">
{`// User app: /app/dictionary/page.tsx
const res = await fetch('/data/lexicon.json');
const lexicon = await res.json();

// Each entry includes GEO fields:
// { term, pinyin, definition, geo_snippet, key_points, faq_json }`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
