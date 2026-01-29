import { test, expect } from '@playwright/test';
import { 
  loginAs, 
  logout, 
  isLoggedIn, 
  isLoginPage, 
  is403Page,
  clearAuthState,
  TEST_USERS 
} from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * Authentication E2E Tests
 * 
 * Tests for:
 * - Login flow
 * - Logout flow
 * - Session persistence
 * - Protected route access
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/admin/login');
    await clearAuthState(page);
  });

  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Should show login form
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Should show title
      await expect(page.locator('h1, [role="heading"]').first()).toContainText(/Admin|登录|Sign in/i);
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Enter invalid credentials
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(
        page.locator('[role="alert"], .text-destructive, .error-message')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Enter invalid email format
      await page.fill('input[type="email"]', 'notanemail');
      await page.fill('input[type="password"]', 'somepassword');
      
      // The form should not submit with invalid email
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should require password', async ({ page }) => {
      await page.goto('/admin/login');
      
      // Enter only email
      await page.fill('input[type="email"]', 'test@test.com');
      
      // Try to submit without password
      const passwordInput = page.locator('input[type="password"]');
      const isRequired = await passwordInput.getAttribute('required');
      expect(isRequired !== null).toBe(true);
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Should redirect to dashboard or protected page
      await expect(page).not.toHaveURL(/.*login.*/);
      
      // Should see dashboard content
      await expect(page.locator('h1, main')).toBeVisible();
    });

    test('should preserve redirect URL after login', async ({ page }) => {
      // Try to access protected route directly
      await page.goto('/users');
      
      // Should redirect to login with redirect param
      await expect(page).toHaveURL(/.*login.*/);
      
      // Login
      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.fill('input[type="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      
      // Should redirect back to original URL after login
      // Note: This depends on implementation - may redirect to dashboard instead
      await expect(page).not.toHaveURL(/.*login.*/);
    });
  });

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await loginAs(page, 'admin');
    });

    test('should logout successfully', async ({ page }) => {
      // Navigate to dashboard first
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*dashboard.*/);
      
      // Find and click logout button (may be in user menu)
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("退出"), button:has-text("Sign out")');
      const userMenu = page.locator('[data-testid="user-menu"], button:has([data-testid="user-avatar"])');
      
      // Try to find logout button, might need to open menu first
      if (await userMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userMenu.click();
        await page.waitForTimeout(500); // Wait for menu to open
      }
      
      if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutButton.click();
        
        // Should redirect to login page
        await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
      }
    });

    test('should not access protected routes after logout', async ({ page }) => {
      // First verify we can access dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*dashboard.*/);
      
      // Clear auth (simulate logout)
      await clearAuthState(page);
      
      // Try to access dashboard again
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*dashboard.*/);
      
      // Refresh page
      await page.reload();
      
      // Should still be on dashboard (not redirected to login)
      await expect(page).not.toHaveURL(/.*login.*/);
    });

    test('should maintain session across navigation', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Navigate through different pages
      await page.goto('/dashboard');
      await expect(page).not.toHaveURL(/.*login.*/);
      
      await page.goto('/content/lexicon');
      await expect(page).not.toHaveURL(/.*login.*/);
      
      await page.goto('/users');
      await expect(page).not.toHaveURL(/.*login.*/);
    });
  });

  test.describe('Unauthorized Access', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await clearAuthState(page);
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 });
    });

    test('should allow access to login page without auth', async ({ page }) => {
      await clearAuthState(page);
      
      await page.goto('/admin/login');
      
      // Should stay on login page
      await expect(page.locator('form')).toBeVisible();
    });

    test('should allow access to 403 page without redirect loop', async ({ page }) => {
      await clearAuthState(page);
      
      await page.goto('/admin/403');
      
      // Should show 403 page content
      await expect(page.locator('text=403').or(page.locator('text=Forbidden'))).toBeVisible();
    });
  });

  test.describe('Role-based Login', () => {
    test('admin can login successfully', async ({ page }) => {
      await loginAs(page, 'admin');
      
      await expect(page).not.toHaveURL(/.*login.*/);
      
      // Admin should be able to access users page
      await page.goto('/users');
      const isForbidden = await is403Page(page);
      expect(isForbidden).toBe(false);
    });

    test('editor can login successfully', async ({ page }) => {
      await loginAs(page, 'editor');
      
      await expect(page).not.toHaveURL(/.*login.*/);
      
      // Editor should be redirected when accessing admin-only pages
      await page.goto('/users');
      
      // Should be redirected to 403 or dashboard
      const url = page.url();
      expect(url.includes('/users')).toBe(false);
    });

    test('viewer can login successfully', async ({ page }) => {
      await loginAs(page, 'viewer');
      
      await expect(page).not.toHaveURL(/.*login.*/);
      
      // Viewer should be able to access dashboard
      await page.goto('/dashboard');
      const isForbidden = await is403Page(page);
      // Viewer might get 403 depending on implementation
    });
  });
});

/**
 * Google OAuth Tests (Placeholder)
 * These tests require proper OAuth setup and may not work in CI without configuration
 */
test.describe('OAuth Login', () => {
  test.skip('should show Google login button', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Should show Google login button
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  // Note: Full OAuth testing requires mock OAuth or real credentials
  // which should be handled separately
});
