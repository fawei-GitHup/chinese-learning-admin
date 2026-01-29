"use client";

import { getSupabaseBrowser, isSupabaseConfigured } from "./client";
import type { PublishingData } from "@/lib/validatePublishing";
import { VALID_CONTENT_TYPES } from "@/lib/content-types";

// ============================================
// VALIDATION HELPERS
// ============================================

function validateContentType(type: string): void {
  if (!VALID_CONTENT_TYPES.includes(type as any)) {
    throw new Error(`Invalid content type: ${type}`);
  }
}

// ============================================
// AUDIT LOG HELPERS
// ============================================

async function logAudit(
  contentType: 'lexicon' | 'grammar' | 'scenarios',
  contentId: string,
  action: 'publish' | 'unpublish' | 'edit' | 'create' | 'delete' | 'status_change',
  diff?: any,
  previousStatus?: string,
  newStatus?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const supabase = getSupabaseBrowser();
  if (!supabase) return;

  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[Audit] No authenticated user, skipping audit log');
    return;
  }

  const payload = {
    content_type: contentType,
    content_id: contentId,
    action,
    actor: user.id,
    diff: diff ? JSON.stringify(diff) : null,
    previous_status: previousStatus,
    new_status: newStatus,
  };

  // Use the PostgreSQL function log_content_audit if available, otherwise insert directly
  const { error } = await supabase.rpc('log_content_audit', {
    p_content_type: contentType,
    p_content_id: contentId,
    p_action: action,
    p_actor: user.id,
    p_diff: diff ? JSON.stringify(diff) : null,
    p_previous_status: previousStatus,
    p_new_status: newStatus,
  });

  if (error) {
    console.error('[Audit] Failed to log audit entry:', error);
    // Fallback: insert directly (optional)
    // await supabase.from('content_audit_log').insert(payload);
  }
}

// ============================================
// TYPES matching Supabase schema
// ============================================

export interface SupabaseLexicon {
  id: string;
  term: string;
  pinyin: string;
  english: string;  // Required by database schema
  category: string; // Required by database schema
  difficulty: string; // Required by database schema
  definition?: string;
  example_sentence?: string;
  example_pinyin?: string;
  example_translation?: string;
  audio_url?: string;
  related_terms?: string[];
  notes?: string;
  usage?: {
    say_it_like: string[];
    dont_say: string[];
    collocations: string[];
  };
  publishing: PublishingData & {
    faq?: Array<{ question: string; answer: string }>;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SupabaseGrammar {
  id: string;
  title: string;
  pattern: string;
  explanation: string;
  examples: Array<{ cn: string; pinyin: string; en: string }>;
  clinic_templates: Array<{ scenario: string; template: string; variables: string }>;
  common_mistakes: string[];
  publishing: PublishingData & {
    faq?: Array<{ question: string; answer: string }>;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SupabaseScenario {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  conversation: Array<{ speaker: string; line: string; note?: string }>;
  key_phrases: string[];
  checklist: string[];
  warnings: Array<{ type: string; message: string }>;
  publishing: PublishingData & {
    faq?: Array<{ question: string; answer: string }>;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ============================================
// LEXICON CRUD
// ============================================

export async function fetchLexicon(): Promise<SupabaseLexicon[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("medical_lexicon")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Supabase] Error fetching lexicon:", error);
    return [];
  }

  return data || [];
}

export async function upsertLexicon(entry: Partial<SupabaseLexicon>): Promise<SupabaseLexicon | null> {
  validateContentType('lexicon');

  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const payload = {
    ...entry,
    updated_at: now,
    created_at: entry.created_at || now,
  };

  const { data, error } = await supabase
    .from("medical_lexicon")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Error upserting lexicon:", error);
    return null;
  }

  // Determine if this was a create or edit based on whether entry.id existed before
  const action = entry.id ? 'edit' : 'create';
  await logAudit('lexicon', data.id, action, { changes: payload });

  return data;
}

export async function deleteLexiconById(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("medical_lexicon")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Supabase] Error deleting lexicon:", error);
    return false;
  }

  return true;
}

// ============================================
// GRAMMAR CRUD
// ============================================

export async function fetchGrammar(): Promise<SupabaseGrammar[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("medical_grammar")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Supabase] Error fetching grammar:", error);
    return [];
  }

  return data || [];
}

export async function upsertGrammar(entry: Partial<SupabaseGrammar>): Promise<SupabaseGrammar | null> {
  validateContentType('grammar');

  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const payload = {
    ...entry,
    updated_at: now,
    created_at: entry.created_at || now,
  };

  const { data, error } = await supabase
    .from("medical_grammar")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Error upserting grammar:", error);
    return null;
  }

  // Determine if this was a create or edit based on whether entry.id existed before
  const action = entry.id ? 'edit' : 'create';
  await logAudit('grammar', data.id, action, { changes: payload });

  return data;
}

export async function deleteGrammarById(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("medical_grammar")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Supabase] Error deleting grammar:", error);
    return false;
  }

  return true;
}

