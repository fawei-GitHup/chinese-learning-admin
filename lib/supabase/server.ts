import "server-only";
import { createClient } from "@supabase/supabase-js";

// Environment variables for server client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase server is configured
export const isSupabaseServerConfigured = Boolean(
  supabaseUrl && supabaseServiceRoleKey
);

// Create server client with service role (admin access)
// NEVER expose this to client components
export const supabaseServer = isSupabaseServerConfigured
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Helper to get the server client with a warning if not configured
export function getSupabaseServer() {
  if (!isSupabaseServerConfigured) {
    console.warn(
      "[Supabase] Server client not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    return null;
  }
  return supabaseServer;
}

// Helper for server actions that require Supabase
export async function withSupabaseServer<T>(
  fn: (client: NonNullable<typeof supabaseServer>) => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  const client = getSupabaseServer();
  if (!client) {
    return {
      data: null,
      error: "Supabase not configured. Using local mock data.",
    };
  }
  try {
    const data = await fn(client);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error: message };
  }
}
