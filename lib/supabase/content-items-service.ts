"use client";

import { getSupabaseBrowser, isSupabaseConfigured } from "./client";
import type { PublishingData } from "@/lib/validatePublishing";
import { type ContentItemType, contentItemTypeSchema } from "@/lib/content-types";

// ============================================
// VALIDATION HELPERS
// ============================================

function validateContentItemType(type: string): asserts type is ContentItemType {
  const result = contentItemTypeSchema.safeParse(type);
  if (!result.success) {
    throw new Error(`Invalid content item type: ${type}`);
  }
}

// ============================================
// TYPES matching content_items schema
// ============================================

export interface ContentItemSEO {
  title: string;
  description: string;
  canonical?: string | null;
  ogImage?: string | null;
}

export interface ContentItemGEO {
  snippet: string;
  keyPoints: string[];
  faq: Array<{ question: string; answer: string }>;
  llmHint?: string | null;
}

export interface ContentItemBase {
  id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  type: ContentItemType;
  slug: string;
  locale: string;
  status: "draft" | "published" | "archived";
  content_json: Record<string, unknown>;
  seo_json: ContentItemSEO;
  geo_json: ContentItemGEO;
}

// ============================================
// MEDICAL_LEXICON specific types
// ============================================

export interface MedicalLexiconContent {
  term: string;
  pinyin: string;
  definition: string;
  usage: {
    say_it_like: string[];
    dont_say: string[];
    collocations: string[];
  };
}

export interface MedicalLexiconItem extends Omit<ContentItemBase, "content_json"> {
  type: "medical_lexicon";
  content_json: MedicalLexiconContent;
}

// UI-friendly type for workbench
export interface MedicalLexiconUIEntry {
  id: string;
  term: string;
  pinyin: string;
  definition: string;
  say_it_like: string[];
  dont_say: string[];
  collocations: string[];
  publishing: PublishingData & { faq?: Array<{ question: string; answer: string }> };
  createdAt: string;
  updatedAt: string;
  author: string;
}

// ============================================
// MEDICAL_SCENARIO specific types
// ============================================

export interface ConversationLine {
  speaker: string;
  line: string;
  note?: string;
}

export interface ScenarioWarning {
  type: "caution" | "urgent";
  message: string;
}

export interface MedicalScenarioContent {
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  conversation: ConversationLine[];
  key_phrases: string[];
  checklist: string[];
  warnings: ScenarioWarning[];
}

export interface MedicalScenarioItem extends Omit<ContentItemBase, "content_json"> {
  type: "medical_scenario";
  content_json: MedicalScenarioContent;
}

// UI-friendly type for workbench
export interface MedicalScenarioUIEntry {
  id: string;
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  conversation: ConversationLine[];
  key_phrases: string[];
  checklist: string[];
  warnings: ScenarioWarning[];
  publishing: PublishingData & { faq?: Array<{ question: string; answer: string }> };
  createdAt: string;
  updatedAt: string;
  author: string;
}

// ============================================
// CONVERTERS
// ============================================

export function contentItemToUI(item: MedicalLexiconItem): MedicalLexiconUIEntry;
export function contentItemToUI(item: MedicalScenarioItem): MedicalScenarioUIEntry;
export function contentItemToUI(item: MedicalLexiconItem | MedicalScenarioItem): MedicalLexiconUIEntry | MedicalScenarioUIEntry {
  if (item.type === "medical_lexicon") {
    const content = item.content_json as MedicalLexiconContent;
    return {
      id: item.id,
      term: content.term || "",
      pinyin: content.pinyin || "",
      definition: content.definition || "",
      say_it_like: content.usage?.say_it_like || [],
      dont_say: content.usage?.dont_say || [],
      collocations: content.usage?.collocations || [],
      publishing: {
        slug: item.slug,
        status: item.status === "published" ? "published" : "draft",
        publishedAt: item.published_at,
        seo: {
          title: item.seo_json?.title || "",
          description: item.seo_json?.description || "",
        },
        geo: {
          snippet: item.geo_json?.snippet || "",
          keyPoints: item.geo_json?.keyPoints || [],
        },
        faq: item.geo_json?.faq || [],
      },
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      author: "Unknown", // content_items doesn't store author directly; could extend later
    };
  } else {
    const content = item.content_json as MedicalScenarioContent;
    return {
      id: item.id,
      title: content.title || "",
      category: content.category || "",
      difficulty: content.difficulty || "Beginner",
      conversation: content.conversation || [],
      key_phrases: content.key_phrases || [],
      checklist: content.checklist || [],
      warnings: content.warnings || [],
      publishing: {
        slug: item.slug,
        status: item.status === "published" ? "published" : "draft",
        publishedAt: item.published_at,
        seo: {
          title: item.seo_json?.title || "",
          description: item.seo_json?.description || "",
        },
        geo: {
          snippet: item.geo_json?.snippet || "",
          keyPoints: item.geo_json?.keyPoints || [],
        },
        faq: item.geo_json?.faq || [],
      },
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      author: "Unknown", // content_items doesn't store author directly; could extend later
    };
  }
}

