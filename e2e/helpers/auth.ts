import { Page, expect } from '@playwright/test';

/**
 * Test user credentials for different roles
 * These should be configured in .env.test or CI secrets
 */
export const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'test123456',
    role: 'admin' as const,
  },
  editor: {
    email: process.env.TEST_EDITOR_EMAIL || 'editor@test.com',
    password: process.env.TEST_EDITOR_PASSWORD || 'test123456',
    role: 'editor' as const,
  },
  viewer: {
    email: process.env.TEST_VIEWER_EMAIL || 'viewer@test.com',
    password: process.env.TEST_VIEWER_PASSWORD || 'test123456',
    role: 'viewer' as const,
  },
} as const;

export type UserRole = keyof typeof TEST_USERS;

/**
 * Login helper function
 * Logs in as a specific role and waits for redirect to dashboard
 * 
 * @param page - Playwright Page object
 * @param role - User role to login as (admin, editor, viewer)
 */
export async function loginAs(page: Page, role: UserRole): Promise<void> {
  const user = TEST_USERS[role];
  
  // Navigate to login page
  await page.goto('/admin/login');
  
  // Wait for login form to be visible
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  
  // Fill in email
  await page.fill('input[type="email"]', user.email);
  
  // Fill in password
  await page.fill('input[type="password"]', user.password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Wait for successful login - should redirect away from login page
  await expect(page).not.toHaveURL('/admin/login', { timeout: 15000 });
}

/**
 * Enhanced login with mock mode support
 * When NEXT_PUBLIC_DEV_MOCK_AUTH is true, automatically uses mock user
 * 
 * @param page - Playwright Page object
 * @param role - User role to login as
 */
export async function loginWithMockSupport(page: Page, role: UserRole): Promise<void> {
  // Check if we're in mock auth mode
  const isMockAuth = process.env.NEXT_PUBLIC_DEV_MOCK_AUTH === 'true';
  
  if (isMockAuth) {
    // In mock mode, simply navigate to dashboard - auth context will auto-login
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    return;
  }
  
  // Regular login flow
  await loginAs(page, role);
}

/**
 * Logout helper function
 * Logs out the current user
 * 
 * @param page - Playwright Page object
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button or user menu
  const userMenuButton = page.locator('[data-testid="user-menu"]').or(
    page.locator('button:has-text("Logout")').or(
      page.locator('button:has-text("退出")')
    )
  );
  
  // Try to find and click logout
  if (await userMenuButton.isVisible()) {
    await userMenuButton.click();
    
    // Look for logout option in menu
    const logoutButton = page.locator('[data-testid="logout-button"]').or(
      page.locator('button:has-text("Logout")').or(
        page.locator('button:has-text("Sign out")').or(
          page.locator('button:has-text("退出登录")')
        )
      )
    );
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }
  
  // Verify we're logged out by checking for login page
  await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
}

/**
 * Get current user role from the page
 * Reads the role from the auth context via data attribute or UI element
 * 
 * @param page - Playwright Page object
 * @returns The current user's role or null if not logged in
 */
export async function getCurrentUserRole(page: Page): Promise<UserRole | null> {
  // Try to read role from data attribute
  const roleElement = page.locator('[data-user-role]');
  if (await roleElement.isVisible({ timeout: 5000 }).catch(() => false)) {
    const role = await roleElement.getAttribute('data-user-role');
    if (role && ['admin', 'editor', 'viewer'].includes(role)) {
      return role as UserRole;
    }
  }
  
  // Try to read from role badge in UI
  const adminBadge = page.locator('text=管理员').or(page.locator('text=Admin'));
  const editorBadge = page.locator('text=编辑员').or(page.locator('text=Editor'));
  const viewerBadge = page.locator('text=查看者').or(page.locator('text=Viewer'));
  
  if (await adminBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
    return 'admin';
  }
  if (await editorBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
    return 'editor';
  }
  if (await viewerBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
    return 'viewer';
  }
  
  return null;
}

/**
 * Check if user is logged in
 * 
 * @param page - Playwright Page object
 * @returns true if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check if we're on a protected route (not login or 403)
  const url = page.url();
  if (url.includes('/admin/login') || url.includes('/admin/403')) {
    return false;
  }
  
  // Check for auth indicator elements
  const authIndicator = page.locator('[data-testid="user-avatar"]').or(
    page.locator('[data-testid="sidebar"]')
  );
  
  return authIndicator.isVisible({ timeout: 5000 }).catch(() => false);
}

/**
 * Wait for page to be fully loaded
 * Waits for network idle and main content to be visible
 * 
 * @param page - Playwright Page object
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Wait for main content area
  const mainContent = page.locator('main').or(page.locator('[role="main"]'));
  await expect(mainContent).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate to a route and ensure it's accessible
 * Handles authentication redirects
 * 
 * @param page - Playwright Page object
 * @param path - Route path to navigate to
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Check if current page shows 403 Forbidden
 * 
 * @param page - Playwright Page object
 * @returns true if showing 403 page
 */
export async function is403Page(page: Page): Promise<boolean> {
  // Check URL
  if (page.url().includes('/admin/403')) {
    return true;
  }
  
  // Check for 403 text content
  const forbiddenText = page.locator('text=403').or(
    page.locator('text=Forbidden').or(
      page.locator('text=Access Forbidden').or(
        page.locator('text=没有权限')
      )
    )
  );
  
  return forbiddenText.isVisible({ timeout: 3000 }).catch(() => false);
}

/**
 * Check if current page shows login form
 * 
 * @param page - Playwright Page object
 * @returns true if showing login page
 */
export async function isLoginPage(page: Page): Promise<boolean> {
  // Check URL
  if (page.url().includes('/admin/login') || page.url().includes('/login')) {
    return true;
  }
  
  // Check for login form
  const loginForm = page.locator('form').filter({
    has: page.locator('input[type="email"]'),
  }).filter({
    has: page.locator('input[type="password"]'),
  });
  
  return loginForm.isVisible({ timeout: 3000 }).catch(() => false);
}

/**
 * Setup mock auth state for testing without real Supabase
 * This sets localStorage values that the auth context reads
 * 
 * @param page - Playwright Page object
 * @param role - User role to mock
 */
export async function setupMockAuth(page: Page, role: UserRole): Promise<void> {
  const user = TEST_USERS[role];
  
  // Set mock user data in localStorage
  await page.evaluate(({ email, role }) => {
    localStorage.setItem('mock-auth-user', JSON.stringify({
      id: `test-${role}-user`,
      email,
      role,
      name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    }));
  }, { email: user.email, role: user.role });
}

/**
 * Clear auth state (localStorage, cookies, sessionStorage)
 * 
 * @param page - Playwright Page object
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  await page.context().clearCookies();
}
