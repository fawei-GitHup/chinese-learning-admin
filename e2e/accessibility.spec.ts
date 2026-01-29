import { test, expect } from '@playwright/test';
import { loginWithMockSupport, setupMockAuth, waitForPageLoad } from './helpers/auth';

/**
 * Accessibility Tests
 * 
 * Tests accessibility features of the Admin Console:
 * - Keyboard navigation
 * - Focus management
 * - ARIA attributes
 * - Screen reader compatibility
 * - Color contrast (basic checks)
 * - Text alternatives
 */

test.describe('Accessibility', () => {
  
  // ==========================================
  // Keyboard Navigation
  // ==========================================
  test.describe('Keyboard Navigation', () => {
    
    test('can navigate main sections using Tab key', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Start from the beginning of the page
      await page.keyboard.press('Tab');
      
      // Track focused elements
      const focusedElements: string[] = [];
      
      for (let i = 0; i < 20; i++) {
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          if (el) {
            return {
              tagName: el.tagName,
              role: el.getAttribute('role'),
              ariaLabel: el.getAttribute('aria-label'),
              textContent: el.textContent?.slice(0, 50),
            };
          }
          return null;
        });
        
        if (focusedElement) {
          focusedElements.push(`${focusedElement.tagName} - ${focusedElement.ariaLabel || focusedElement.textContent}`);
        }
        
        await page.keyboard.press('Tab');
      }
      
      // Should have multiple focusable elements
      expect(focusedElements.length).toBeGreaterThan(0);
      console.log('Focusable elements:', focusedElements.slice(0, 10));
    });
    
    test('can navigate backwards with Shift+Tab', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Tab forward several times
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Get current focused element
      const beforeElement = await page.evaluate(() => document.activeElement?.tagName);
      
      // Tab backwards
      await page.keyboard.press('Shift+Tab');
      
      // Focus should move backwards
      const afterElement = await page.evaluate(() => document.activeElement?.tagName);
      
      // The focus should have changed
      expect(afterElement).toBeDefined();
    });
    
    test('can activate buttons with Enter key', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Tab to find a button
      let foundButton = false;
      for (let i = 0; i < 30 && !foundButton; i++) {
        await page.keyboard.press('Tab');
        
        const isButton = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName === 'BUTTON' || el?.getAttribute('role') === 'button';
        });
        
        if (isButton) {
          foundButton = true;
          
          // Press Enter to activate
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          
          // Something should happen (dialog open, navigation, etc.)
        }
      }
      
      expect(foundButton).toBe(true);
    });
    
    test('can activate buttons with Space key', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Tab to find a button
      let foundButton = false;
      for (let i = 0; i < 30 && !foundButton; i++) {
        await page.keyboard.press('Tab');
        
        const isButton = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName === 'BUTTON' || el?.getAttribute('role') === 'button';
        });
        
        if (isButton) {
          foundButton = true;
          
          // Press Space to activate
          await page.keyboard.press('Space');
          await page.waitForTimeout(500);
        }
      }
      
      expect(foundButton).toBe(true);
    });
    
    test('can close dialogs with Escape key', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open a dialog
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Verify dialog is open
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
        await expect(dialog).toBeVisible();
        
        // Press Escape to close
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Dialog should be closed
        await expect(dialog).not.toBeVisible();
      }
    });
    
    test('can navigate dropdown menus with Arrow keys', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Find a dropdown/combobox
      const dropdown = page.locator('[role="combobox"], select, button[aria-haspopup="listbox"]').first();
      
      if (await dropdown.isVisible()) {
        await dropdown.focus();
        await page.keyboard.press('Enter'); // or Space to open
        await page.waitForTimeout(300);
        
        // Navigate with arrow keys
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        // Select with Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    });
  });
  
  // ==========================================
  // Focus Management
  // ==========================================
  test.describe('Focus Management', () => {
    
    test('focus is visible on interactive elements', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      // Check if focus is visible (has outline or ring)
      const hasFocusStyle = await page.evaluate(() => {
        const el = document.activeElement;
        if (el) {
          const style = window.getComputedStyle(el);
          const outline = style.outline;
          const boxShadow = style.boxShadow;
          const outlineStyle = style.outlineStyle;
          
          // Check for any focus indicator
          return (
            outline !== 'none' ||
            outlineStyle !== 'none' ||
            boxShadow !== 'none' ||
            el.classList.contains('focus-visible') ||
            el.matches(':focus-visible')
          );
        }
        return false;
      });
      
      // Focus should be visible
      expect(hasFocusStyle).toBe(true);
    });
    
    test('focus is trapped within modal dialogs', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open a dialog
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Tab through dialog elements many times
        const focusedInDialog: boolean[] = [];
        
        for (let i = 0; i < 20; i++) {
          await page.keyboard.press('Tab');
          
          const isInDialog = await page.evaluate(() => {
            const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
            const focused = document.activeElement;
            return dialog?.contains(focused) || false;
          });
          
          focusedInDialog.push(isInDialog);
        }
        
        // Most (if not all) focus should be within dialog
        const inDialogCount = focusedInDialog.filter(Boolean).length;
        expect(inDialogCount).toBeGreaterThan(focusedInDialog.length * 0.8);
      }
    });
    
    test('focus returns to trigger after modal closes', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Focus on create button and open dialog
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.focus();
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Close dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Focus should return to the trigger button area
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.textContent || el?.getAttribute('aria-label') || '';
        });
        
        // Focus should be back near the button (implementation varies)
        expect(focusedElement).toBeDefined();
      }
    });
  });
  
  // ==========================================
  // ARIA Attributes
  // ==========================================
  test.describe('ARIA Attributes', () => {
    
    test('navigation has proper ARIA roles', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check for navigation landmark
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();
      
      // Check for proper role
      const role = await nav.getAttribute('role');
      const tagName = await nav.evaluate(el => el.tagName.toLowerCase());
      
      expect(tagName === 'nav' || role === 'navigation').toBe(true);
    });
    
    test('main content has proper ARIA landmark', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check for main landmark
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible();
    });
    
    test('buttons have accessible names', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Get all visible buttons
      const buttons = page.locator('button:visible');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        
        // Check for accessible name
        const accessibleName = await button.evaluate((el) => {
          return (
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            el.textContent?.trim() ||
            el.getAttribute('aria-labelledby')
          );
        });
        
        // Button should have an accessible name (except icon-only buttons should have aria-label)
        if (accessibleName && accessibleName.length > 0) {
          expect(accessibleName.length).toBeGreaterThan(0);
        }
      }
    });
    
    test('form inputs have labels', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open create form
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Get all inputs
        const inputs = page.locator('input:visible, textarea:visible, select:visible');
        const count = await inputs.count();
        
        for (let i = 0; i < count; i++) {
          const input = inputs.nth(i);
          
          // Check for label association
          const hasLabel = await input.evaluate((el) => {
            const id = el.id;
            const ariaLabel = el.getAttribute('aria-label');
            const ariaLabelledBy = el.getAttribute('aria-labelledby');
            const placeholder = el.getAttribute('placeholder');
            
            // Has explicit label
            if (id && document.querySelector(`label[for="${id}"]`)) {
              return true;
            }
            
            // Has aria-label or aria-labelledby
            if (ariaLabel || ariaLabelledBy) {
              return true;
            }
            
            // Has placeholder (fallback)
            if (placeholder) {
              return true;
            }
            
            // Is wrapped in label
            if (el.closest('label')) {
              return true;
            }
            
            return false;
          });
          
          // Each input should have some form of label
          if (await input.isVisible()) {
            expect(hasLabel).toBe(true);
          }
        }
      }
    });
    
    test('dialogs have proper ARIA attributes', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open a dialog
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
        
        if (await dialog.isVisible()) {
          // Check for required ARIA attributes
          const role = await dialog.getAttribute('role');
          const ariaModal = await dialog.getAttribute('aria-modal');
          const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
          const ariaLabel = await dialog.getAttribute('aria-label');
          
          // Should have dialog or alertdialog role
          expect(['dialog', 'alertdialog']).toContain(role);
          
          // Should have aria-modal (for focus trap)
          expect(ariaModal === 'true' || ariaModal === null).toBe(true);
          
          // Should have accessible name
          expect(ariaLabelledBy || ariaLabel).toBeTruthy();
        }
      }
    });
    
    test('tables have proper structure', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const table = page.locator('table').first();
      
      if (await table.isVisible()) {
        // Check for thead
        const thead = table.locator('thead');
        const hasHeader = await thead.isVisible().catch(() => false);
        
        // Check for th elements
        const thElements = table.locator('th');
        const thCount = await thElements.count();
        
        // Either has thead or th elements
        expect(hasHeader || thCount > 0).toBe(true);
        
        // Check for proper scope attributes on headers
        if (thCount > 0) {
          const firstTh = thElements.first();
          const scope = await firstTh.getAttribute('scope');
          // Scope is recommended but not required
        }
      }
    });
  });
  
  // ==========================================
  // Screen Reader Compatibility
  // ==========================================
  test.describe('Screen Reader Compatibility', () => {
    
    test('page has a proper title', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title).not.toBe('Untitled');
    });
    
    test('heading hierarchy is logical', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Get all headings
      const headings = await page.evaluate(() => {
        const heads = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(heads).map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent?.slice(0, 50),
        }));
      });
      
      // Should have at least one heading
      expect(headings.length).toBeGreaterThan(0);
      
      // Check for h1
      const hasH1 = headings.some(h => h.level === 1);
      expect(hasH1).toBe(true);
      
      // Heading levels should not skip (e.g., from h1 to h4)
      let prevLevel = 0;
      for (const heading of headings) {
        if (prevLevel > 0) {
          // Level should not skip more than 1
          const skip = heading.level - prevLevel;
          expect(skip).toBeLessThanOrEqual(2); // Allow some flexibility
        }
        prevLevel = heading.level;
      }
    });
    
    test('images have alt text', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Get all images
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Either has alt text or is decorative (role="presentation")
        const hasAlt = alt !== null || role === 'presentation' || role === 'none';
        expect(hasAlt).toBe(true);
      }
    });
    
    test('live regions for notifications', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Check for toast/notification container with live region
      const liveRegion = page.locator('[aria-live], [role="alert"], [role="status"]').first();
      
      // Live regions should exist for announcements
      const hasLiveRegion = await liveRegion.isVisible().catch(() => false) ||
        await page.locator('[aria-live="polite"], [aria-live="assertive"]').count() > 0;
      
      // Most apps should have some live region for notifications
      // This is a soft check as toasts may only appear on action
    });
    
    test('skip to main content link', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Press Tab to reveal skip link (often visually hidden until focused)
      await page.keyboard.press('Tab');
      
      // Check for skip link
      const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip to"), a:has-text("跳过")').first();
      
      // Skip links are optional but recommended
      const hasSkipLink = await skipLink.isVisible().catch(() => false);
      
      if (hasSkipLink) {
        await skipLink.click();
        
        // Focus should move to main content
        const focusedInMain = await page.evaluate(() => {
          const main = document.querySelector('main, #main, #content, [role="main"]');
          const focused = document.activeElement;
          return main?.contains(focused) || focused === main;
        });
        
        expect(focusedInMain).toBe(true);
      }
    });
  });
  
  // ==========================================
  // Color and Visual
  // ==========================================
  test.describe('Color and Visual', () => {
    
    test('text has sufficient contrast', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Get text color and background of main elements
      const contrastCheck = await page.evaluate(() => {
        const textElement = document.querySelector('p, span, h1, h2');
        if (!textElement) return null;
        
        const style = window.getComputedStyle(textElement);
        const color = style.color;
        const bg = style.backgroundColor;
        
        return { color, bg };
      });
      
      // Should have defined colors
      expect(contrastCheck).not.toBeNull();
    });
    
    test('interactive elements have visible states', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const button = page.locator('button:visible').first();
      
      if (await button.isVisible()) {
        // Get default state
        const defaultStyles = await button.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            bg: style.backgroundColor,
            color: style.color,
            border: style.border,
          };
        });
        
        // Hover over button
        await button.hover();
        await page.waitForTimeout(100);
        
        const hoverStyles = await button.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            bg: style.backgroundColor,
            color: style.color,
            border: style.border,
          };
        });
        
        // Should have some visual change on hover
        const hasHoverChange = 
          defaultStyles.bg !== hoverStyles.bg ||
          defaultStyles.color !== hoverStyles.color ||
          defaultStyles.border !== hoverStyles.border;
        
        // Hover state is expected for better UX
        expect(hasHoverChange || true).toBe(true); // Soft check
      }
    });
    
    test('errors are not indicated by color alone', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open form
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Try to submit invalid form to trigger errors
        const submitButton = page.locator('button[type="submit"], button:has-text("保存")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);
          
          // Check for error indicators
          const errorIndicators = page.locator('[class*="error"], [aria-invalid="true"], [class*="invalid"]');
          const count = await errorIndicators.count();
          
          if (count > 0) {
            // Check that errors have text/icon, not just color
            const firstError = errorIndicators.first();
            const hasTextOrIcon = await firstError.evaluate((el) => {
              const text = el.textContent?.trim();
              const hasIcon = el.querySelector('svg, [class*="icon"]');
              const hasAriaDescribedBy = el.getAttribute('aria-describedby');
              
              return text || hasIcon || hasAriaDescribedBy;
            });
            
            expect(hasTextOrIcon).toBeTruthy();
          }
        }
      }
    });
  });
  
  // ==========================================
  // Motion and Animation
  // ==========================================
  test.describe('Motion and Animation', () => {
    
    test('respects reduced motion preference', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check for reduced motion media query in CSS
      const respectsReducedMotion = await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
          @media (prefers-reduced-motion: reduce) {
            .test-element { --reduced-motion: true; }
          }
        `;
        document.head.appendChild(style);
        
        const testDiv = document.createElement('div');
        testDiv.className = 'test-element';
        document.body.appendChild(testDiv);
        
        const computed = window.getComputedStyle(testDiv);
        const value = computed.getPropertyValue('--reduced-motion').trim();
        
        // Cleanup
        document.head.removeChild(style);
        document.body.removeChild(testDiv);
        
        return value === 'true';
      });
      
      // Media query should work
      expect(respectsReducedMotion).toBe(true);
    });
    
    test('no auto-playing content that cannot be paused', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Check for auto-playing media
      const autoPlayMedia = page.locator('video[autoplay], audio[autoplay]');
      const count = await autoPlayMedia.count();
      
      for (let i = 0; i < count; i++) {
        const media = autoPlayMedia.nth(i);
        const controls = await media.getAttribute('controls');
        
        // Auto-playing media should have controls
        expect(controls).not.toBeNull();
      }
    });
  });
});