// Helper to generate unique slug from text
function generateSlug(text: string, id: string): string {
  const idSuffix = id.substring(0, 8);
  if (!text || text.trim() === "") {
    return `entry-${idSuffix}`;
  }
  const baseSlug = text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "") // Keep Chinese chars, letters, numbers, spaces, hyphens
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
  // Always append a unique suffix to prevent collisions
  return `${baseSlug}-${idSuffix}` || `entry-${idSuffix}`;
}

export function uiToContentItem(
  entry: MedicalLexiconUIEntry
): Omit<MedicalLexiconItem, "created_at" | "updated_at">;
export function uiToContentItem(
  entry: MedicalScenarioUIEntry
): Omit<MedicalScenarioItem, "created_at" | "updated_at">;
export function uiToContentItem(
  entry: MedicalLexiconUIEntry | MedicalScenarioUIEntry
): Omit<MedicalLexiconItem | MedicalScenarioItem, "created_at" | "updated_at"> {
  if ("term" in entry) {
    // Medical Lexicon
    const slug = entry.publishing.slug || generateSlug(entry.term, entry.id);
    return {
      id: entry.id,
      type: "medical_lexicon",
      slug,
      locale: "zh-CN",
      status: entry.publishing.status === "published" ? "published" : "draft",
      published_at: entry.publishing.publishedAt || null,
      content_json: {
        term: entry.term,
        pinyin: entry.pinyin,
        definition: entry.definition,
        usage: {
          say_it_like: entry.say_it_like,
          dont_say: entry.dont_say,
          collocations: entry.collocations,
        },
      },
      seo_json: {
        title: entry.publishing.seo?.title || "",
        description: entry.publishing.seo?.description || "",
        canonical: null,
        ogImage: null,
      },
      geo_json: {
        snippet: entry.publishing.geo?.snippet || "",
        keyPoints: entry.publishing.geo?.keyPoints || [],
        faq: entry.publishing.faq || [],
        llmHint: null,
      },
    } as Omit<MedicalLexiconItem, "created_at" | "updated_at">;
  } else {
    // Medical Scenario
    const slug = entry.publishing.slug || generateSlug(entry.title, entry.id);
    return {
      id: entry.id,
      type: "medical_scenario",
      slug,
      locale: "zh-CN",
      status: entry.publishing.status === "published" ? "published" : "draft",
      published_at: entry.publishing.publishedAt || null,
      content_json: {
        title: entry.title,
        category: entry.category,
        difficulty: entry.difficulty,
        conversation: entry.conversation,
        key_phrases: entry.key_phrases,
        checklist: entry.checklist,
        warnings: entry.warnings,
      },
      seo_json: {
        title: entry.publishing.seo?.title || "",
        description: entry.publishing.seo?.description || "",
        canonical: null,
        ogImage: null,
      },
      geo_json: {
        snippet: entry.publishing.geo?.snippet || "",
        keyPoints: entry.publishing.geo?.keyPoints || [],
        faq: entry.publishing.faq || [],
        llmHint: null,
      },
    } as Omit<MedicalScenarioItem, "created_at" | "updated_at">;
  }
}

// ============================================
// CRUD FUNCTIONS for medical_lexicon
// ============================================

export async function fetchMedicalLexicon(): Promise<MedicalLexiconItem[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("type", "medical_lexicon")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Supabase] Error fetching medical_lexicon:", error);
      throw error; // Throw error so page can handle it
    }

    return (data || []) as MedicalLexiconItem[];
  } catch (err) {
    console.error("[Supabase] Error fetching medical_lexicon:", err);
    throw err; // Re-throw so page can fallback to mock
  }
}

