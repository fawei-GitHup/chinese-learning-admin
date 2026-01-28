"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Locale = "zh" | "en";

interface AdminLocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (zh: string, en: string) => string;
}

const AdminLocaleContext = createContext<AdminLocaleContextType | undefined>(undefined);

const STORAGE_KEY = "admin_locale";

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "zh" || stored === "en") {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  const t = (zh: string, en: string) => {
    return locale === "zh" ? zh : en;
  };

  if (!mounted) {
    return null;
  }

  return (
    <AdminLocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);
  if (!context) {
    throw new Error("useAdminLocale must be used within AdminLocaleProvider");
  }
  return context;
}

// Translation dictionary for common labels
export const translations = {
  // Navigation
  dashboard: { zh: "仪表盘", en: "Dashboard" },
  content: { zh: "内容管理", en: "Content" },
  lessons: { zh: "课程", en: "Lessons" },
  readings: { zh: "阅读", en: "Readings" },
  medicalDialogs: { zh: "医学对话", en: "Medical Dialogs" },
  grammar: { zh: "语法", en: "Grammar" },
  lexicon: { zh: "词典", en: "Lexicon" },
  scenarios: { zh: "情景", en: "Scenarios" },
  assets: { zh: "资源", en: "Assets" },
  seo: { zh: "SEO 工具", en: "SEO Tools" },
  seoGeo: { zh: "SEO / GEO 管理", en: "SEO / GEO Management" },
  settings: { zh: "设置", en: "Settings" },
  
  // Actions
  create: { zh: "新建", en: "Create" },
  edit: { zh: "编辑", en: "Edit" },
  delete: { zh: "删除", en: "Delete" },
  save: { zh: "保存", en: "Save" },
  saveDraft: { zh: "保存草稿", en: "Save Draft" },
  publish: { zh: "发布", en: "Publish" },
  archive: { zh: "归档", en: "Archive" },
  cancel: { zh: "取消", en: "Cancel" },
  search: { zh: "搜索", en: "Search" },
  filter: { zh: "筛选", en: "Filter" },
  export: { zh: "导出", en: "Export" },
  submitReview: { zh: "提交审核", en: "Submit for Review" },
  approve: { zh: "批准", en: "Approve" },
  reject: { zh: "拒绝", en: "Reject" },
  
  // Status
  draft: { zh: "草稿", en: "Draft" },
  inReview: { zh: "审核中", en: "In Review" },
  published: { zh: "已发布", en: "Published" },
  archived: { zh: "已归档", en: "Archived" },
  warning: { zh: "警告", en: "Warning" },
  
  // Fields
  title: { zh: "标题", en: "Title" },
  slug: { zh: "URL 别名", en: "Slug" },
  level: { zh: "等级", en: "Level" },
  tags: { zh: "标签", en: "Tags" },
  summary: { zh: "摘要", en: "Summary" },
  content: { zh: "内容", en: "Content" },
  author: { zh: "作者", en: "Author" },
  createdAt: { zh: "创建时间", en: "Created At" },
  updatedAt: { zh: "更新时间", en: "Updated At" },
  status: { zh: "状态", en: "Status" },
  actions: { zh: "操作", en: "Actions" },
  
  // SEO/GEO fields
  seoTitle: { zh: "SEO 标题", en: "SEO Title" },
  seoDescription: { zh: "SEO 描述", en: "SEO Description" },
  geoSnippet: { zh: "GEO 片段", en: "GEO Snippet" },
  keyPoints: { zh: "关键要点", en: "Key Points" },
  faq: { zh: "常见问题", en: "FAQ" },
  
  // Medical specific
  category: { zh: "分类", en: "Category" },
  difficulty: { zh: "难度", en: "Difficulty" },
  keyPhrases: { zh: "关键短语", en: "Key Phrases" },
  safetyNote: { zh: "安全提示", en: "Safety Note" },
  
  // Messages
  noPermission: { zh: "您没有权限执行此操作", en: "You don't have permission" },
  deleteConfirm: { zh: "确定要删除吗？此操作不可撤销。", en: "Are you sure? This cannot be undone." },
  saveSuccess: { zh: "保存成功", en: "Saved successfully" },
  publishSuccess: { zh: "发布成功", en: "Published successfully" },
  geoRequired: { zh: "GEO 字段必填", en: "GEO fields are required" },
  keyPointsMin: { zh: "至少需要3个关键要点", en: "At least 3 key points required" },
} as const;

export type TranslationKey = keyof typeof translations;

export function useTranslation() {
  const { locale } = useAdminLocale();
  
  return {
    t: (key: TranslationKey) => translations[key][locale],
    locale,
  };
}
