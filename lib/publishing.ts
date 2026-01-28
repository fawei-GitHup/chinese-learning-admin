"use client";

// Publishing validation - single source of truth for SEO/GEO readiness

export interface PublishingConfig {
  status: "draft" | "in_review" | "published" | "archived";
  seo: {
    title?: string;
    description?: string;
    canonical_url?: string;
  };
  geo: {
    snippet?: string;
    key_points?: string[];
    intro?: string;
    key_takeaways?: string[];
  };
  faq_json?: Array<{ question: string; answer: string }>;
  jsonld?: Record<string, unknown>;
  published_at?: string;
}

export interface ValidationResult {
  isPublishable: boolean;
  errors: string[];
  warnings: string[];
  seoComplete: boolean;
  geoComplete: boolean;
  faqComplete: boolean;
}

export interface ContentRow {
  id: string;
  slug: string;
  title?: string;
  term?: string; // for lexicon
  publishing: PublishingConfig;
  created_at: string;
  updated_at: string;
}

/**
 * validatePublishing - Single source of truth for publishing readiness
 * 
 * Required for publish:
 * - SEO: title (min 10 chars), description (min 50 chars)
 * - GEO: snippet (min 50 chars), key_points (min 3 items)
 * 
 * Warnings (not blocking):
 * - SEO description > 160 chars
 * - GEO key_points > 5 items
 * - No FAQ defined
 */
export function validatePublishing(publishing: PublishingConfig | null | undefined): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!publishing) {
    return {
      isPublishable: false,
      errors: ["Publishing config missing"],
      warnings: [],
      seoComplete: false,
      geoComplete: false,
      faqComplete: false,
    };
  }

  // SEO validation
  const seoTitle = publishing.seo?.title?.trim() || "";
  const seoDesc = publishing.seo?.description?.trim() || "";

  if (!seoTitle || seoTitle.length < 10) {
    errors.push("SEO title required (min 10 chars)");
  }
  if (!seoDesc || seoDesc.length < 50) {
    errors.push("SEO description required (min 50 chars)");
  }
  if (seoDesc.length > 160) {
    warnings.push("SEO description exceeds 160 chars");
  }

  const seoComplete = seoTitle.length >= 10 && seoDesc.length >= 50;

  // GEO validation
  const geoSnippet = publishing.geo?.snippet?.trim() || "";
  const geoKeyPoints = publishing.geo?.key_points || [];

  if (!geoSnippet || geoSnippet.length < 50) {
    errors.push("GEO snippet required (min 50 chars)");
  }
  if (geoKeyPoints.length < 3) {
    errors.push("GEO key_points required (min 3 items)");
  }
  if (geoKeyPoints.length > 5) {
    warnings.push("GEO key_points exceeds 5 items");
  }

  const geoComplete = geoSnippet.length >= 50 && geoKeyPoints.length >= 3;

  // FAQ validation (warning only)
  const faqComplete = Array.isArray(publishing.faq_json) && publishing.faq_json.length > 0;
  if (!faqComplete) {
    warnings.push("No FAQ defined (recommended for SEO)");
  }

  return {
    isPublishable: errors.length === 0,
    errors,
    warnings,
    seoComplete,
    geoComplete,
    faqComplete,
  };
}

/**
 * Get severity level for display
 */
export function getSeverity(result: ValidationResult): "success" | "warning" | "error" {
  if (result.isPublishable && result.warnings.length === 0) return "success";
  if (result.isPublishable) return "warning";
  return "error";
}

/**
 * Calculate aggregate stats for a collection
 */
export function calculatePublishingStats(items: ContentRow[]) {
  let total = 0;
  let publishable = 0;
  let missingSEO = 0;
  let missingGEO = 0;
  let missingFAQ = 0;

  for (const item of items) {
    total++;
    const result = validatePublishing(item.publishing);
    if (result.isPublishable) publishable++;
    if (!result.seoComplete) missingSEO++;
    if (!result.geoComplete) missingGEO++;
    if (!result.faqComplete) missingFAQ++;
  }

  return {
    total,
    publishable,
    publishablePercent: total > 0 ? Math.round((publishable / total) * 100) : 0,
    missingSEO,
    missingGEO,
    missingFAQ,
  };
}