export async function upsertMedicalLexicon(
  entry: MedicalLexiconUIEntry
): Promise<MedicalLexiconItem | null> {
  validateContentItemType("medical_lexicon");

  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const itemData = uiToContentItem(entry);

  // Check if record with this ID exists
  const { data: existing } = await supabase
    .from("content_items")
    .select("id")
    .eq("id", entry.id)
    .single();

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from("content_items")
      .update({
        ...itemData,
        updated_at: now,
      })
      .eq("id", entry.id)
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error updating medical_lexicon:", error);
      return null;
    }

    return data as MedicalLexiconItem;
  } else {
    // Insert new record
    const payload = {
      ...itemData,
      updated_at: now,
      created_at: entry.createdAt || now,
    };

    const { data, error } = await supabase
      .from("content_items")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error inserting medical_lexicon:", error);
      return null;
    }

    return data as MedicalLexiconItem;
  }
}

export async function deleteMedicalLexiconById(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("content_items")
    .delete()
    .eq("id", id)
    .eq("type", "medical_lexicon");

  if (error) {
    console.error("[Supabase] Error deleting medical_lexicon:", error);
    return false;
  }

  return true;
}

// ============================================
// MEDICAL_SCENARIO CRUD functions
// ============================================

export async function fetchMedicalScenarios(): Promise<MedicalScenarioItem[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", "medical_scenario")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Supabase] Error fetching medical_scenario:", error);
    return [];
  }

  return (data || []) as MedicalScenarioItem[];
}

export async function upsertMedicalScenario(
  entry: MedicalScenarioUIEntry
): Promise<MedicalScenarioItem | null> {
  validateContentItemType("medical_scenario");

  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const itemData = uiToContentItem(entry);

  // Check if record with this ID exists
  const { data: existing } = await supabase
    .from("content_items")
    .select("id")
    .eq("id", entry.id)
    .single();

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from("content_items")
      .update({
        ...itemData,
        updated_at: now,
      })
      .eq("id", entry.id)
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error updating medical_scenario:", error);
      return null;
    }

    return data as MedicalScenarioItem;
  } else {
    // Insert new record
    const payload = {
      ...itemData,
      updated_at: now,
      created_at: entry.createdAt || now,
    };

    const { data, error } = await supabase
      .from("content_items")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error inserting medical_scenario:", error);
      return null;
    }

    return data as MedicalScenarioItem;
  }
}

export async function deleteMedicalScenarioById(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("content_items")
    .delete()
    .eq("id", id)
    .eq("type", "medical_scenario");

  if (error) {
    console.error("[Supabase] Error deleting medical_scenario:", error);
    return false;
  }

  return true;
}

// ============================================
// MEDICAL_DIALOG specific types
// ============================================

export interface MedicalDialogExchange {
  speaker: string;
  text: string;
  pinyin?: string;
}

export interface MedicalDialogParticipant {
  name: string;
  role: string;
}

export interface MedicalDialogVocabulary {
  term: string;
  definition: string;
  pinyin?: string;
}

export interface MedicalDialogContent {
  title: string;
  dialog_type: "conversation" | "article";
  participants: MedicalDialogParticipant[];
  exchanges: MedicalDialogExchange[];
  article_body?: string;
  vocabulary: MedicalDialogVocabulary[];
  medical_context?: string;
}

export interface MedicalDialogItem extends Omit<ContentItemBase, "content_json"> {
  type: "medical_dialog";
  content_json: MedicalDialogContent;
}

// UI-friendly type for workbench
export interface MedicalDialogUIEntry {
  id: string;
  title: string;
  dialog_type: "conversation" | "article";
  participants: MedicalDialogParticipant[];
  exchanges: MedicalDialogExchange[];
  article_body?: string;
  vocabulary: MedicalDialogVocabulary[];
  medical_context?: string;
  publishing: PublishingData & { faq?: Array<{ question: string; answer: string }> };
  createdAt: string;
  updatedAt: string;
  author: string;
}

// ============================================
// MEDICAL_DIALOG CONVERTERS
// ============================================

