"use server";

import { getSupabaseServer, isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { ContentRow, PublishingConfig } from "@/lib/publishing";

export interface FetchResult {
  lexicon: ContentRow[];
  grammar: ContentRow[];
  scenarios: ContentRow[];
  medicalLexicon: ContentRow[];
  error: string | null;
  isUsingMock: boolean;
}

// content_items table structure for medical_lexicon
interface ContentItemGEO {
  snippet?: string;
  keyPoints?: string[];
  faq?: Array<{ question: string; answer: string }>;
}

interface ContentItemSEO {
  title?: string;
  description?: string;
}

interface ContentItemRow {
  id: string;
  slug: string;
  type: string;
  status: "draft" | "published" | "archived";
  content_json: { term?: string; [key: string]: unknown };
  seo_json: ContentItemSEO;
  geo_json: ContentItemGEO;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert content_items row to ContentRow format for publishing center
 * Maps geo_json.keyPoints -> publishing.geo.key_points
 */
function contentItemToContentRow(item: ContentItemRow): ContentRow {
  return {
    id: item.id,
    slug: item.slug,
    term: item.content_json?.term,
    publishing: {
      status: item.status === "published" ? "published" : "draft",
      seo: {
        title: item.seo_json?.title,
        description: item.seo_json?.description,
      },
      geo: {
        snippet: item.geo_json?.snippet,
        key_points: item.geo_json?.keyPoints || [], // Map keyPoints -> key_points
      },
      faq_json: item.geo_json?.faq || [],
      published_at: item.published_at || undefined,
    },
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

// Mock data for when Supabase is not configured
function getMockData(): Omit<FetchResult, "error" | "isUsingMock"> {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const lastWeek = new Date(Date.now() - 604800000).toISOString();

  const createPublishing = (
    status: "draft" | "published",
    hasSeo: boolean,
    hasGeo: boolean
  ): PublishingConfig => ({
    status,
    seo: hasSeo
      ? {
          title: "Sample SEO Title for Content",
          description:
            "This is a sample SEO description that is long enough to meet the minimum requirements for publishing content.",
        }
      : {},
    geo: hasGeo
      ? {
          snippet:
            "This is a sample GEO snippet that provides a brief overview of the content for AI consumption.",
          key_points: ["Key point 1", "Key point 2", "Key point 3"],
        }
      : {},
    faq_json: hasSeo && hasGeo ? [{ question: "Sample Q?", answer: "Sample A." }] : [],
    published_at: status === "published" ? yesterday : undefined,
  });

  return {
    lexicon: [
      {
        id: "lex-1",
        slug: "tou-tong",
        term: "头痛",
        publishing: createPublishing("published", true, true),
        created_at: lastWeek,
        updated_at: yesterday,
      },
      {
        id: "lex-2",
        slug: "fa-shao",
        term: "发烧",
        publishing: createPublishing("published", true, true),
        created_at: lastWeek,
        updated_at: yesterday,
      },
      {
        id: "lex-3",
        slug: "ke-sou",
        term: "咳嗽",
        publishing: createPublishing("draft", true, false),
        created_at: now,
        updated_at: now,
      },
      {
        id: "lex-4",
        slug: "wei-tong",
        term: "胃痛",
        publishing: createPublishing("draft", false, false),
        created_at: now,
        updated_at: now,
      },
    ],
    grammar: [
      {
        id: "gram-1",
        slug: "ba-structure",
        title: "把字句",
        publishing: createPublishing("published", true, true),
        created_at: lastWeek,
        updated_at: yesterday,
      },
      {
        id: "gram-2",
        slug: "bei-passive",
        title: "被动句",
        publishing: createPublishing("draft", true, false),
        created_at: now,
        updated_at: now,
      },
    ],
    scenarios: [
      {
        id: "scen-1",
        slug: "pharmacy-visit",
        title: "药店买药",
        publishing: createPublishing("published", true, true),
        created_at: lastWeek,
        updated_at: yesterday,
      },
      {
        id: "scen-2",
        slug: "hospital-registration",
        title: "医院挂号",
        publishing: createPublishing("draft", false, true),
        created_at: now,
        updated_at: now,
      },
      {
        id: "scen-3",
        slug: "describe-symptoms",
        title: "描述症状",
        publishing: createPublishing("draft", false, false),
        created_at: now,
        updated_at: now,
      },
    ],
    medicalLexicon: [
      {
        id: "medlex-1",
        slug: "xue-ya",
        term: "血压",
        publishing: createPublishing("published", true, true),
        created_at: lastWeek,
        updated_at: yesterday,
      },
      {
        id: "medlex-2",
        slug: "xin-lv",
        term: "心率",
        publishing: createPublishing("draft", true, false),
        created_at: now,
        updated_at: now,
      },
      {
        id: "medlex-3",
        slug: "ti-wen",
        term: "体温",
        publishing: createPublishing("draft", false, false),
        created_at: now,
        updated_at: now,
      },
    ],
  };
}

export async function fetchAllContent(): Promise<FetchResult> {
  if (!isSupabaseServerConfigured) {
    const mockData = getMockData();
    return {
      ...mockData,
      error: null,
      isUsingMock: true,
    };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    const mockData = getMockData();
    return {
      ...mockData,
      error: "Supabase client not available",
      isUsingMock: true,
    };
  }

  try {
    const [lexiconRes, grammarRes, scenariosRes, medicalLexiconRes] = await Promise.all([
      supabase.from("medical_lexicon").select("id, slug, term, publishing, created_at, updated_at"),
      supabase.from("medical_grammar").select("id, slug, title, publishing, created_at, updated_at"),
      supabase.from("medical_scenarios").select("id, slug, title, publishing, created_at, updated_at"),
      supabase.from("content_items").select("id, slug, type, status, content_json, seo_json, geo_json, published_at, created_at, updated_at").eq("type", "medical_lexicon"),
    ]);

    if (lexiconRes.error) throw new Error(`Lexicon: ${lexiconRes.error.message}`);
    if (grammarRes.error) throw new Error(`Grammar: ${grammarRes.error.message}`);
    if (scenariosRes.error) throw new Error(`Scenarios: ${scenariosRes.error.message}`);
    if (medicalLexiconRes.error) throw new Error(`Medical Lexicon: ${medicalLexiconRes.error.message}`);

    // Convert content_items medical_lexicon rows to ContentRow format
    const medicalLexiconData = (medicalLexiconRes.data || []).map((item) =>
      contentItemToContentRow(item as ContentItemRow)
    );

    return {
      lexicon: (lexiconRes.data || []) as ContentRow[],
      grammar: (grammarRes.data || []) as ContentRow[],
      scenarios: (scenariosRes.data || []) as ContentRow[],
      medicalLexicon: medicalLexiconData,
      error: null,
      isUsingMock: false,
    };
  } catch (err) {
    console.error("[Publish Center] Error fetching from Supabase:", err);
    const mockData = getMockData();
    return {
      ...mockData,
      error: err instanceof Error ? err.message : "Unknown error",
      isUsingMock: true,
    };
  }
}

export async function fetchRecentlyPublished(): Promise<{
  items: Array<ContentRow & { type: string }>;
  error: string | null;
}> {
  if (!isSupabaseServerConfigured) {
    // Return mock recently published
    const mockData = getMockData();
    const published: Array<ContentRow & { type: string }> = [];

    for (const item of mockData.lexicon) {
      if (item.publishing.status === "published") {
        published.push({ ...item, type: "lexicon" });
      }
    }
    for (const item of mockData.grammar) {
      if (item.publishing.status === "published") {
        published.push({ ...item, type: "grammar" });
      }
    }
    for (const item of mockData.scenarios) {
      if (item.publishing.status === "published") {
        published.push({ ...item, type: "scenario" });
      }
    }
    for (const item of mockData.medicalLexicon) {
      if (item.publishing.status === "published") {
        published.push({ ...item, type: "medical_lexicon" });
      }
    }

    // Sort by published_at desc
    published.sort((a, b) => {
      const aDate = a.publishing.published_at || a.updated_at;
      const bDate = b.publishing.published_at || b.updated_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return { items: published.slice(0, 10), error: null };
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return { items: [], error: "Supabase client not available" };
  }

  try {
    const [lexiconRes, grammarRes, scenariosRes, medicalLexiconRes] = await Promise.all([
      supabase
        .from("medical_lexicon")
        .select("id, slug, term, publishing, created_at, updated_at")
        .eq("publishing->>status", "published")
        .order("publishing->>published_at", { ascending: false })
        .limit(10),
      supabase
        .from("medical_grammar")
        .select("id, slug, title, publishing, created_at, updated_at")
        .eq("publishing->>status", "published")
        .order("publishing->>published_at", { ascending: false })
        .limit(10),
      supabase
        .from("medical_scenarios")
        .select("id, slug, title, publishing, created_at, updated_at")
        .eq("publishing->>status", "published")
        .order("publishing->>published_at", { ascending: false })
        .limit(10),
      supabase
        .from("content_items")
        .select("id, slug, type, status, content_json, seo_json, geo_json, published_at, created_at, updated_at")
        .eq("type", "medical_lexicon")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10),
    ]);

    const items: Array<ContentRow & { type: string }> = [];

    for (const item of lexiconRes.data || []) {
      items.push({ ...(item as ContentRow), type: "lexicon" });
    }
    for (const item of grammarRes.data || []) {
      items.push({ ...(item as ContentRow), type: "grammar" });
    }
    for (const item of scenariosRes.data || []) {
      items.push({ ...(item as ContentRow), type: "scenario" });
    }
    // Add medical_lexicon from content_items table
    for (const item of medicalLexiconRes.data || []) {
      const converted = contentItemToContentRow(item as ContentItemRow);
      items.push({ ...converted, type: "medical_lexicon" });
    }

    // Sort by published_at desc
    items.sort((a, b) => {
      const aDate = a.publishing.published_at || a.updated_at;
      const bDate = b.publishing.published_at || b.updated_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return { items: items.slice(0, 10), error: null };
  } catch (err) {
    return {
      items: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
