import { test, expect } from '@playwright/test';
import { 
  loginAs, 
  clearAuthState, 
  is403Page, 
  isLoginPage,
  waitForPageLoad 
} from './helpers/auth';
import { ROUTES } from './helpers/fixtures';

/**
 * Route Protection E2E Tests
 * 
 * Tests for:
 * - Protected routes require authentication
 * - Role-based route access
 * - 403 page display for unauthorized access
 * - Redirect behavior
 */
test.describe('Route Protection', () => {
  test.describe('Unauthenticated Access', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page);
    });

    test('should redirect /dashboard to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('should redirect /content/lexicon to login when not authenticated', async ({ page }) => {
      await page.goto('/content/lexicon');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('should redirect /users to login when not authenticated', async ({ page }) => {
      await page.goto('/users');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('should redirect /publish-center to login when not authenticated', async ({ page }) => {
      await page.goto('/publish-center');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('should redirect /settings to login when not authenticated', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('should redirect /assets to login when not authenticated', async ({ page }) => {
      await page.goto('/assets');
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('public routes should be accessible without login', async ({ page }) => {
      // Login page should be accessible
      await page.goto('/admin/login');
      await expect(page).toHaveURL(/.*login.*/);
      await expect(page.locator('form')).toBeVisible();

      // 403 page should be accessible
      await page.goto('/admin/403');
      await expect(page.locator('text=403').or(page.locator('text=Forbidden'))).toBeVisible();
    });
  });

  test.describe('Admin Role Access', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin');
    });

    test('admin can access /dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
      await expect(page).not.toHaveURL(/.*login.*/);
      await expect(page.locator('h1, main')).toBeVisible();
    });

    test('admin can access /content/lexicon', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
      await expect(page.locator('h1').first()).toContainText(/词典|Lexicon/i);
    });

    test('admin can access /content/grammar', async ({ page }) => {
      await page.goto('/content/grammar');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('admin can access /content/scenarios', async ({ page }) => {
      await page.goto('/content/scenarios');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('admin can access /users (admin-only)', async ({ page }) => {
      await page.goto('/users');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
      await expect(page.locator('h1').first()).toContainText(/用户管理|User/i);
    });

    test('admin can access /settings', async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('admin can access /settings/allowlist (admin-only)', async ({ page }) => {
      await page.goto('/settings/allowlist');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('admin can access /publish-center', async ({ page }) => {
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
      await expect(page.locator('h1').first()).toContainText(/发布中心|Publish/i);
    });

    test('admin can access /assets', async ({ page }) => {
      await page.goto('/assets');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });
  });

  test.describe('Editor Role Access', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'editor');
    });

    test('editor can access /dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      await expect(page).not.toHaveURL(/.*login.*/);
    });

    test('editor can access /content/lexicon', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('editor can access /content/grammar', async ({ page }) => {
      await page.goto('/content/grammar');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('editor can access /publish-center', async ({ page }) => {
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('editor can access /assets', async ({ page }) => {
      await page.goto('/assets');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('editor CANNOT access /users (admin-only)', async ({ page }) => {
      await page.goto('/users');
      
      // Should be redirected to 403 or dashboard
      const url = page.url();
      const onUsersPage = url.includes('/users') && !url.includes('/403');
      
      if (onUsersPage) {
        // If still on users page, check for 403 content
        const forbidden = await is403Page(page);
        expect(forbidden).toBe(true);
      } else {
        // Redirected away from users page
        expect(url.includes('/users')).toBe(false);
      }
    });

    test('editor CANNOT access /settings/allowlist (admin-only)', async ({ page }) => {
      await page.goto('/settings/allowlist');
      
      const url = page.url();
      const onAllowlistPage = url.includes('/allowlist') && !url.includes('/403');
      
      if (onAllowlistPage) {
        const forbidden = await is403Page(page);
        expect(forbidden).toBe(true);
      } else {
        expect(url.includes('/allowlist')).toBe(false);
      }
    });
  });

  test.describe('Viewer Role Access', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'viewer');
    });

    test('viewer can access /dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Viewer should at least see the dashboard, even if limited
      const isLogin = await isLoginPage(page);
      expect(isLogin).toBe(false);
    });

    test('viewer can access /content/lexicon (view only)', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('viewer can access /publish-center (view only)', async ({ page }) => {
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('viewer CANNOT access /users (admin-only)', async ({ page }) => {
      await page.goto('/users');
      
      const url = page.url();
      const onUsersPage = url.includes('/users') && !url.includes('/403');
      
      if (onUsersPage) {
        const forbidden = await is403Page(page);
        expect(forbidden).toBe(true);
      } else {
        expect(url.includes('/users')).toBe(false);
      }
    });

    test('viewer CANNOT access /settings/allowlist (admin-only)', async ({ page }) => {
      await page.goto('/settings/allowlist');
      
      const url = page.url();
      const onAllowlistPage = url.includes('/allowlist');
      
      if (onAllowlistPage) {
        const forbidden = await is403Page(page);
        expect(forbidden).toBe(true);
      } else {
        expect(onAllowlistPage).toBe(false);
      }
    });
  });

  test.describe('403 Forbidden Page', () => {
    test('403 page displays correct content', async ({ page }) => {
      await page.goto('/admin/403');
      
      // Should show 403 message
      await expect(page.locator('text=403')).toBeVisible();
      await expect(
        page.locator('text=Forbidden').or(
          page.locator('text=Access Forbidden').or(
            page.locator('text=没有权限')
          )
        )
      ).toBeVisible();
      
      // Should have navigation options
      await expect(
        page.locator('button:has-text("Home")').or(
          page.locator('button:has-text("首页")').or(
            page.locator('a:has-text("Home")')
          )
        )
      ).toBeVisible();
    });

    test('403 page has back to login button', async ({ page }) => {
      await page.goto('/admin/403');
      
      const loginButton = page.locator('button:has-text("Login")').or(
        page.locator('button:has-text("登录")').or(
          page.locator('a:has-text("Login")')
        )
      );
      
      await expect(loginButton).toBeVisible();
    });

    test('403 page home button works', async ({ page }) => {
      await page.goto('/admin/403');
      
      const homeButton = page.locator('button:has-text("Home")').or(
        page.locator('button:has-text("首页")').or(
          page.locator('button:has-text("Go to Home")')
        )
      );
      
      if (await homeButton.isVisible()) {
        await homeButton.click();
        // Should navigate away from 403
        await expect(page).not.toHaveURL(/.*403.*/);
      }
    });
  });

  test.describe('Navigation Flow', () => {
    test('sidebar navigation works for admin', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/dashboard');
      
      // Try clicking content link in sidebar
      const contentLink = page.locator('a[href*="content"], nav a:has-text("内容"), nav a:has-text("Content")').first();
      if (await contentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await contentLink.click();
        await expect(page).toHaveURL(/.*content.*/);
      }
    });

    test('breadcrumb navigation works', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/content/lexicon');
      
      // If breadcrumbs exist, test them
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"], .breadcrumb');
      if (await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false)) {
        const homeLink = breadcrumb.locator('a:has-text("Home"), a:has-text("首页")').first();
        if (await homeLink.isVisible()) {
          await homeLink.click();
          await expect(page).not.toHaveURL(/.*lexicon.*/);
        }
      }
    });
  });

  test.describe('Content Type Routes', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin');
    });

    test('can access /content/medical-lexicon', async ({ page }) => {
      await page.goto('/content/medical-lexicon');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('can access /content/medical-dialogs', async ({ page }) => {
      await page.goto('/content/medical-dialogs');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('can access /content/medical-scenario', async ({ page }) => {
      await page.goto('/content/medical-scenario');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('can access /content/readings', async ({ page }) => {
      await page.goto('/content/readings');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });

    test('can access /content/lessons', async ({ page }) => {
      await page.goto('/content/lessons');
      await waitForPageLoad(page);
      
      const forbidden = await is403Page(page);
      expect(forbidden).toBe(false);
    });
  });
});