export function medicalDialogItemToUI(item: MedicalDialogItem): MedicalDialogUIEntry {
  const content = item.content_json as MedicalDialogContent;
  return {
    id: item.id,
    title: content.title || "",
    dialog_type: content.dialog_type || "conversation",
    participants: content.participants || [],
    exchanges: content.exchanges || [],
    article_body: content.article_body || "",
    vocabulary: content.vocabulary || [],
    medical_context: content.medical_context || "",
    publishing: {
      slug: item.slug,
      status: item.status === "published" ? "published" : "draft",
      publishedAt: item.published_at,
      seo: {
        title: item.seo_json?.title || "",
        description: item.seo_json?.description || "",
      },
      geo: {
        snippet: item.geo_json?.snippet || "",
        keyPoints: item.geo_json?.keyPoints || [],
      },
      faq: item.geo_json?.faq || [],
    },
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    author: "Unknown",
  };
}

export function medicalDialogUIToContentItem(
  entry: MedicalDialogUIEntry
): Omit<MedicalDialogItem, "created_at" | "updated_at"> {
  const slug = entry.publishing.slug || generateSlug(entry.title, entry.id);
  return {
    id: entry.id,
    type: "medical_dialog",
    slug,
    locale: "zh-CN",
    status: entry.publishing.status === "published" ? "published" : "draft",
    published_at: entry.publishing.publishedAt || null,
    content_json: {
      title: entry.title,
      dialog_type: entry.dialog_type,
      participants: entry.participants,
      exchanges: entry.exchanges,
      article_body: entry.article_body,
      vocabulary: entry.vocabulary,
      medical_context: entry.medical_context,
    },
    seo_json: {
      title: entry.publishing.seo?.title || "",
      description: entry.publishing.seo?.description || "",
      canonical: null,
      ogImage: null,
    },
    geo_json: {
      snippet: entry.publishing.geo?.snippet || "",
      keyPoints: entry.publishing.geo?.keyPoints || [],
      faq: entry.publishing.faq || [],
      llmHint: null,
    },
  } as Omit<MedicalDialogItem, "created_at" | "updated_at">;
}

// ============================================
// MEDICAL_DIALOG CRUD functions
// ============================================

export async function fetchMedicalDialogs(): Promise<MedicalDialogItem[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("type", "medical_dialog")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Supabase] Error fetching medical_dialog:", error);
      throw error;
    }

    return (data || []) as MedicalDialogItem[];
  } catch (err) {
    console.error("[Supabase] Error fetching medical_dialog:", err);
    throw err;
  }
}

export async function upsertMedicalDialog(
  entry: MedicalDialogUIEntry
): Promise<MedicalDialogItem | null> {
  validateContentItemType("medical_dialog");

  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const itemData = medicalDialogUIToContentItem(entry);

  // Check if record with this ID exists
  const { data: existing } = await supabase
    .from("content_items")
    .select("id")
    .eq("id", entry.id)
    .single();

  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from("content_items")
      .update({
        ...itemData,
        updated_at: now,
      })
      .eq("id", entry.id)
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error updating medical_dialog:", error);
      return null;
    }

    return data as MedicalDialogItem;
  } else {
    // Insert new record
    const payload = {
      ...itemData,
      updated_at: now,
      created_at: entry.createdAt || now,
    };

    const { data, error } = await supabase
      .from("content_items")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error inserting medical_dialog:", error);
      return null;
    }

    return data as MedicalDialogItem;
  }
}

export async function deleteMedicalDialogById(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("content_items")
    .delete()
    .eq("id", id)
    .eq("type", "medical_dialog");

  if (error) {
    console.error("[Supabase] Error deleting medical_dialog:", error);
    return false;
  }

  return true;
}

// ============================================
// GENERIC CRUD for content_items
// ============================================

export async function fetchContentItemsByType(
  type: ContentItemType
): Promise<ContentItemBase[]> {
  validateContentItemType(type);

  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", type)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(`[Supabase] Error fetching content_items type=${type}:`, error);
    return [];
  }

  return (data || []) as ContentItemBase[];
}

export async function getContentItemById(id: string): Promise<ContentItemBase | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[Supabase] Error fetching content_item by id:", error);
    return null;
  }

  return data as ContentItemBase;
}

export async function updateContentItemStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (status === "published") {
    updatePayload.published_at = now;
  }

  const { error } = await supabase
    .from("content_items")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("[Supabase] Error updating content_item status:", error);
    return false;
  }

  return true;
}

// ============================================
// AUDIT LOG FUNCTIONS
// ============================================

export type AuditAction = 
  | "publish"
  | "unpublish"
  | "edit"
  | "create"
  | "delete"
  | "status_change"
  | "batch_publish"
  | "batch_archive";

