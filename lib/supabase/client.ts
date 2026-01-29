import { createClient } from "@supabase/supabase-js";

// Environment variables for browser client (public)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if dev mock auth is enabled (when true, we skip real Supabase operations)
export const isDevMockAuth = process.env.NEXT_PUBLIC_DEV_MOCK_AUTH === 'true';

// Check if Supabase is configured AND mock auth is NOT enabled
// When mock auth is enabled, we treat Supabase as not configured for data operations
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey) && !isDevMockAuth;

// Create browser client (only if configured)
export const supabaseBrowser = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Helper to get the client with a warning if not configured
export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) {
    console.warn(
      "[Supabase] Browser client not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return null;
  }
  return supabaseBrowser;
}
