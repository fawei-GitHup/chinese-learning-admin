import {
  type Lesson,
  type Reading,
  type MedicalDialog,
  type GrammarRule,
  type Asset,
  type SEOPage,
  mockLessons,
  mockReadings,
  mockMedicalDialogs,
  mockGrammarRules,
  mockAssets,
  mockSEOPages,
} from "./data";

// Storage keys
const STORAGE_KEYS = {
  lessons: "admin_lessons",
  readings: "admin_readings",
  medicalDialogs: "admin_medical_dialogs",
  grammar: "admin_grammar",
  assets: "admin_assets",
  seo: "admin_seo",
  initialized: "admin_initialized",
} as const;

// Initialize all storage with mock data on first load
function initializeAllStorage(): void {
  if (typeof window === "undefined") return;
  
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (initialized) return;
  
  localStorage.setItem(STORAGE_KEYS.lessons, JSON.stringify(mockLessons));
  localStorage.setItem(STORAGE_KEYS.readings, JSON.stringify(mockReadings));
  localStorage.setItem(STORAGE_KEYS.medicalDialogs, JSON.stringify(mockMedicalDialogs));
  localStorage.setItem(STORAGE_KEYS.grammar, JSON.stringify(mockGrammarRules));
  localStorage.setItem(STORAGE_KEYS.assets, JSON.stringify(mockAssets));
  localStorage.setItem(STORAGE_KEYS.seo, JSON.stringify(mockSEOPages));
  localStorage.setItem(STORAGE_KEYS.initialized, "true");
}

// Generic get function
function getFromStorage<T>(key: string, defaultData: T[]): T[] {
  if (typeof window === "undefined") return defaultData;
  
  initializeAllStorage();
  
  const stored = localStorage.getItem(key);
  if (!stored) return defaultData;
  
  try {
    return JSON.parse(stored);
  } catch {
    return defaultData;
  }
}

// Generic save function
function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Lessons CRUD
export function getLessons(): Lesson[] {
  return getFromStorage(STORAGE_KEYS.lessons, mockLessons);
}

export function getLesson(id: string): Lesson | undefined {
  return getLessons().find((l) => l.id === id);
}

export function saveLesson(lesson: Lesson): void {
  const lessons = getLessons();
  const index = lessons.findIndex((l) => l.id === lesson.id);
  if (index >= 0) {
    lessons[index] = lesson;
  } else {
    lessons.push(lesson);
  }
  saveToStorage(STORAGE_KEYS.lessons, lessons);
}

export function deleteLesson(id: string): void {
  const lessons = getLessons().filter((l) => l.id !== id);
  saveToStorage(STORAGE_KEYS.lessons, lessons);
}

// Readings CRUD
export function getReadings(): Reading[] {
  return getFromStorage(STORAGE_KEYS.readings, mockReadings);
}

export function getReading(id: string): Reading | undefined {
  return getReadings().find((r) => r.id === id);
}

export function saveReading(reading: Reading): void {
  const readings = getReadings();
  const index = readings.findIndex((r) => r.id === reading.id);
  if (index >= 0) {
    readings[index] = reading;
  } else {
    readings.push(reading);
  }
  saveToStorage(STORAGE_KEYS.readings, readings);
}

export function deleteReading(id: string): void {
  const readings = getReadings().filter((r) => r.id !== id);
  saveToStorage(STORAGE_KEYS.readings, readings);
}

// Medical Dialogs CRUD
export function getMedicalDialogs(): MedicalDialog[] {
  return getFromStorage(STORAGE_KEYS.medicalDialogs, mockMedicalDialogs);
}

export function getMedicalDialog(id: string): MedicalDialog | undefined {
  return getMedicalDialogs().find((d) => d.id === id);
}

export function saveMedicalDialog(dialog: MedicalDialog): void {
  const dialogs = getMedicalDialogs();
  const index = dialogs.findIndex((d) => d.id === dialog.id);
  if (index >= 0) {
    dialogs[index] = dialog;
  } else {
    dialogs.push(dialog);
  }
  saveToStorage(STORAGE_KEYS.medicalDialogs, dialogs);
}

export function deleteMedicalDialog(id: string): void {
  const dialogs = getMedicalDialogs().filter((d) => d.id !== id);
  saveToStorage(STORAGE_KEYS.medicalDialogs, dialogs);
}

// Grammar Rules CRUD
export function getGrammarRules(): GrammarRule[] {
  return getFromStorage(STORAGE_KEYS.grammar, mockGrammarRules);
}

export function getGrammarRule(id: string): GrammarRule | undefined {
  return getGrammarRules().find((r) => r.id === id);
}

export function saveGrammarRule(rule: GrammarRule): void {
  const rules = getGrammarRules();
  const index = rules.findIndex((r) => r.id === rule.id);
  if (index >= 0) {
    rules[index] = rule;
  } else {
    rules.push(rule);
  }
  saveToStorage(STORAGE_KEYS.grammar, rules);
}

export function deleteGrammarRule(id: string): void {
  const rules = getGrammarRules().filter((r) => r.id !== id);
  saveToStorage(STORAGE_KEYS.grammar, rules);
}

// Assets CRUD
export function getAssets(): Asset[] {
  return getFromStorage(STORAGE_KEYS.assets, mockAssets);
}