// ============================================
// SCENARIOS CRUD
// ============================================

export async function fetchScenarios(): Promise<SupabaseScenario[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("medical_scenarios")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Supabase] Error fetching scenarios:", error);
    return [];
  }

  return data || [];
}

export async function upsertScenario(entry: Partial<SupabaseScenario>): Promise<SupabaseScenario | null> {
  validateContentType('scenarios');

  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const payload = {
    ...entry,
    updated_at: now,
    created_at: entry.created_at || now,
  };

  const { data, error } = await supabase
    .from("medical_scenarios")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Error upserting scenario:", error);
    return null;
  }

  // Determine if this was a create or edit based on whether entry.id existed before
  const action = entry.id ? 'edit' : 'create';
  await logAudit('scenarios', data.id, action, { changes: payload });

  return data;
}

export async function deleteScenarioById(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("medical_scenarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[Supabase] Error deleting scenario:", error);
    return false;
  }

  return true;
}

// ============================================
// PUBLISH HELPERS
// ============================================

export async function publishLexicon(id: string): Promise<boolean> {
  validateContentType('lexicon');

  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("medical_lexicon")
    .update({
      publishing: {
        status: "published",
        publishedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) {
    // Log audit entry
    await logAudit('lexicon', id, 'publish', undefined, 'draft', 'published');
  }

  return !error;
}

export async function unpublishLexicon(id: string): Promise<boolean> {
  validateContentType('lexicon');

  if (!isSupabaseConfigured) return false;
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;

  const { error } = await supabase
    .from("medical_lexicon")
    .update({
      publishing: {
        status: "draft",
        publishedAt: null,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) {
    // Log audit entry
    await logAudit('lexicon', id, 'unpublish', undefined, 'published', 'draft');
  }

  return !error;
}

// ============================================
// PROFILES / USER MANAGEMENT
// ============================================

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_users: number;
  admin_count: number;
  editor_count: number;
  viewer_count: number;
  active_count: number;
  inactive_count: number;
}

/**
 * 获取所有用户（需要 admin 权限）
 */
export async function fetchAllProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc('get_all_profiles_with_email');

    if (error) {
      console.error("[Supabase] Error fetching profiles:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      avatar_url: item.avatar_url,
      role: item.role as 'admin' | 'editor' | 'viewer',
      is_active: item.is_active ?? true,
      last_login_at: item.last_login_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    console.error("[Supabase] Exception fetching profiles:", error);
    return [];
  }
}

/**
 * 获取用户详情
 */
export async function fetchProfileById(id: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  try {
    // 获取所有用户然后过滤（因为 RPC 函数不支持单个用户查询）
    const profiles = await fetchAllProfiles();
    return profiles.find(p => p.id === id) || null;
  } catch (error) {
    console.error("[Supabase] Exception fetching profile by id:", error);
    return null;
  }
}

/**
 * 更新用户角色
 */
export async function updateProfileRole(
  id: string, 
  role: 'admin' | 'editor' | 'viewer'
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  const supabase = getSupabaseBrowser();
  if (!supabase) return { success: false, error: 'Supabase client not available' };

  try {
    const { data, error } = await supabase.rpc('admin_update_user_role', {
      target_user_id: id,
      new_role: role,
    });

    if (error) {
      console.error("[Supabase] Error updating user role:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Supabase] Exception updating user role:", error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * 更新用户状态
 */
export async function updateProfileStatus(
  id: string, 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  const supabase = getSupabaseBrowser();
  if (!supabase) return { success: false, error: 'Supabase client not available' };

  try {
    const { data, error } = await supabase.rpc('admin_update_user_status', {
      target_user_id: id,
      new_status: isActive,
    });

    if (error) {
      console.error("[Supabase] Error updating user status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Supabase] Exception updating user status:", error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * 搜索用户
 */
export async function searchProfiles(query: string): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc('search_profiles', {
      search_query: query,
    });

    if (error) {
      console.error("[Supabase] Error searching profiles:", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      avatar_url: item.avatar_url,
      role: item.role as 'admin' | 'editor' | 'viewer',
      is_active: item.is_active ?? true,
      last_login_at: item.last_login_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    console.error("[Supabase] Exception searching profiles:", error);
    return [];
  }
}

/**
 * 获取用户统计
 */
export async function fetchUserStats(): Promise<UserStats | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('get_user_stats');

    if (error) {
      console.error("[Supabase] Error fetching user stats:", error);
      return null;
    }

    if (data && data.length > 0) {
      const stats = data[0];
      return {
        total_users: Number(stats.total_users) || 0,
        admin_count: Number(stats.admin_count) || 0,
        editor_count: Number(stats.editor_count) || 0,
        viewer_count: Number(stats.viewer_count) || 0,
        active_count: Number(stats.active_count) || 0,
        inactive_count: Number(stats.inactive_count) || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("[Supabase] Exception fetching user stats:", error);
    return null;
  }
}
