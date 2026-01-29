"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseBrowser, isSupabaseConfigured } from "./supabase/client";
import { toast } from "sonner";
import { checkEmailAllowed as checkEmailAllowedService } from "./supabase/allowlist-service";
import { mockCheckEmailAllowed } from "./admin-mock";

// Database role fetching function
async function getUserRoleFromDatabase(userId: string): Promise<UserRole> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    // When Supabase is not configured, default to admin for local development
    console.warn('[Auth] Supabase not configured, using default admin role for local development');
    return 'admin';
  }

  try {
    // Try to create user profile (non-blocking on failure)
    try {
      await supabase.rpc('create_user_profile', { user_id: userId });
    } catch (rpcError) {
      console.warn('[Auth] create_user_profile RPC failed (this is okay if profiles table doesn\'t have this function):', rpcError);
    }

    // Then fetch the role
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[Auth] Error fetching user role from profiles:', error);
      // Default to admin when cannot fetch role from database (user is authenticated)
      return 'admin';
    }

    const role = data?.role as UserRole;
    console.log('[Auth] User role from database:', role);
    return role || 'admin';
  } catch (error) {
    console.warn('[Auth] Error in getUserRoleFromDatabase:', error);
    // Default to admin when cannot fetch role (user is authenticated)
    return 'admin';
  }
}

type UserRole = "admin" | "editor" | "viewer";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (provider: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Parse emails from environment variable (for backward compatibility during migration)
function parseEmailList(envKey: string): string[] {
  const emailsEnv = process.env[envKey];
  if (!emailsEnv) return [];
  return emailsEnv.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
}

// Get user role based on email whitelist (fallback for migration period)
// This will be phased out once all users are migrated to profiles
function getLegacyUserRole(email: string): UserRole | null {
  const normalizedEmail = email.toLowerCase();

  // Check new multi-role environment variables
  const adminEmails = parseEmailList('NEXT_PUBLIC_ADMIN_EMAILS');
  const editorEmails = parseEmailList('NEXT_PUBLIC_EDITOR_EMAILS');
  const viewerEmails = parseEmailList('NEXT_PUBLIC_VIEWER_EMAILS');

  // Check legacy environment variable for backward compatibility
  const legacyAllowedEmails = parseEmailList('NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS');

  // If admin role matches
  if (adminEmails.includes(normalizedEmail)) return "admin";

  // If editor role matches
  if (editorEmails.includes(normalizedEmail)) return "editor";

  // If viewer role matches
  if (viewerEmails.includes(normalizedEmail)) return "viewer";

  // Legacy support: if NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS is set, treat as admin
  if (legacyAllowedEmails.includes(normalizedEmail)) return "admin";

  // If no whitelist is configured at all, allow as viewer (safer default)
  const hasAnyWhitelist =
    adminEmails.length > 0 ||
    editorEmails.length > 0 ||
    viewerEmails.length > 0 ||
    legacyAllowedEmails.length > 0;

  if (!hasAnyWhitelist) {
    console.warn("No admin whitelist configured. Using database roles only.");
    return "viewer"; // Default to viewer instead of admin
  }

  // User not in any whitelist
  return null;
}

// Check if email is allowed using database allowlist
// This is the async version for use in login flows
async function checkDatabaseAllowlist(email: string): Promise<{ allowed: boolean; defaultRole: 'admin' | 'editor' | 'viewer' }> {
  try {
    if (isSupabaseConfigured) {
      return await checkEmailAllowedService(email);
    } else {
      return mockCheckEmailAllowed(email);
    }
  } catch (error) {
    console.warn('[Auth] Error checking database allowlist:', error);
    // Fall back to environment variable check
    const legacyRole = getLegacyUserRole(email);
    if (legacyRole !== null) {
      return { allowed: true, defaultRole: legacyRole };
    }
    return { allowed: true, defaultRole: 'viewer' }; // Allow by default when both checks fail
  }
}

// Check if email is allowed (during migration, allow if in whitelist or if using database roles)
// This is the sync version that just checks environment variables
function isEmailAllowed(email: string): boolean {
  // If environment whitelist is configured, use it
  if (getLegacyUserRole(email) !== null) return true;

  // Otherwise, allow all authenticated users (roles will be checked from database)
  return true;
}

// Check if dev mock auth is enabled
const isDevMockAuth = process.env.NEXT_PUBLIC_DEV_MOCK_AUTH === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // When dev mock auth is enabled, skip real authentication
    if (isDevMockAuth) {
      console.warn('[Auth] DEV_MOCK_AUTH enabled, using mock admin user');
      setUser({
        id: 'local-dev-user',
        email: 'admin@local.dev',
        name: 'Local Admin (Mock)',
        role: 'admin',
      });
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      // When Supabase is not configured, create a mock admin user for local development
      console.warn('[Auth] Supabase not configured, using mock admin user for local development');
      setUser({
        id: 'local-dev-user',
        email: 'admin@local.dev',
        name: 'Local Admin',
        role: 'admin',
      });
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userEmail = session.user.email || "";

        // Validate email against whitelist (migration support)
        if (!isEmailAllowed(userEmail)) {
          // User not allowed, sign out
          await supabase.auth.signOut();
          setUser(null);
          setIsLoading(false);
          // Redirect to login with error
          if (typeof window !== 'undefined') {
            const errorMsg = encodeURIComponent(`Access denied. Your email (${userEmail}) is not authorized to access the admin console.`);
            window.location.href = `/admin/login?error=${errorMsg}`;
          }
          return;
        }

        const userRole = await getUserRoleFromDatabase(session.user.id);
        setUser({
          id: session.user.id,
          email: userEmail,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          role: userRole,
        });
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" && session?.user) {
          const userEmail = session.user.email || "";

          // Validate email against whitelist (migration support)
          if (!isEmailAllowed(userEmail)) {
            // User not allowed, sign out immediately
            await supabase.auth.signOut();
            setUser(null);

            // Show error toast
            toast.error("Access Denied", {
              description: `Your email (${userEmail}) is not authorized to access the admin console.`,
              duration: 5000,
            });

            // Redirect to login with error
            if (typeof window !== 'undefined') {
              const errorMsg = encodeURIComponent(`Access denied. Your email (${userEmail}) is not authorized to access the admin console.`);
              window.location.href = `/admin/login?error=${errorMsg}`;
            }
            return;
          }

          const userRole = await getUserRoleFromDatabase(session.user.id);
          setUser({
            id: session.user.id,
            email: userEmail,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
            role: userRole,
          });
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (provider: string): Promise<void> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      throw new Error("Supabase not configured");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/admin/login?redirect=/dashboard`,
      },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      throw new Error("Supabase not configured");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const userEmail = data.user.email || "";
      
      // Validate email against whitelist (migration support)
      if (!isEmailAllowed(userEmail)) {
        await supabase.auth.signOut();
        throw new Error(`Access denied. Your email (${userEmail}) is not authorized to access the admin console.`);
      }

      const userRole = await getUserRoleFromDatabase(data.user.id);
      setUser({
        id: data.user.id,
        email: userEmail,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
        role: userRole,
      });
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<{ needsConfirmation: boolean }> => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      throw new Error("Supabase not configured");
    }

    // Validate email against whitelist before signup
    if (!isEmailAllowed(email)) {
      throw new Error(`Access denied. Your email (${email}) is not authorized to access the admin console.`);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/login?redirect=/dashboard`,
      },
    });

    if (error) throw error;

    // Check if user needs to confirm email
    const needsConfirmation = !data.session && data.user?.identities?.length === 0 ? false : !data.session;

    if (data.session && data.user) {
      const userRole = await getUserRoleFromDatabase(data.user.id);
      setUser({
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
        role: userRole,
      });
    }

    return { needsConfirmation };
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Admin has all permissions
    if (user.role === "admin") return true;

    // Editor can do everything except admin-only actions
    if (user.role === "editor" && roles.includes("editor")) return true;

    // Viewer can only view
    if (user.role === "viewer" && roles.includes("viewer")) return true;

    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithEmail, signUpWithEmail, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Permission helpers

