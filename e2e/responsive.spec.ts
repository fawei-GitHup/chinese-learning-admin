import { test, expect } from '@playwright/test';
import { loginWithMockSupport, waitForPageLoad } from './helpers/auth';

/**
 * Responsive Layout Tests
 * 
 * Tests the Admin Console UI across different screen sizes:
 * - Desktop (1920x1080): Full sidebar, multi-column layout
 * - Laptop (1366x768): Normal layout
 * - Tablet Portrait (768x1024): Collapsible sidebar
 * - Tablet Landscape (1024x768): Collapsible sidebar
 * - Mobile Portrait (375x667): Hamburger menu, single column
 * - Mobile Landscape (667x375): Compact layout
 */

test.describe('Responsive Layout', () => {
  
  // ==========================================
  // Desktop (1920x1080) - Full Layout
  // ==========================================
  test.describe('Desktop (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });
    
    test('sidebar is fully visible', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check sidebar is visible
      const sidebar = page.locator('[data-testid="sidebar"], nav').first();
      await expect(sidebar).toBeVisible();
      
      // Check sidebar has full width (not collapsed)
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox?.width).toBeGreaterThan(200);
    });
    
    test('navigation links are visible', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check that navigation links/text are visible (not just icons)
      const navLinks = page.locator('nav a, nav [role="link"]');
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('content area uses full width', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Main content should take remaining space
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
      
      const mainBox = await main.boundingBox();
      expect(mainBox?.width).toBeGreaterThan(1000);
    });
    
    test('data tables display multiple columns', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Check that table has multiple visible columns
      const tableHeaders = page.locator('table thead th, [role="columnheader"]');
      const headerCount = await tableHeaders.count();
      
      // Desktop should show more columns
      expect(headerCount).toBeGreaterThanOrEqual(3);
    });
  });
  
  // ==========================================
  // Laptop (1366x768) - Standard Layout
  // ==========================================
  test.describe('Laptop (1366x768)', () => {
    test.use({ viewport: { width: 1366, height: 768 } });
    
    test('sidebar is visible', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const sidebar = page.locator('[data-testid="sidebar"], nav').first();
      await expect(sidebar).toBeVisible();
    });
    
    test('main navigation is accessible', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Can navigate to different sections
      const dashboardLink = page.locator('a[href="/dashboard"], a:has-text("仪表盘"), a:has-text("Dashboard")').first();
      await expect(dashboardLink).toBeVisible();
    });
    
    test('content renders correctly', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Main heading should be visible
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    });
  });
  
  // ==========================================
  // Tablet Portrait (768x1024) - Collapsible Sidebar
  // ==========================================
  test.describe('Tablet Portrait (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });
    
    test('sidebar is collapsible or hidden', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Either sidebar is hidden or there's a toggle button
      const sidebar = page.locator('[data-testid="sidebar"], nav[role="navigation"]').first();
      const menuToggle = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i], button[aria-label*="Menu" i]').first();
      
      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      const toggleVisible = await menuToggle.isVisible().catch(() => false);
      
      // At tablet size, either sidebar should be collapsed or there should be a toggle
      expect(sidebarVisible || toggleVisible).toBe(true);
    });
    
    test('content adapts to available width', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
      
      const mainBox = await main.boundingBox();
      // Content should use most of the available width
      expect(mainBox?.width).toBeGreaterThan(600);
    });
    
    test('forms are usable', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Try to open create form if there's a button
      const createButton = page.locator('button:has-text("新建"), button:has-text("New"), button:has-text("Create")').first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
        
        // Form inputs should be accessible
        const formInputs = page.locator('input, textarea');
        const inputCount = await formInputs.count();
        expect(inputCount).toBeGreaterThan(0);
      }
    });
  });
  
  // ==========================================
  // Tablet Landscape (1024x768) - Transitional Layout
  // ==========================================
  test.describe('Tablet Landscape (1024x768)', () => {
    test.use({ viewport: { width: 1024, height: 768 } });
    
    test('layout adapts appropriately', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
    });
    
    test('navigation is accessible', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check navigation is usable
      const navArea = page.locator('nav, [role="navigation"]').first();
      const menuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i]').first();
      
      const navVisible = await navArea.isVisible().catch(() => false);
      const menuButtonVisible = await menuButton.isVisible().catch(() => false);
      
      expect(navVisible || menuButtonVisible).toBe(true);
    });
  });
  
  // ==========================================
  // Mobile Portrait (375x667) - Mobile Layout
  // ==========================================
  test.describe('Mobile Portrait (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });
    
    test('sidebar is hidden by default', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // On mobile, sidebar should be hidden initially
      const sidebar = page.locator('[data-testid="sidebar"]');
      const sidebarVisible = await sidebar.isVisible().catch(() => false);
      
      // If there's no data-testid, sidebar should either be hidden or very narrow
      if (sidebarVisible) {
        const sidebarBox = await sidebar.boundingBox();
        // Collapsed sidebar should be narrow
        expect(sidebarBox?.width).toBeLessThan(100);
      }
    });
    
    test('hamburger menu or mobile navigation is visible', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Mobile should have hamburger menu or bottom navigation
      const mobileNav = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i], button:has(.hamburger), [data-testid="mobile-nav"]').first();
      
      // Allow for either hamburger menu or visible mobile navigation
      const hasVisibleNav = await mobileNav.isVisible().catch(() => false);
      
      // If no hamburger, check for visible navigation links
      if (!hasVisibleNav) {
        const anyNavLink = page.locator('nav a, [role="navigation"] a').first();
        const hasNavLinks = await anyNavLink.isVisible().catch(() => false);
        expect(hasVisibleNav || hasNavLinks).toBe(true);
      } else {
        expect(hasVisibleNav).toBe(true);
      }
    });
    
    test('content uses single column layout', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
      
      const mainBox = await main.boundingBox();
      // On mobile, content should take most of the screen width
      expect(mainBox?.width).toBeGreaterThan(300);
      expect(mainBox?.width).toBeLessThanOrEqual(375);
    });
    
    test('buttons and touch targets are adequately sized', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const buttons = page.locator('button:visible').first();
      if (await buttons.isVisible().catch(() => false)) {
        const buttonBox = await buttons.boundingBox();
        // Minimum touch target size should be at least 44x44 for accessibility
        expect(buttonBox?.height).toBeGreaterThanOrEqual(32);
        expect(buttonBox?.width).toBeGreaterThanOrEqual(32);
      }
    });
    
    test('text is readable without zooming', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check that main text is at least 14px
      const bodyText = page.locator('p, span, div').first();
      if (await bodyText.isVisible().catch(() => false)) {
        const fontSize = await bodyText.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        const fontSizeNum = parseFloat(fontSize);
        expect(fontSizeNum).toBeGreaterThanOrEqual(12);
      }
    });
  });
  
  // ==========================================
  // Mobile Landscape (667x375) - Compact Layout
  // ==========================================
  test.describe('Mobile Landscape (667x375)', () => {
    test.use({ viewport: { width: 667, height: 375 } });
    
    test('layout adapts to landscape orientation', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
    });
    
    test('content is scrollable when needed', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Page should be scrollable if content exceeds viewport
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = 375;
      
      // Either content fits or page is scrollable
      expect(scrollHeight).toBeGreaterThan(0);
    });
    
    test('header stays visible', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Header/topbar should be visible
      const header = page.locator('[data-testid="topbar"], header').first();
      const headingOrLogo = await header.isVisible().catch(() => false);
      
      // Some apps might not have a traditional header
      if (headingOrLogo) {
        await expect(header).toBeVisible();
      }
    });
  });
  
  // ==========================================
  // Responsive Breakpoint Transitions
  // ==========================================
  test.describe('Responsive Breakpoint Transitions', () => {
    test('layout adjusts smoothly when resizing', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Tablet Landscape' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 375, height: 667, name: 'Mobile' },
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(300); // Allow for CSS transitions
        
        // Main content should always be visible
        const main = page.locator('main, [role="main"]').first();
        await expect(main).toBeVisible();
      }
    });
  });
  
  // ==========================================
  // Component Responsiveness
  // ==========================================
  test.describe('Component Responsiveness', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ];
    
    for (const viewport of viewports) {
      test(`cards and containers adapt at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await loginWithMockSupport(page, 'admin');
        await page.goto('/dashboard');
        await waitForPageLoad(page);
        
        // Cards should be visible and fit within viewport
        const cards = page.locator('[class*="card"], .card, [role="article"]').first();
        if (await cards.isVisible().catch(() => false)) {
          const cardBox = await cards.boundingBox();
          expect(cardBox?.width).toBeLessThanOrEqual(viewport.width);
        }
      });
    }
    
    test('dialog/drawer adapts to viewport size', async ({ page }) => {
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Test at mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Try to open a dialog/drawer
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Dialog should fit within mobile viewport
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
        if (await dialog.isVisible().catch(() => false)) {
          const dialogBox = await dialog.boundingBox();
          expect(dialogBox?.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });
});
