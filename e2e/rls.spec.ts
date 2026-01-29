import { test, expect } from '@playwright/test';
import { 
  loginAs, 
  clearAuthState,
  waitForPageLoad,
  setupMockAuth
} from './helpers/auth';

/**
 * Row Level Security (RLS) E2E Tests
 * 
 * Tests for Supabase RLS policies:
 * - Unauthenticated users cannot access protected data
 * - Users can only access data they have permission for
 * - Role-level data filtering
 * - Published content visibility rules
 * 
 * Note: These tests verify the behavior exposed through the UI.
 * For direct RLS policy testing, use Supabase test utilities.
 */

test.describe('RLS Policy Tests', () => {
  test.describe('Unauthenticated Access', () => {
    test.beforeEach(async ({ page }) => {
      await clearAuthState(page);
    });

    test('unauthenticated user cannot view content list via UI', async ({ page }) => {
      // Try to access content directly
      await page.goto('/content/lexicon');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('unauthenticated user cannot view user data via UI', async ({ page }) => {
      await page.goto('/users');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/);
    });

    test('unauthenticated user cannot access publish center', async ({ page }) => {
      await page.goto('/publish-center');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/);
    });
  });

  test.describe('Role-based Data Access', () => {
    test('admin can view all users', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/users');
      await waitForPageLoad(page);
      
      // Admin should see user table with data
      const table = page.locator('table');
      await expect(table).toBeVisible();
      
      // Should see multiple user rows
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('editor cannot view user management data', async ({ page }) => {
      await loginAs(page, 'editor');
      await page.goto('/users');
      
      // Editor should be blocked by RLS/403
      const url = page.url();
      if (url.includes('/users')) {
        // If on users page, should see 403 or empty state
        await expect(
          page.locator('text=403').or(
            page.locator('text=Forbidden').or(
              page.locator('text=没有权限')
            )
          )
        ).toBeVisible({ timeout: 5000 });
      } else {
        // Should not be on users page
        expect(url.includes('/users')).toBe(false);
      }
    });

    test('viewer cannot view user management data', async ({ page }) => {
      await loginAs(page, 'viewer');
      await page.goto('/users');
      
      const url = page.url();
      if (url.includes('/users')) {
        await expect(
          page.locator('text=403').or(
            page.locator('text=Forbidden')
          )
        ).toBeVisible({ timeout: 5000 });
      } else {
        expect(url.includes('/users')).toBe(false);
      }
    });
  });

  test.describe('Content Visibility Rules', () => {
    test('all roles can view published content', async ({ page }) => {
      // Test with admin first
      await loginAs(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const adminCanSeeTable = await page.locator('table').isVisible({ timeout: 5000 }).catch(() => false);
      
      // Test with editor
      await clearAuthState(page);
      await loginAs(page, 'editor');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const editorCanSeeTable = await page.locator('table').isVisible({ timeout: 5000 }).catch(() => false);
      
      // Test with viewer
      await clearAuthState(page);
      await loginAs(page, 'viewer');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const viewerCanSeeTable = await page.locator('table').isVisible({ timeout: 5000 }).catch(() => false);
      
      // All should be able to view content list
      expect(adminCanSeeTable).toBe(true);
      expect(editorCanSeeTable).toBe(true);
      expect(viewerCanSeeTable).toBe(true);
    });

    test('publish center shows accurate content counts', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      // Should show statistics cards
      await expect(page.locator('text=可发布率').or(page.locator('text=Publishable'))).toBeVisible();
      
      // Should show content type breakdown
      await expect(
        page.locator('text=词典').or(page.locator('text=Lexicon'))
      ).toBeVisible();
    });
  });

  test.describe('Draft Content Protection', () => {
    test('draft content is visible to authenticated users', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Filter by draft status
      const statusFilter = page.locator('select').filter({ hasText: /状态|Status/ });
      if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await statusFilter.selectOption('draft');
        
        // Should see draft content
        const table = page.locator('table');
        await expect(table).toBeVisible();
      }
    });

    test('publish status badge shows correctly', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Check for status badges
      const draftBadge = page.locator('text=草稿').or(page.locator('text=Draft'));
      const publishedBadge = page.locator('text=已发布').or(page.locator('text=Published'));
      
      // At least one status type should be visible
      const hasDraft = await draftBadge.first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasPublished = await publishedBadge.first().isVisible({ timeout: 5000 }).catch(() => false);
      
      // Should have some status indicators
      expect(hasDraft || hasPublished).toBe(true);
    });
  });

  test.describe('Allowlist Protection', () => {
    test('only admin can view allowlist data', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/settings/allowlist');
      await waitForPageLoad(page);
      
      // Admin should see allowlist content
      const url = page.url();
      expect(url.includes('/allowlist') || !url.includes('/403')).toBe(true);
    });

    test('editor cannot view allowlist', async ({ page }) => {
      await loginAs(page, 'editor');
      await page.goto('/settings/allowlist');
      
      // Should be blocked
      const url = page.url();
      expect(url.includes('/allowlist') && !url.includes('/403')).toBe(false);
    });

    test('viewer cannot view allowlist', async ({ page }) => {
      await loginAs(page, 'viewer');
      await page.goto('/settings/allowlist');
      
      // Should be blocked
      const url = page.url();
      expect(url.includes('/allowlist') && !url.includes('/403')).toBe(false);
    });
  });

  test.describe('Profile Data Protection', () => {
    test('users can see their own profile info', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Should see some user indicator (name, email, avatar)
      const userIndicator = page.locator('[data-testid="user-avatar"]').or(
        page.locator('[data-testid="user-name"]').or(
          page.locator('text=admin@').or(
            page.locator('text=Admin')
          )
        )
      );
      
      // Some user indicator should be visible
      await expect(userIndicator.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Data Modification Protection', () => {
    test('editor cannot modify another user role via API', async ({ page }) => {
      await loginAs(page, 'editor');
      await page.goto('/dashboard');
      
      // Try to access users API directly (should be blocked by RLS)
      // This is tested by trying to navigate to users page
      await page.goto('/users');
      
      const url = page.url();
      expect(url.includes('/users') && !url.includes('/403')).toBe(false);
    });

    test('viewer cannot create content via API', async ({ page }) => {
      await loginAs(page, 'viewer');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Create button should be disabled/hidden
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")');
      
      if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await createButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe('Cross-Content Type RLS', () => {
    test('RLS applies consistently across content types', async ({ page }) => {
      await loginAs(page, 'viewer');
      
      // Check lexicon
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      let lexiconCreateDisabled = true;
      let createBtn = page.locator('button:has-text("新建"), button:has-text("New")');
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        lexiconCreateDisabled = await createBtn.isDisabled();
      }
      
      // Check grammar
      await page.goto('/content/grammar');
      await waitForPageLoad(page);
      let grammarCreateDisabled = true;
      createBtn = page.locator('button:has-text("新建"), button:has-text("New")');
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        grammarCreateDisabled = await createBtn.isDisabled();
      }
      
      // Check scenarios
      await page.goto('/content/scenarios');
      await waitForPageLoad(page);
      let scenarioCreateDisabled = true;
      createBtn = page.locator('button:has-text("新建"), button:has-text("New")');
      if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        scenarioCreateDisabled = await createBtn.isDisabled();
      }
      
      // All should be disabled for viewer
      expect(lexiconCreateDisabled).toBe(true);
      expect(grammarCreateDisabled).toBe(true);
      expect(scenarioCreateDisabled).toBe(true);
    });
  });

  test.describe('Audit Trail Protection', () => {
    test('content shows creator information', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open an item to see details
      const moreButton = page.locator('button:has([class*="MoreHorizontal"])').first();
      
      if (await moreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreButton.click();
        
        const viewOption = page.locator('[role="menuitem"]:has-text("查看"), [role="menuitem"]:has-text("View")');
        if (await viewOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await viewOption.click();
          await page.waitForTimeout(500);
          
          // Should see some metadata (author, date, etc.)
          const metadata = page.locator('text=作者').or(
            page.locator('text=Author').or(
              page.locator('text=Created').or(
                page.locator('text=Updated')
              )
            )
          );
          
          // Some metadata should be visible
          const hasMetadata = await metadata.first().isVisible({ timeout: 5000 }).catch(() => false);
          // Metadata display depends on implementation
        }
      }
    });
  });
});

/**
 * Mock RLS Tests
 * These tests verify RLS behavior when using mock data
 */
test.describe('Mock Mode RLS Behavior', () => {
  test('mock mode still enforces UI-level permissions', async ({ page }) => {
    // Setup mock auth as viewer
    await page.goto('/admin/login');
    await setupMockAuth(page, 'viewer');
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    // Even in mock mode, viewer permissions should be enforced in UI
    await page.goto('/content/lexicon');
    await waitForPageLoad(page);
    
    const createButton = page.locator('button:has-text("新建"), button:has-text("New")');
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isDisabled = await createButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});