// Can view content - all roles
export function canView(_role: UserRole): boolean {
  return true;
}

// Can create/edit content - admin and editor
export function canEdit(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

// Can submit for review - admin and editor
export function canSubmitForReview(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

// Can approve/reject reviews - admin only
export function canApproveReview(role: UserRole): boolean {
  return role === "admin";
}

// Can publish content - admin only (after review)
export function canPublish(role: UserRole): boolean {
  return role === "admin";
}

// Can archive content - admin and editor
export function canArchive(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

// Can delete content - admin only
export function canDelete(role: UserRole): boolean {
  return role === "admin";
}

// Can manage team - admin only
export function canManageTeam(role: UserRole): boolean {
  return role === "admin";
}

// Can change settings - admin only
export function canChangeSettings(role: UserRole): boolean {
  return role === "admin";
}

// ============================================
// EMAIL ALLOWLIST VERIFICATION
// ============================================

/**
 * Verify if an email is allowed to access the admin console
 * First checks environment variables (backward compatibility), then database allowlist
 * @param email - The email address to verify
 * @returns Promise with allowed status and default role
 */
export async function verifyEmailAllowed(email: string): Promise<{
  allowed: boolean;
  defaultRole: 'admin' | 'editor' | 'viewer';
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. First check environment variables (backward compatibility)
  const legacyRole = getLegacyUserRole(normalizedEmail);
  if (legacyRole !== null) {
    return { allowed: true, defaultRole: legacyRole };
  }

  // 2. Check database allowlist
  try {
    if (isSupabaseConfigured) {
      const result = await checkEmailAllowedService(normalizedEmail);
      return { allowed: result.allowed, defaultRole: result.defaultRole };
    } else {
      const result = mockCheckEmailAllowed(normalizedEmail);
      return { allowed: result.allowed, defaultRole: result.defaultRole };
    }
  } catch (error) {
    console.warn('[Auth] Error verifying email allowlist:', error);
    // If no allowlist is configured and database check fails, allow by default
    return { allowed: true, defaultRole: 'viewer' };
  }
}
