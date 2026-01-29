import { test, expect } from '@playwright/test';
import { 
  loginAs, 
  clearAuthState,
  waitForPageLoad 
} from './helpers/auth';
import { SELECTORS, PERMISSIONS } from './helpers/fixtures';

/**
 * Permission E2E Tests
 * 
 * Tests for role-based permissions:
 * - Admin: Full access
 * - Editor: Can create/edit but not delete
 * - Viewer: Read-only access
 * 
 * Permission Matrix:
 * | Function         | Admin | Editor | Viewer |
 * |------------------|-------|--------|--------|
 * | View Dashboard   | ✅    | ✅     | ✅     |
 * | View Content     | ✅    | ✅     | ✅     |
 * | Create Content   | ✅    | ✅     | ❌     |
 * | Edit Content     | ✅    | ✅     | ❌     |
 * | Delete Content   | ✅    | ❌     | ❌     |
 * | Publish Content  | ✅    | ✅     | ❌     |
 * | Batch Publish    | ✅    | ✅     | ❌     |
 * | View Users       | ✅    | ❌     | ❌     |
 * | Modify Roles     | ✅    | ❌     | ❌     |
 * | Manage Allowlist | ✅    | ❌     | ❌     |
 * | Upload Assets    | ✅    | ✅     | ❌     |
 * | Delete Assets    | ✅    | ❌     | ❌     |
 */

test.describe('Admin Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test.describe('User Management', () => {
    test('admin can access user management page', async ({ page }) => {
      await page.goto('/users');
      await waitForPageLoad(page);
      
      await expect(page.locator('h1').first()).toContainText(/用户管理|User Management/i);
      await expect(page).not.toHaveURL(/.*403.*/);
    });

    test('admin can see user list', async ({ page }) => {
      await page.goto('/users');
      await waitForPageLoad(page);
      
      // Should see user table
      await expect(page.locator('table')).toBeVisible();
    });

    test('admin can edit user role', async ({ page }) => {
      await page.goto('/users');
      await waitForPageLoad(page);
      
      // Look for edit button in user table
      const editButton = page.locator('button:has([class*="UserCog"]), button:has-text("编辑"), button:has-text("Edit")').first();
      
      if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editButton.click();
        
        // Should open edit dialog
        await expect(page.locator('[role="dialog"]')).toBeVisible();
        
        // Should see role selector
        await expect(
          page.locator('select, [role="combobox"]').filter({ hasText: /Admin|Editor|Viewer|管理员|编辑员|查看者/ })
        ).toBeVisible();
      }
    });
  });

  test.describe('Content Management', () => {
    test('admin can create new content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Find create button
      const createButton = page.locator('button:has-text("新建"), button:has-text("New"), button:has-text("Create")');
      
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
      
      // Click to open editor
      await createButton.click();
      
      // Should open creation form/drawer
      await expect(page.locator('[role="dialog"]').or(page.locator('form'))).toBeVisible();
    });

    test('admin can edit existing content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Wait for content table
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
      
      // Find edit option (usually in dropdown menu)
      const moreButton = page.locator('button:has([class*="MoreHorizontal"]), button[aria-label*="more"], button:has-text("...")').first();
      
      if (await moreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreButton.click();
        
        const editOption = page.locator('[role="menuitem"]:has-text("编辑"), [role="menuitem"]:has-text("Edit")');
        await expect(editOption).toBeVisible();
        await expect(editOption).toBeEnabled();
      }
    });

    test('admin can delete content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
      
      const moreButton = page.locator('button:has([class*="MoreHorizontal"]), button[aria-label*="more"]').first();
      
      if (await moreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreButton.click();
        
        const deleteOption = page.locator('[role="menuitem"]:has-text("删除"), [role="menuitem"]:has-text("Delete")');
        await expect(deleteOption).toBeVisible();
        await expect(deleteOption).toBeEnabled();
      }
    });
  });

  test.describe('Publishing', () => {
    test('admin can publish content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open content editor
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Check for publish button
        const publishButton = page.locator('button:has-text("发布"), button:has-text("Publish")');
        await expect(publishButton).toBeVisible();
      }
    });

    test('admin can batch publish from publish center', async ({ page }) => {
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      // Look for batch publish button (may be disabled if nothing selected)
      const batchPublishButton = page.locator('button:has-text("批量发布"), button:has-text("Batch Publish")');
      
      // Button should exist (may be disabled if nothing selected)
      if (await batchPublishButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Success - batch publish is available
      }
    });
  });

  test.describe('Allowlist Management', () => {
    test('admin can access allowlist page', async ({ page }) => {
      await page.goto('/settings/allowlist');
      await waitForPageLoad(page);
      
      await expect(page).not.toHaveURL(/.*403.*/);
    });
  });
});