export function getAsset(id: string): Asset | undefined {
  return getAssets().find((a) => a.id === id);
}

export function saveAsset(asset: Asset): void {
  const assets = getAssets();
  const index = assets.findIndex((a) => a.id === asset.id);
  if (index >= 0) {
    assets[index] = asset;
  } else {
    assets.push(asset);
  }
  saveToStorage(STORAGE_KEYS.assets, assets);
}

export function deleteAsset(id: string): void {
  const assets = getAssets().filter((a) => a.id !== id);
  saveToStorage(STORAGE_KEYS.assets, assets);
}

// SEO Pages CRUD
export function getSEOPages(): SEOPage[] {
  return getFromStorage(STORAGE_KEYS.seo, mockSEOPages);
}

export function getSEOPage(id: string): SEOPage | undefined {
  return getSEOPages().find((p) => p.id === id);
}

export function saveSEOPage(page: SEOPage): void {
  const pages = getSEOPages();
  const index = pages.findIndex((p) => p.id === page.id);
  if (index >= 0) {
    pages[index] = page;
  } else {
    pages.push(page);
  }
  saveToStorage(STORAGE_KEYS.seo, pages);
}

export function deleteSEOPage(id: string): void {
  const pages = getSEOPages().filter((p) => p.id !== id);
  saveToStorage(STORAGE_KEYS.seo, pages);
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all content for dashboard stats
export function getAllContent() {
  return {
    lessons: getLessons(),
    readings: getReadings(),
    medicalDialogs: getMedicalDialogs(),
    grammarRules: getGrammarRules(),
  };
}

// Get recent activity across all content types
export interface ActivityItem {
  id: string;
  title: string;
  type: "lesson" | "reading" | "medical_dialog" | "grammar";
  status: string;
  updatedAt: string;
  author: string;
}

export function getRecentActivity(limit = 10): ActivityItem[] {
  const allContent: ActivityItem[] = [
    ...getLessons().map((l) => ({
      id: l.id,
      title: l.title,
      type: "lesson" as const,
      status: l.status,
      updatedAt: l.updatedAt,
      author: l.author,
    })),
    ...getReadings().map((r) => ({
      id: r.id,
      title: r.title,
      type: "reading" as const,
      status: r.status,
      updatedAt: r.updatedAt,
      author: r.author,
    })),
    ...getMedicalDialogs().map((d) => ({
      id: d.id,
      title: d.title,
      type: "medical_dialog" as const,
      status: d.status,
      updatedAt: d.updatedAt,
      author: d.author,
    })),
    ...getGrammarRules().map((g) => ({
      id: g.id,
      title: g.title,
      type: "grammar" as const,
      status: g.status,
      updatedAt: g.updatedAt,
      author: g.author,
    })),
  ];

  return allContent
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

// Get content health issues
export interface ContentHealthIssue {
  id: string;
  title: string;
  type: string;
  issue: string;
}

export function getContentHealthIssues(): ContentHealthIssue[] {
  const issues: ContentHealthIssue[] = [];

  getLessons().forEach((lesson) => {
    if (!lesson.seo_title) {
      issues.push({ id: lesson.id, title: lesson.title, type: "lesson", issue: "Missing SEO Title" });
    }
    if (!lesson.geo_snippet) {
      issues.push({ id: lesson.id, title: lesson.title, type: "lesson", issue: "Missing GEO Snippet" });
    }
  });

  getReadings().forEach((reading) => {
    if (!reading.seo_title) {
      issues.push({ id: reading.id, title: reading.title, type: "reading", issue: "Missing SEO Title" });
    }
    if (reading.faq.length === 0) {
      issues.push({ id: reading.id, title: reading.title, type: "reading", issue: "Missing FAQ" });
    }
    if (!reading.geo_snippet) {
      issues.push({ id: reading.id, title: reading.title, type: "reading", issue: "Missing GEO Snippet" });
    }
  });

  getMedicalDialogs().forEach((dialog) => {
    if (!dialog.seo_title) {
      issues.push({ id: dialog.id, title: dialog.title, type: "medical_dialog", issue: "Missing SEO Title" });
    }
    if (dialog.faq.length === 0) {
      issues.push({ id: dialog.id, title: dialog.title, type: "medical_dialog", issue: "Missing FAQ" });
    }
    if (!dialog.geo_snippet) {
      issues.push({ id: dialog.id, title: dialog.title, type: "medical_dialog", issue: "Missing GEO Snippet" });
    }
  });

  getGrammarRules().forEach((rule) => {
    if (!rule.seo_title) {
      issues.push({ id: rule.id, title: rule.title, type: "grammar", issue: "Missing SEO Title" });
    }
    if (!rule.geo_snippet) {
      issues.push({ id: rule.id, title: rule.title, type: "grammar", issue: "Missing GEO Snippet" });
    }
  });

  return issues;
}

// Reset storage (for testing)
export function resetStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.initialized);
  localStorage.removeItem(STORAGE_KEYS.lessons);
  localStorage.removeItem(STORAGE_KEYS.readings);
  localStorage.removeItem(STORAGE_KEYS.medicalDialogs);
  localStorage.removeItem(STORAGE_KEYS.grammar);
  localStorage.removeItem(STORAGE_KEYS.assets);
  localStorage.removeItem(STORAGE_KEYS.seo);
  initializeAllStorage();
}