export type AuditContentType = "lexicon" | "grammar" | "scenarios" | "content_item";

export interface AuditLogEntry {
  content_type: AuditContentType;
  content_id: string;
  action: AuditAction;
  actor: string;
  diff?: Record<string, unknown>;
  previous_status?: string;
  new_status?: string;
  note?: string;
}

/**
 * Log a single audit entry
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.log("[Audit] Mock mode - would log:", entry);
    return true;
  }
  
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("content_audit_log")
    .insert({
      content_type: entry.content_type,
      content_id: entry.content_id,
      action: entry.action,
      actor: entry.actor,
      diff: entry.diff || null,
      previous_status: entry.previous_status || null,
      new_status: entry.new_status || null,
      note: entry.note || null,
    });

  if (error) {
    console.error("[Supabase] Error inserting audit log:", error);
    return false;
  }

  return true;
}

/**
 * Log a batch action to the audit log
 * Records batch_publish or batch_archive with all affected content IDs
 */
export async function logBatchAction(
  action: "batch_publish" | "batch_archive",
  contentIds: string[],
  userId: string,
  contentType: AuditContentType = "content_item"
): Promise<void> {
  if (!isSupabaseConfigured) {
    console.log("[Audit] Mock mode - would log batch action:", { action, contentIds, userId });
    return;
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return;

  // Insert one audit log entry per content ID for better queryability
  const entries = contentIds.map((contentId) => ({
    content_type: contentType,
    content_id: contentId,
    action: action,
    actor: userId,
    previous_status: action === "batch_publish" ? "in_review" : "published",
    new_status: action === "batch_publish" ? "published" : "archived",
    note: `Part of batch operation affecting ${contentIds.length} items`,
    diff: { batch_ids: contentIds },
  }));

  const { error } = await supabase
    .from("content_audit_log")
    .insert(entries);

  if (error) {
    console.error("[Supabase] Error logging batch action:", error);
  }
}

/**
 * Fetch recent audit logs for a specific content item
 */
export async function fetchAuditLogsForContent(
  contentId: string,
  limit: number = 20
): Promise<Array<AuditLogEntry & { id: string; created_at: string }>> {
  if (!isSupabaseConfigured) return [];
  
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_audit_log")
    .select("*")
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Supabase] Error fetching audit logs:", error);
    return [];
  }

  return (data || []) as Array<AuditLogEntry & { id: string; created_at: string }>;
}

// ============================================
// VERSION HISTORY FUNCTIONS
// ============================================

export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  seo_json?: Record<string, unknown>;
  geo_json?: Record<string, unknown>;
  status: string;
  created_at: string;
  created_by?: string;
  change_summary?: string;
}

export interface VersionDiff {
  field: string;
  label: string;
  oldValue: unknown;
  newValue: unknown;
  hasChanges: boolean;
}

export interface VersionCompareResult {
  oldVersion: ContentVersion;
  newVersion: ContentVersion;
  diffs: VersionDiff[];
}

/**
 * Create a version snapshot of the current content state
 */
