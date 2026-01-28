// Unified publishing validation for all content types
// Ensures SEO, GEO, and slug requirements are met before publishing

export interface SEOFields {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface GEOFields {
  snippet?: string;
  keyPoints?: string[];
}

export interface JSONLDFields {
  type?: string;
  data?: Record<string, unknown>;
}

export interface PublishingData {
  slug?: string;
  status?: "draft" | "published";
  publishedAt?: string | null;
  seo?: SEOFields;
  geo?: GEOFields;
  jsonld?: JSONLDFields;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate slug is URL-safe
function isValidSlug(slug: string): boolean {
  if (!slug) return false;
  // Allow lowercase letters, numbers, hyphens, and Chinese characters
  const slugRegex = /^[a-z0-9\u4e00-\u9fa5]+(?:-[a-z0-9\u4e00-\u9fa5]+)*$/;
  return slugRegex.test(slug);
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Main validation function
export function validatePublishing(publishing: PublishingData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Slug validation (required, URL-safe)
  if (!publishing.slug) {
    errors.push("Slug is required (Slug 必填)");
  } else if (!isValidSlug(publishing.slug)) {
    errors.push("Slug must be URL-safe (Slug 必须是有效的 URL)");
  }

  // 2. SEO validation
  if (!publishing.seo?.title) {
    errors.push("SEO title is required (SEO 标题必填)");
  } else if (publishing.seo.title.length > 60) {
    warnings.push("SEO title should be under 60 characters");
  }

  if (!publishing.seo?.description) {
    errors.push("SEO description is required (SEO 描述必填)");
  } else if (publishing.seo.description.length > 160) {
    warnings.push("SEO description should be under 160 characters");
  }

  // 3. GEO validation
  if (!publishing.geo?.snippet) {
    errors.push("GEO snippet is required (GEO 片段必填)");
  }

  const keyPoints = publishing.geo?.keyPoints || [];
  if (keyPoints.length < 3) {
    errors.push(`At least 3 key points required (至少需要3个关键要点), currently ${keyPoints.length}`);
  } else if (keyPoints.length > 5) {
    warnings.push("Recommend keeping key points to 5 or fewer");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Convert legacy GEO fields to unified publishing format
export function convertToPublishing(item: {
  slug?: string;
  status?: string;
  geo_snippet?: string;
  geo_intro?: string;
  key_points?: string[];
  key_takeaways?: string[];
  seo_title?: string;
  seo_description?: string;
  title?: string;
  term?: string;
}): PublishingData {
  return {
    slug: item.slug || "",
    status: item.status === "published" ? "published" : "draft",
    seo: {
      title: item.seo_title || item.title || item.term || "",
      description: item.seo_description || item.geo_snippet || item.geo_intro || "",
    },
    geo: {
      snippet: item.geo_snippet || item.geo_intro || "",
      keyPoints: item.key_points || item.key_takeaways || [],
    },
  };
}

// Generate JSON-LD for content
export function generateJSONLD(
  type: "Article" | "FAQPage" | "HowTo",
  data: {
    title: string;
    description: string;
    url?: string;
    datePublished?: string;
    dateModified?: string;
    author?: string;
    faq?: Array<{ question: string; answer: string }>;
  }
): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    "@type": type,
  };

  if (type === "Article") {
    return {
      ...base,
      headline: data.title,
      description: data.description,
      datePublished: data.datePublished,
      dateModified: data.dateModified,
      author: data.author ? { "@type": "Person", name: data.author } : undefined,
    };
  }

  if (type === "FAQPage" && data.faq && data.faq.length > 0) {
    return {
      ...base,
      mainEntity: data.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
  }

  return base;
}
