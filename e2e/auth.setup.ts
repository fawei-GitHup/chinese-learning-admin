import { test as setup, expect } from '@playwright/test';
import { TEST_USERS } from './helpers/auth';

/**
 * Authentication Setup
 * This runs before all tests to set up authenticated state
 * that can be reused across multiple test files.
 * 
 * The setup creates storage state files (cookies, localStorage)
 * that subsequent tests can use without re-logging in.
 */

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/admin/login');
  
  // Wait for page to load
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  
  // Check if we're in mock auth mode
  const isMockAuth = process.env.NEXT_PUBLIC_DEV_MOCK_AUTH === 'true';
  
  if (isMockAuth) {
    // In mock mode, just navigate to dashboard - auth context will auto-login
    await page.goto('/dashboard');
    await expect(page.locator('h1, main')).toBeVisible({ timeout: 10000 });
  } else {
    // Perform actual login with admin credentials
    const user = TEST_USERS.admin;
    
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login - should redirect away from login
    await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
    
    // Wait for dashboard to load
    await expect(page.locator('h1, main')).toBeVisible({ timeout: 10000 });
  }
  
  // Save signed-in state for reuse
  await page.context().storageState({ path: authFile });
});

/**
 * Note: To use different role states, you can create additional setup files:
 * 
 * setup('authenticate as editor', async ({ page }) => { ... });
 * setup('authenticate as viewer', async ({ page }) => { ... });
 * 
 * And configure them in playwright.config.ts with different storageState paths.
 */
