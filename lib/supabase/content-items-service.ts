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
// CONVERTERS
// ============================================

export function contentItemToUI(item: MedicalLexiconItem): MedicalLexiconUIEntry {
  const content = item.content_json;
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
}

export function uiToContentItem(
  entry: MedicalLexiconUIEntry
): Omit<MedicalLexiconItem, "created_at" | "updated_at"> {
  return {
    id: entry.id,
    type: "medical_lexicon",
    slug: entry.publishing.slug || "",
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
  };
}

// ============================================
// CRUD FUNCTIONS for medical_lexicon
// ============================================

export async function fetchMedicalLexicon(): Promise<MedicalLexiconItem[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("type", "medical_lexicon")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Supabase] Error fetching medical_lexicon:", error);
    return [];
  }

  return (data || []) as MedicalLexiconItem[];
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

  const payload = {
    ...itemData,
    updated_at: now,
    created_at: entry.createdAt || now,
  };

  const { data, error } = await supabase
    .from("content_items")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Error upserting medical_lexicon:", error);
    return null;
  }

  return data as MedicalLexiconItem;
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
