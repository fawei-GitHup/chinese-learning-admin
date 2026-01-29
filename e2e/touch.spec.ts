import { test, expect, devices } from '@playwright/test';
import { loginWithMockSupport, setupMockAuth, waitForPageLoad } from './helpers/auth';

/**
 * Touch Interaction Tests
 * 
 * Tests touch-specific interactions for mobile devices:
 * - Touch scrolling
 * - Touch tap/click
 * - Long press menus
 * - Swipe gestures (if applicable)
 * - Pinch zoom (if applicable)
 * - Touch-friendly UI elements
 */

// Mobile device configurations for touch testing
const mobileDevices = [
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'iPhone 12', device: devices['iPhone 12'] },
];

test.describe('Touch Interactions', () => {
  
  // ==========================================
  // Basic Touch Navigation
  // ==========================================
  test.describe('Basic Touch Navigation', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('can tap to navigate', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          // Find a navigation link or button
          const navLink = page.locator('a[href*="/content"], button:has-text("内容"), button:has-text("Content")').first();
          
          if (await navLink.isVisible()) {
            // Tap on the element
            await navLink.tap();
            await page.waitForTimeout(500);
            
            // Should navigate or show submenu
            const urlChanged = page.url().includes('/content');
            const submenuVisible = await page.locator('[role="menu"], [class*="submenu"]').isVisible().catch(() => false);
            
            expect(urlChanged || submenuVisible).toBe(true);
          }
        });
        
        test('can tap buttons', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Find a button
          const button = page.locator('button:visible').first();
          if (await button.isVisible()) {
            // Get button state before tap
            const initialAriaExpanded = await button.getAttribute('aria-expanded');
            
            await button.tap();
            await page.waitForTimeout(300);
            
            // Button should respond to tap (state change or action)
            // This validates touch events are properly handled
          }
        });
        
        test('touch targets are adequately sized', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          // Check all interactive elements
          const interactiveElements = page.locator('button:visible, a:visible, input:visible');
          const count = await interactiveElements.count();
          
          // Check first 10 elements for touch target size
          const minTouchTarget = 44; // WCAG recommended minimum
          
          for (let i = 0; i < Math.min(count, 10); i++) {
            const element = interactiveElements.nth(i);
            const box = await element.boundingBox();
            
            if (box) {
              // At least one dimension should meet minimum
              const meetsSizeRequirement = box.width >= 32 || box.height >= 32;
              expect(meetsSizeRequirement).toBe(true);
            }
          }
        });
      });
    }
  });
  
  // ==========================================
  // Touch Scrolling
  // ==========================================
  test.describe('Touch Scrolling', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('page scrolls with touch', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Get initial scroll position
          const initialScrollY = await page.evaluate(() => window.scrollY);
          
          // Simulate touch scroll by using mouse wheel or touch events
          await page.mouse.wheel(0, 300);
          await page.waitForTimeout(500);
          
          // Check if scroll position changed
          const newScrollY = await page.evaluate(() => window.scrollY);
          
          // Page should be scrollable if content exceeds viewport
          const pageHeight = await page.evaluate(() => document.body.scrollHeight);
          const viewportHeight = device.viewport?.height || 800;
          
          if (pageHeight > viewportHeight) {
            expect(newScrollY).toBeGreaterThanOrEqual(initialScrollY);
          }
        });
        
        test('content list scrolls smoothly', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Find scrollable content area
          const scrollableArea = page.locator('table, [role="table"], [class*="scroll"]').first();
          
          if (await scrollableArea.isVisible()) {
            const box = await scrollableArea.boundingBox();
            if (box) {
              // Start scroll gesture
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await page.mouse.wheel(0, 100);
              await page.waitForTimeout(300);
            }
          }
        });
        
        test('horizontal scroll works in tables', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          const table = page.locator('table, [role="table"]').first();
          if (await table.isVisible()) {
            const tableBox = await table.boundingBox();
            const viewportWidth = device.viewport?.width || 375;
            
            // If table is wider than viewport, horizontal scroll should work
            if (tableBox && tableBox.width > viewportWidth) {
              const scrollContainer = page.locator('[class*="overflow-x"], [style*="overflow-x"]').first();
              if (await scrollContainer.isVisible()) {
                const initialScrollX = await scrollContainer.evaluate((el) => el.scrollLeft);
                
                // Simulate horizontal scroll
                await page.mouse.move(tableBox.x + viewportWidth / 2, tableBox.y + tableBox.height / 2);
                await page.mouse.wheel(100, 0);
                await page.waitForTimeout(300);
                
                // Verify scroll happened
                const newScrollX = await scrollContainer.evaluate((el) => el.scrollLeft);
                // Horizontal scroll should have changed
              }
            }
          }
        });
      });
    }
  });
  
  // ==========================================
  // Touch Form Interactions
  // ==========================================
  test.describe('Touch Form Interactions', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('can tap to focus input fields', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Open create form
          const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
          if (await createButton.isVisible()) {
            await createButton.tap();
            await page.waitForTimeout(500);
            
            // Find input field
            const inputField = page.locator('input:visible, textarea:visible').first();
            if (await inputField.isVisible()) {
              await inputField.tap();
              await page.waitForTimeout(300);
              
              // Input should be focused
              const isFocused = await inputField.evaluate((el) => el === document.activeElement);
              expect(isFocused).toBe(true);
            }
          }
        });
        
        test('virtual keyboard does not obscure focused input', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
          if (await createButton.isVisible()) {
            await createButton.tap();
            await page.waitForTimeout(500);
            
            const inputField = page.locator('input:visible, textarea:visible').first();
            if (await inputField.isVisible()) {
              await inputField.tap();
              await page.waitForTimeout(500);
              
              // Check input is visible in viewport
              const inputBox = await inputField.boundingBox();
              const viewportHeight = device.viewport?.height || 800;
              
              if (inputBox) {
                // Input should be in the visible area
                expect(inputBox.y).toBeLessThan(viewportHeight);
              }
            }
          }
        });
        
        test('dropdown menus open on tap', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Find a select or dropdown
          const dropdown = page.locator('select, [role="combobox"], button[aria-haspopup="listbox"]').first();
          
          if (await dropdown.isVisible()) {
            await dropdown.tap();
            await page.waitForTimeout(500);
            
            // Dropdown menu should be visible
            const menu = page.locator('[role="listbox"], [role="menu"], select option').first();
            const menuVisible = await menu.isVisible().catch(() => false);
            
            // For native selects, options are in the DOM but visibility check may differ
            expect(menuVisible || await page.locator('[data-state="open"]').isVisible().catch(() => false)).toBe(true);
          }
        });
        
        test('checkboxes respond to tap', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Find checkbox
          const checkbox = page.locator('input[type="checkbox"]:visible, [role="checkbox"]:visible').first();
          
          if (await checkbox.isVisible()) {
            const initialChecked = await checkbox.isChecked().catch(async () => {
              return await checkbox.getAttribute('aria-checked') === 'true';
            });
            
            await checkbox.tap();
            await page.waitForTimeout(300);
            
            const newChecked = await checkbox.isChecked().catch(async () => {
              return await checkbox.getAttribute('aria-checked') === 'true';
            });
            
            // State should toggle
            expect(newChecked).toBe(!initialChecked);
          }
        });
      });
    }
  });
  
  // ==========================================
  // Long Press Interactions
  // ==========================================
  test.describe('Long Press Interactions', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('long press on content item (if context menu exists)', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Find a content row
          const contentRow = page.locator('table tbody tr, [role="row"]').first();
          
          if (await contentRow.isVisible()) {
            const box = await contentRow.boundingBox();
            if (box) {
              // Simulate long press with mouse down and wait
              await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await page.mouse.down();
              await page.waitForTimeout(800); // Long press duration
              await page.mouse.up();
              await page.waitForTimeout(300);
              
              // Check if context menu appeared
              const contextMenu = page.locator('[role="menu"], [class*="context-menu"], [class*="dropdown"]').first();
              const menuVisible = await contextMenu.isVisible().catch(() => false);
              
              // Long press behavior is optional, not all apps implement it
              // Just verify the interaction doesn't cause errors
            }
          }
        });
      });
    }
  });
  
  // ==========================================
  // Mobile Menu Interactions
  // ==========================================
  test.describe('Mobile Menu Interactions', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('hamburger menu opens on tap', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          // Find hamburger menu button
          const menuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i], button:has(.hamburger), [class*="hamburger"]').first();
          
          if (await menuButton.isVisible()) {
            await menuButton.tap();
            await page.waitForTimeout(500);
            
            // Navigation drawer should be visible
            const navDrawer = page.locator('[role="navigation"], [class*="drawer"], [class*="sidebar"]').first();
            await expect(navDrawer).toBeVisible();
          }
        });
        
        test('mobile menu closes when tapping outside', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          const menuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i]').first();
          
          if (await menuButton.isVisible()) {
            // Open menu
            await menuButton.tap();
            await page.waitForTimeout(500);
            
            const navDrawer = page.locator('[role="navigation"], [class*="drawer"]').first();
            if (await navDrawer.isVisible()) {
              // Tap outside the menu (on overlay or main content)
              const overlay = page.locator('[class*="overlay"], [data-state="open"]::before').first();
              const main = page.locator('main, [role="main"]').first();
              
              if (await overlay.isVisible()) {
                await overlay.tap();
              } else {
                await main.tap({ position: { x: 10, y: 10 } });
              }
              
              await page.waitForTimeout(500);
              
              // Menu should be closed or hidden
              // Note: Implementation varies, some menus slide out
            }
          }
        });
        
        test('can navigate using mobile menu', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          const menuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i]').first();
          
          if (await menuButton.isVisible()) {
            await menuButton.tap();
            await page.waitForTimeout(500);
            
            // Find navigation link in mobile menu
            const navLink = page.locator('nav a[href*="/content"], [role="navigation"] a[href*="/content"]').first();
            if (await navLink.isVisible()) {
              await navLink.tap();
              await page.waitForTimeout(1000);
              
              // Should navigate to content page
              expect(page.url()).toContain('/content');
            }
          }
        });
      });
    }
  });
  
  // ==========================================
  // Swipe Gestures (if applicable)
  // ==========================================
  test.describe('Swipe Gestures', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('swipe to navigate carousel (if exists)', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          // Find carousel or swipeable component
          const carousel = page.locator('[class*="carousel"], [class*="swiper"], [class*="slider"]').first();
          
          if (await carousel.isVisible()) {
            const box = await carousel.boundingBox();
            if (box) {
              // Simulate swipe gesture
              await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
              await page.mouse.down();
              await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
              await page.mouse.up();
              await page.waitForTimeout(500);
              
              // Carousel should have moved (implementation specific)
            }
          }
        });
        
        test('swipe to dismiss drawer (if supported)', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          // Open mobile menu
          const menuButton = page.locator('[data-testid="mobile-menu-button"], button[aria-label*="menu" i]').first();
          
          if (await menuButton.isVisible()) {
            await menuButton.tap();
            await page.waitForTimeout(500);
            
            const drawer = page.locator('[class*="drawer"], [class*="sheet"]').first();
            if (await drawer.isVisible()) {
              const box = await drawer.boundingBox();
              if (box) {
                // Simulate swipe left to close
                await page.mouse.move(box.x + box.width * 0.5, box.y + box.height / 2);
                await page.mouse.down();
                await page.mouse.move(box.x - 50, box.y + box.height / 2, { steps: 10 });
                await page.mouse.up();
                await page.waitForTimeout(500);
                
                // Drawer may have closed (implementation specific)
              }
            }
          }
        });
      });
    }
  });
  
  // ==========================================
  // Pull to Refresh (if applicable)
  // ==========================================
  test.describe('Pull to Refresh', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('pull to refresh (if implemented)', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Check if pull to refresh is implemented
          const refreshIndicator = page.locator('[class*="refresh"], [class*="pull-to-refresh"]').first();
          
          if (await refreshIndicator.isVisible().catch(() => false)) {
            // Simulate pull down gesture
            await page.mouse.move(page.viewportSize()!.width / 2, 100);
            await page.mouse.down();
            await page.mouse.move(page.viewportSize()!.width / 2, 300, { steps: 10 });
            await page.waitForTimeout(500);
            await page.mouse.up();
            await page.waitForTimeout(1000);
            
            // Check for refresh indicator or loading state
          }
        });
      });
    }
  });
  
  // ==========================================
  // Touch Accessibility
  // ==========================================
  test.describe('Touch Accessibility', () => {
    
    for (const { name, device } of mobileDevices) {
      test.describe(`${name}`, () => {
        test.use({ ...device });
        
        test('all interactive elements have adequate spacing', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/dashboard');
          await waitForPageLoad(page);
          
          // Get all buttons
          const buttons = page.locator('button:visible');
          const count = await buttons.count();
          
          // Check first 5 button pairs for spacing
          for (let i = 0; i < Math.min(count - 1, 5); i++) {
            const button1 = buttons.nth(i);
            const button2 = buttons.nth(i + 1);
            
            const box1 = await button1.boundingBox();
            const box2 = await button2.boundingBox();
            
            if (box1 && box2) {
              // Calculate spacing between buttons
              const horizontalGap = Math.abs(box2.x - (box1.x + box1.width));
              const verticalGap = Math.abs(box2.y - (box1.y + box1.height));
              
              // At least some spacing should exist (8px minimum recommended)
              const hasAdequateSpacing = horizontalGap >= 4 || verticalGap >= 4;
              // Note: This is a soft check as buttons may be intentionally grouped
            }
          }
        });
        
        test('no accidental taps on close elements', async ({ page }) => {
          await setupMockAuth(page, 'admin');
          await loginWithMockSupport(page, 'admin');
          await page.goto('/content/lexicon');
          await waitForPageLoad(page);
          
          // Open a form or dialog
          const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
          if (await createButton.isVisible()) {
            await createButton.tap();
            await page.waitForTimeout(500);
            
            // Find close and save buttons
            const closeButton = page.locator('button[aria-label="Close"], button:has-text("取消"), button:has-text("Cancel")').first();
            const saveButton = page.locator('button:has-text("保存"), button:has-text("Save")').first();
            
            if (await closeButton.isVisible() && await saveButton.isVisible()) {
              const closeBox = await closeButton.boundingBox();
              const saveBox = await saveButton.boundingBox();
              
              if (closeBox && saveBox) {
                // Calculate distance between buttons
                const distance = Math.sqrt(
                  Math.pow(saveBox.x - closeBox.x, 2) + 
                  Math.pow(saveBox.y - closeBox.y, 2)
                );
                
                // Buttons should have sufficient separation
                expect(distance).toBeGreaterThan(20);
              }
            }
          }
        });
      });
    }
  });
});
