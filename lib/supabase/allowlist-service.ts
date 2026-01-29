"use client";

import { getSupabaseBrowser, isSupabaseConfigured } from "./client";

// ============================================
// TYPES
// ============================================

export interface AllowedEmail {
  id: string;
  email: string;
  is_domain_pattern: boolean;
  default_role: 'admin' | 'editor' | 'viewer';
  notes: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AllowedEmailInput {
  email: string;
  default_role?: 'admin' | 'editor' | 'viewer';
  notes?: string;
}

export interface EmailCheckResult {
  allowed: boolean;
  defaultRole: 'admin' | 'editor' | 'viewer';
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detect if email is a domain pattern (e.g., *@company.com)
 */
function isDomainPattern(email: string): boolean {
  return email.startsWith('*@');
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  // Allow domain patterns like *@company.com
  if (isDomainPattern(email)) {
    const domain = email.substring(2); // Remove *@
    return domain.includes('.') && domain.length > 3;
  }
  // Standard email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize email (lowercase)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ============================================
// SUPABASE SERVICE FUNCTIONS
// ============================================

/**
 * Fetch all allowed email entries
 */
export async function fetchAllowedEmails(): Promise<AllowedEmail[]> {
  if (!isSupabaseConfigured) {
    console.warn('[Allowlist] Supabase not configured');
    return [];
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Allowlist] Error fetching allowed emails:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      email: item.email,
      is_domain_pattern: item.is_domain_pattern || false,
      default_role: item.default_role as 'admin' | 'editor' | 'viewer',
      notes: item.notes,
      added_by: item.added_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    console.error('[Allowlist] Exception fetching allowed emails:', error);
    return [];
  }
}

/**
 * Add email to allowlist
 */
export async function addAllowedEmail(
  email: string,
  defaultRole: 'admin' | 'editor' | 'viewer' = 'viewer',
  notes?: string
): Promise<{ success: boolean; data?: AllowedEmail; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  const normalizedEmail = normalizeEmail(email);
  
  if (!isValidEmail(normalizedEmail)) {
    return { success: false, error: 'Invalid email format' };
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return { success: false, error: 'Supabase client not available' };

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('allowed_emails')
      .insert({
        email: normalizedEmail,
        is_domain_pattern: isDomainPattern(normalizedEmail),
        default_role: defaultRole,
        notes: notes || null,
        added_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'Email already exists in allowlist' };
      }
      console.error('[Allowlist] Error adding email:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: {
        id: data.id,
        email: data.email,
        is_domain_pattern: data.is_domain_pattern || false,
        default_role: data.default_role as 'admin' | 'editor' | 'viewer',
        notes: data.notes,
        added_by: data.added_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    };
  } catch (error: any) {
    console.error('[Allowlist] Exception adding email:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Remove email from allowlist
 */
export async function removeAllowedEmail(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return { success: false, error: 'Supabase client not available' };

  try {
    const { error } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Allowlist] Error removing email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Allowlist] Exception removing email:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Update allowlist entry
 */
export async function updateAllowedEmail(
  id: string,
  updates: Partial<Pick<AllowedEmail, 'default_role' | 'notes'>>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) return { success: false, error: 'Supabase client not available' };

  try {
    const { error } = await supabase
      .from('allowed_emails')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[Allowlist] Error updating email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Allowlist] Exception updating email:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Check if email is allowed (uses database function)
 */
export async function checkEmailAllowed(email: string): Promise<EmailCheckResult> {
  if (!isSupabaseConfigured) {
    console.warn('[Allowlist] Supabase not configured, defaulting to allowed');
    return { allowed: true, defaultRole: 'viewer' };
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    console.warn('[Allowlist] Supabase client not available, defaulting to allowed');
    return { allowed: true, defaultRole: 'viewer' };
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const { data, error } = await supabase.rpc('check_email_allowed', {
      check_email: normalizedEmail,
    });

    if (error) {
      console.error('[Allowlist] Error checking email:', error);
      // Fall back to manual check
      return await checkEmailAllowedManual(normalizedEmail);
    }

    if (data && data.length > 0) {
      return {
        allowed: data[0].allowed,
        defaultRole: data[0].default_role as 'admin' | 'editor' | 'viewer',
      };
    }

    return { allowed: false, defaultRole: 'viewer' };
  } catch (error) {
    console.error('[Allowlist] Exception checking email:', error);
    return await checkEmailAllowedManual(normalizedEmail);
  }
}

/**
 * Manual email check (fallback when RPC is not available)
 */
async function checkEmailAllowedManual(email: string): Promise<EmailCheckResult> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { allowed: true, defaultRole: 'viewer' };
  }

  try {
    const { data: entries, error } = await supabase
      .from('allowed_emails')
      .select('email, is_domain_pattern, default_role');

    if (error || !entries) {
      console.warn('[Allowlist] Could not fetch entries for manual check');
      return { allowed: true, defaultRole: 'viewer' };
    }

    // Check exact match first
    const exactMatch = entries.find(e => e.email === email && !e.is_domain_pattern);
    if (exactMatch) {
      return { 
        allowed: true, 
        defaultRole: exactMatch.default_role as 'admin' | 'editor' | 'viewer' 
      };
    }

    // Check domain patterns
    const domainPatterns = entries
      .filter(e => e.is_domain_pattern)
      .sort((a, b) => b.email.length - a.email.length); // Longer patterns first

    for (const pattern of domainPatterns) {
      const regex = new RegExp('^' + pattern.email.replace('*', '.*') + '$', 'i');
      if (regex.test(email)) {
        return { 
          allowed: true, 
          defaultRole: pattern.default_role as 'admin' | 'editor' | 'viewer' 
        };
      }
    }

    // If no entries exist in the table, allow by default (backward compatibility)
    if (entries.length === 0) {
      console.warn('[Allowlist] No entries in allowlist, allowing by default');
      return { allowed: true, defaultRole: 'viewer' };
    }

    return { allowed: false, defaultRole: 'viewer' };
  } catch (error) {
    console.error('[Allowlist] Error in manual check:', error);
    return { allowed: true, defaultRole: 'viewer' };
  }
}

/**
 * Bulk import emails
 */
export async function bulkImportEmails(
  emails: Array<AllowedEmailInput>
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const item of emails) {
    const { success, error } = await addAllowedEmail(
      item.email,
      item.default_role || 'viewer',
      item.notes
    );

    if (success) {
      result.success++;
    } else {
      result.failed++;
      result.errors.push({
        email: item.email,
        error: error || 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Parse emails from text (one per line)
 */
export function parseEmailsFromText(text: string): AllowedEmailInput[] {
  const lines = text.split('\n');
  const emails: AllowedEmailInput[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Support format: email@example.com or email@example.com, role, notes
    const parts = trimmed.split(',').map(p => p.trim());
    const email = parts[0];
    
    if (!email || !isValidEmail(email)) continue;

    const entry: AllowedEmailInput = { email };

    if (parts[1]) {
      const role = parts[1].toLowerCase();
      if (['admin', 'editor', 'viewer'].includes(role)) {
        entry.default_role = role as 'admin' | 'editor' | 'viewer';
      }
    }

    if (parts[2]) {
      entry.notes = parts[2];
    }

    emails.push(entry);
  }

  return emails;
}

/**
 * Search allowed emails
 */
export async function searchAllowedEmails(query: string): Promise<AllowedEmail[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .ilike('email', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Allowlist] Error searching emails:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      email: item.email,
      is_domain_pattern: item.is_domain_pattern || false,
      default_role: item.default_role as 'admin' | 'editor' | 'viewer',
      notes: item.notes,
      added_by: item.added_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    console.error('[Allowlist] Exception searching emails:', error);
    return [];
  }
}

/**
 * Get allowlist statistics
 */
export async function getAllowlistStats(): Promise<{
  total: number;
  domainPatterns: number;
  adminDefaults: number;
  editorDefaults: number;
  viewerDefaults: number;
} | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = getSupabaseBrowser();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('is_domain_pattern, default_role');

    if (error) {
      console.error('[Allowlist] Error getting stats:', error);
      return null;
    }

    const entries = data || [];
    
    return {
      total: entries.length,
      domainPatterns: entries.filter(e => e.is_domain_pattern).length,
      adminDefaults: entries.filter(e => e.default_role === 'admin').length,
      editorDefaults: entries.filter(e => e.default_role === 'editor').length,
      viewerDefaults: entries.filter(e => e.default_role === 'viewer').length,
    };
  } catch (error) {
    console.error('[Allowlist] Exception getting stats:', error);
    return null;
  }
}