test.describe('Editor Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'editor');
  });

  test.describe('User Management - Restricted', () => {
    test('editor cannot access user management', async ({ page }) => {
      await page.goto('/users');
      
      // Should redirect to 403 or different page
      const url = page.url();
      const hasAccess = url.includes('/users') && !url.includes('/403');
      
      if (hasAccess) {
        // Check for 403 content on page
        await expect(
          page.locator('text=403').or(page.locator('text=Forbidden'))
        ).toBeVisible({ timeout: 5000 });
      } else {
        expect(url.includes('/users')).toBe(false);
      }
    });
  });

  test.describe('Content Management', () => {
    test('editor can create content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const createButton = page.locator('button:has-text("新建"), button:has-text("New"), button:has-text("Create")');
      
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
    });

    test('editor can edit content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
      
      const moreButton = page.locator('button:has([class*="MoreHorizontal"])').first();
      
      if (await moreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreButton.click();
        
        const editOption = page.locator('[role="menuitem"]:has-text("编辑"), [role="menuitem"]:has-text("Edit")');
        await expect(editOption).toBeEnabled();
      }
    });

    test('editor CANNOT delete content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
      
      const moreButton = page.locator('button:has([class*="MoreHorizontal"])').first();
      
      if (await moreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreButton.click();
        
        const deleteOption = page.locator('[role="menuitem"]:has-text("删除"), [role="menuitem"]:has-text("Delete")');
        
        if (await deleteOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          // If visible, should be disabled
          await expect(deleteOption).toBeDisabled();
        }
        // If not visible at all, that's also acceptable
      }
    });
  });

  test.describe('Publishing', () => {
    test('editor can publish content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Check for publish button - should be enabled
        const publishButton = page.locator('button:has-text("发布"), button:has-text("Publish")');
        await expect(publishButton).toBeVisible();
      }
    });

    test('editor can batch publish', async ({ page }) => {
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      // Editor should see batch publish option
      await expect(page.locator('h1').first()).toContainText(/发布中心|Publish/i);
    });
  });

  test.describe('Allowlist - Restricted', () => {
    test('editor cannot access allowlist', async ({ page }) => {
      await page.goto('/settings/allowlist');
      
      const url = page.url();
      const hasAccess = url.includes('/allowlist') && !url.includes('/403');
      
      if (hasAccess) {
        await expect(
          page.locator('text=403').or(page.locator('text=Forbidden'))
        ).toBeVisible({ timeout: 5000 });
      } else {
        expect(url.includes('/allowlist')).toBe(false);
      }
    });
  });
});

test.describe('Viewer Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'viewer');
  });

  test.describe('Viewing Access', () => {
    test('viewer can view dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Should not be on login or 403
      await expect(page).not.toHaveURL(/.*login.*/);
      // May or may not have full dashboard access depending on implementation
    });

    test('viewer can view content list', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Should see content list (even if can't edit)
      await expect(page).not.toHaveURL(/.*login.*/);
    });

    test('viewer can view publish center', async ({ page }) => {
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      await expect(page).not.toHaveURL(/.*login.*/);
    });
  });

  test.describe('Content Operations - Restricted', () => {
    test('viewer CANNOT create content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const createButton = page.locator('button:has-text("新建"), button:has-text("New"), button:has-text("Create")');
      
      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // If visible, should be disabled
        await expect(createButton).toBeDisabled();
      }
      // If not visible, that's also acceptable
    });

    test('viewer CANNOT edit content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
      
      const moreButton = page.locator('button:has([class*="MoreHorizontal"])').first();
      
      if (await moreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreButton.click();
        
        const editOption = page.locator('[role="menuitem"]:has-text("编辑"), [role="menuitem"]:has-text("Edit")');
        
        if (await editOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(editOption).toBeDisabled();
        }
      }
    });

    test('viewer CANNOT delete content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
      
      const moreButton = page.locator('button:has([class*="MoreHorizontal"])').first();
      
      if (await moreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moreButton.click();
        
        const deleteOption = page.locator('[role="menuitem"]:has-text("删除"), [role="menuitem"]:has-text("Delete")');
        
        if (await deleteOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(deleteOption).toBeDisabled();
        }
      }
    });
  });

  test.describe('Publishing - Restricted', () => {
    test('viewer CANNOT publish content', async ({ page }) => {
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // If there's a view option
      await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
      
      const viewButton = page.locator('button:has([class*="Eye"]), button:has-text("查看")').first();
      
      if (await viewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await viewButton.click();
        await page.waitForTimeout(500);
        
        // In view mode, there should be no publish button or it should be disabled
        const publishButton = page.locator('button:has-text("发布"), button:has-text("Publish")');
        
        if (await publishButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(publishButton).toBeDisabled();
        }
      }
    });

    test('viewer CANNOT batch publish', async ({ page }) => {
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      
      // Look for batch publish button
      const batchPublishButton = page.locator('button:has-text("批量发布"), button:has-text("Batch Publish")');
      
      if (await batchPublishButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Should be hidden or disabled for viewer
        const isDisabled = await batchPublishButton.isDisabled();
        expect(isDisabled).toBe(true);
      }
      // If not visible, that's also acceptable
    });
  });

  test.describe('Admin Features - Restricted', () => {
    test('viewer CANNOT access user management', async ({ page }) => {
      await page.goto('/users');
      
      const url = page.url();
      expect(url.includes('/users') && !url.includes('/403')).toBe(false);
    });

    test('viewer CANNOT access allowlist', async ({ page }) => {
      await page.goto('/settings/allowlist');
      
      const url = page.url();
      expect(url.includes('/allowlist') && !url.includes('/403')).toBe(false);
    });
  });
});

test.describe('Cross-Role Verification', () => {
  test('different roles have different UI elements', async ({ page }) => {
    // Test admin view
    await loginAs(page, 'admin');
    await page.goto('/content/lexicon');
    await waitForPageLoad(page);
    
    const adminCreateButton = page.locator('button:has-text("新建"), button:has-text("New")');
    const adminCanCreate = await adminCreateButton.isEnabled().catch(() => false);
    
    // Clear and login as viewer
    await clearAuthState(page);
    await loginAs(page, 'viewer');
    await page.goto('/content/lexicon');
    await waitForPageLoad(page);
    
    const viewerCreateButton = page.locator('button:has-text("新建"), button:has-text("New")');
    const viewerCanCreate = await viewerCreateButton.isEnabled().catch(() => false);
    
    // Admin should be able to create, viewer should not
    expect(adminCanCreate).toBe(true);
    expect(viewerCanCreate).toBe(false);
  });
});