export async function createContentVersion(
  contentId: string,
  changeSummary?: string,
  createdBy?: string
): Promise<ContentVersion | null> {
  if (!isSupabaseConfigured) {
    console.log("[Version] Mock mode - would create version for:", contentId);
    return null;
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  try {
    // Get current content
    const { data: content, error: contentError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      console.error("[Version] Content not found:", contentId);
      return null;
    }

    // Get next version number
    const { data: maxVersion } = await supabase
      .from("content_versions")
      .select("version_number")
      .eq("content_id", contentId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (maxVersion?.version_number || 0) + 1;

    // Extract title from content_json
    const title = content.content_json?.title || 
                  content.content_json?.term || 
                  content.slug;

    // Insert version
    const { data: version, error: insertError } = await supabase
      .from("content_versions")
      .insert({
        content_id: contentId,
        version_number: nextVersion,
        title,
        slug: content.slug,
        content: content.content_json,
        seo_json: content.seo_json,
        geo_json: content.geo_json,
        status: content.status,
        created_by: createdBy || null,
        change_summary: changeSummary || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Version] Error creating version:", insertError);
      return null;
    }

    return version as ContentVersion;
  } catch (err) {
    console.error("[Version] Error creating version:", err);
    return null;
  }
}

/**
 * Fetch version history for a content item
 */
export async function fetchVersionHistory(
  contentId: string,
  limit: number = 50
): Promise<ContentVersion[]> {
  if (!isSupabaseConfigured) {
    console.log("[Version] Mock mode - would fetch history for:", contentId);
    return [];
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_versions")
    .select("*")
    .eq("content_id", contentId)
    .order("version_number", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Version] Error fetching history:", error);
    return [];
  }

  return (data || []) as ContentVersion[];
}

/**
 * Fetch a specific version by ID
 */
export async function fetchVersionById(
  versionId: string
): Promise<ContentVersion | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("content_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) {
    console.error("[Version] Error fetching version:", error);
    return null;
  }

  return data as ContentVersion;
}

/**
 * Rollback content to a specific version
 */
export async function rollbackToVersion(
  contentId: string,
  versionId: string,
  actorId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.log("[Version] Mock mode - would rollback:", { contentId, versionId });
    return false;
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  try {
    // Fetch the version to rollback to
    const { data: version, error: versionError } = await supabase
      .from("content_versions")
      .select("*")
      .eq("id", versionId)
      .eq("content_id", contentId)
      .single();

    if (versionError || !version) {
      console.error("[Version] Version not found:", versionId);
      return false;
    }

    // Create a snapshot of current state before rollback
    await createContentVersion(
      contentId,
      `Pre-rollback snapshot (before rollback to v${version.version_number})`,
      actorId
    );

    // Update content with version data
    const { error: updateError } = await supabase
      .from("content_items")
      .update({
        slug: version.slug,
        content_json: version.content,
        seo_json: version.seo_json,
        geo_json: version.geo_json,
        status: version.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId);

    if (updateError) {
      console.error("[Version] Error rolling back:", updateError);
      return false;
    }

    // Create a snapshot after rollback
    await createContentVersion(
      contentId,
      `Rolled back to version ${version.version_number}`,
      actorId
    );

    return true;
  } catch (err) {
    console.error("[Version] Error during rollback:", err);
    return false;
  }
}

/**
 * Compare two versions and return the differences
 */
export function compareVersions(
  oldVersion: ContentVersion,
  newVersion: ContentVersion
): VersionCompareResult {
  const diffs: VersionDiff[] = [];

  // Compare title
  diffs.push({
    field: "title",
    label: "标题 / Title",
    oldValue: oldVersion.title,
    newValue: newVersion.title,
    hasChanges: oldVersion.title !== newVersion.title,
  });

  // Compare slug
  diffs.push({
    field: "slug",
    label: "URL 别名 / Slug",
    oldValue: oldVersion.slug,
    newValue: newVersion.slug,
    hasChanges: oldVersion.slug !== newVersion.slug,
  });

  // Compare status
  diffs.push({
    field: "status",
    label: "状态 / Status",
    oldValue: oldVersion.status,
    newValue: newVersion.status,
    hasChanges: oldVersion.status !== newVersion.status,
  });

  // Compare content (deep comparison)
  const contentChanged = JSON.stringify(oldVersion.content) !== JSON.stringify(newVersion.content);
  diffs.push({
    field: "content",
    label: "内容 / Content",
    oldValue: oldVersion.content,
    newValue: newVersion.content,
    hasChanges: contentChanged,
  });

  // Compare SEO
  const seoChanged = JSON.stringify(oldVersion.seo_json) !== JSON.stringify(newVersion.seo_json);
  diffs.push({
    field: "seo_json",
    label: "SEO 元数据 / SEO Metadata",
    oldValue: oldVersion.seo_json,
    newValue: newVersion.seo_json,
    hasChanges: seoChanged,
  });

  // Compare GEO
  const geoChanged = JSON.stringify(oldVersion.geo_json) !== JSON.stringify(newVersion.geo_json);
  diffs.push({
    field: "geo_json",
    label: "GEO 数据 / GEO Data",
    oldValue: oldVersion.geo_json,
    newValue: newVersion.geo_json,
    hasChanges: geoChanged,
  });

  return {
    oldVersion,
    newVersion,
    diffs,
  };
}

/**
 * Get the current version number for a content item
 */
export async function getCurrentVersionNumber(contentId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const supabase = getSupabaseBrowser();
  if (!supabase) return 0;

  const { data } = await supabase
    .from("content_versions")
    .select("version_number")
    .eq("content_id", contentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  return data?.version_number || 0;
}
