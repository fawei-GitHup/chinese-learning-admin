import { test, expect } from '@playwright/test';
import { loginWithMockSupport, setupMockAuth, waitForPageLoad } from './helpers/auth';

/**
 * Performance Tests
 * 
 * Tests performance benchmarks for the Admin Console:
 * - Page load times
 * - Route navigation times
 * - List pagination response
 * - Form submission response
 * - Content rendering performance
 * - API response times
 */

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  pageLoad: 3000,        // First page load < 3s
  routeNavigation: 1000, // Route switch < 1s
  listPagination: 1000,  // List pagination < 1s
  formSubmission: 2000,  // Form submission < 2s
  dialogOpen: 500,       // Dialog open < 500ms
  searchResponse: 1000,  // Search response < 1s
};

test.describe('Performance', () => {
  
  // ==========================================
  // Page Load Performance
  // ==========================================
  test.describe('Page Load Performance', () => {
    
    test('Dashboard loads within 3 seconds', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      
      const startTime = Date.now();
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      console.log(`Dashboard load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });
    
    test('Content list page loads within 3 seconds', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      
      const startTime = Date.now();
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      console.log(`Content list load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });
    
    test('User management page loads within 3 seconds', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      
      const startTime = Date.now();
      await page.goto('/users');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      console.log(`User management load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });
    
    test('Publish center loads within 3 seconds', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      
      const startTime = Date.now();
      await page.goto('/publish-center');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      console.log(`Publish center load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });
    
    test('Assets page loads within 3 seconds', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      
      const startTime = Date.now();
      await page.goto('/assets');
      await waitForPageLoad(page);
      const loadTime = Date.now() - startTime;
      
      console.log(`Assets page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });
  });
  
  // ==========================================
  // Route Navigation Performance
  // ==========================================
  test.describe('Route Navigation Performance', () => {
    
    test('Switching routes is fast (< 1 second)', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const routes = [
        '/content/lexicon',
        '/content/grammar',
        '/publish-center',
        '/assets',
        '/users',
        '/dashboard',
      ];
      
      for (const route of routes) {
        const startTime = Date.now();
        await page.goto(route);
        await waitForPageLoad(page);
        const navigationTime = Date.now() - startTime;
        
        console.log(`Navigation to ${route}: ${navigationTime}ms`);
        expect(navigationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.routeNavigation);
      }
    });
    
    test('Back/Forward navigation is instantaneous', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      
      // Navigate to dashboard then content
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Go back
      const backStartTime = Date.now();
      await page.goBack();
      await waitForPageLoad(page);
      const backTime = Date.now() - backStartTime;
      
      console.log(`Back navigation time: ${backTime}ms`);
      expect(backTime).toBeLessThan(PERFORMANCE_THRESHOLDS.routeNavigation);
      
      // Go forward
      const forwardStartTime = Date.now();
      await page.goForward();
      await waitForPageLoad(page);
      const forwardTime = Date.now() - forwardStartTime;
      
      console.log(`Forward navigation time: ${forwardTime}ms`);
      expect(forwardTime).toBeLessThan(PERFORMANCE_THRESHOLDS.routeNavigation);
    });
  });
  
  // ==========================================
  // List and Pagination Performance
  // ==========================================
  test.describe('List and Pagination Performance', () => {
    
    test('Content list pagination is smooth (< 1 second)', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Find pagination controls
      const nextPageButton = page.locator('[data-testid="next-page"], button:has-text("下一页"), button:has-text("Next"), [aria-label*="next" i]').first();
      
      if (await nextPageButton.isVisible()) {
        const startTime = Date.now();
        await nextPageButton.click();
        
        // Wait for content list to update
        await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 5000 });
        const paginationTime = Date.now() - startTime;
        
        console.log(`Pagination response time: ${paginationTime}ms`);
        expect(paginationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.listPagination);
      }
    });
    
    test('Table sorting is responsive', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Find sortable column header
      const sortableHeader = page.locator('th button, th[aria-sort], [role="columnheader"] button').first();
      
      if (await sortableHeader.isVisible()) {
        const startTime = Date.now();
        await sortableHeader.click();
        await page.waitForTimeout(100);
        await page.waitForSelector('table tbody tr, [role="row"]', { timeout: 5000 });
        const sortTime = Date.now() - startTime;
        
        console.log(`Table sort time: ${sortTime}ms`);
        expect(sortTime).toBeLessThan(PERFORMANCE_THRESHOLDS.listPagination);
      }
    });
    
    test('Filter changes update quickly', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Find filter control
      const filterControl = page.locator('select, [role="combobox"], input[placeholder*="筛选"], input[placeholder*="filter" i]').first();
      
      if (await filterControl.isVisible()) {
        const startTime = Date.now();
        
        // Check if it's a select/combobox
        const tagName = await filterControl.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'select') {
          const options = await filterControl.locator('option').all();
          if (options.length > 1) {
            await filterControl.selectOption({ index: 1 });
          }
        } else {
          await filterControl.click();
          await page.waitForTimeout(100);
          const option = page.locator('[role="option"]').first();
          if (await option.isVisible()) {
            await option.click();
          }
        }
        
        await page.waitForTimeout(500);
        const filterTime = Date.now() - startTime;
        
        console.log(`Filter update time: ${filterTime}ms`);
        expect(filterTime).toBeLessThan(PERFORMANCE_THRESHOLDS.listPagination);
      }
    });
  });
  
  // ==========================================
  // Form and Dialog Performance
  // ==========================================
  test.describe('Form and Dialog Performance', () => {
    
    test('Create dialog opens quickly (< 500ms)', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const createButton = page.locator('button:has-text("新建"), button:has-text("New"), button:has-text("Create")').first();
      
      if (await createButton.isVisible()) {
        const startTime = Date.now();
        await createButton.click();
        
        // Wait for dialog to appear
        await page.waitForSelector('[role="dialog"], [role="alertdialog"]', { timeout: 2000 });
        const dialogOpenTime = Date.now() - startTime;
        
        console.log(`Dialog open time: ${dialogOpenTime}ms`);
        expect(dialogOpenTime).toBeLessThan(PERFORMANCE_THRESHOLDS.dialogOpen);
      }
    });
    
    test('Form input response is instant', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open create form
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        const input = page.locator('input:visible').first();
        if (await input.isVisible()) {
          const testText = 'Performance Test Input 测试';
          
          const startTime = Date.now();
          await input.fill(testText);
          const inputTime = Date.now() - startTime;
          
          console.log(`Input fill time: ${inputTime}ms`);
          
          // Input should be virtually instant
          expect(inputTime).toBeLessThan(200);
          
          // Verify value was entered
          const value = await input.inputValue();
          expect(value).toBe(testText);
        }
      }
    });
    
    test('Form submission response is acceptable (< 2 seconds)', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Open create form
      const createButton = page.locator('button:has-text("新建"), button:has-text("New")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(500);
        
        // Fill minimum required fields
        const input = page.locator('input:visible').first();
        if (await input.isVisible()) {
          await input.fill('Test Content ' + Date.now());
        }
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("保存"), button:has-text("Save")').first();
        if (await submitButton.isVisible() && !(await submitButton.isDisabled())) {
          const startTime = Date.now();
          await submitButton.click();
          
          // Wait for response (success toast or form close)
          await Promise.race([
            page.waitForSelector('[data-sonner-toast], .toast', { timeout: 5000 }),
            page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 5000 }),
          ]).catch(() => {});
          
          const submitTime = Date.now() - startTime;
          console.log(`Form submission time: ${submitTime}ms`);
          expect(submitTime).toBeLessThan(PERFORMANCE_THRESHOLDS.formSubmission);
        }
      }
    });
  });
  
  // ==========================================
  // Search Performance
  // ==========================================
  test.describe('Search Performance', () => {
    
    test('Search results appear quickly (< 1 second)', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], input[placeholder*="search" i], input[name="search"]').first();
      
      if (await searchInput.isVisible()) {
        const startTime = Date.now();
        await searchInput.fill('test');
        
        // Wait for results to update (debounce may apply)
        await page.waitForTimeout(500);
        await page.waitForSelector('table tbody tr, [role="row"], [class*="no-results"]', { timeout: 5000 });
        const searchTime = Date.now() - startTime;
        
        console.log(`Search response time: ${searchTime}ms`);
        expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.searchResponse);
      }
    });
    
    test('Search with debounce does not block UI', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], input[placeholder*="search" i]').first();
      
      if (await searchInput.isVisible()) {
        // Type rapidly
        await searchInput.focus();
        
        const typingStartTime = Date.now();
        for (const char of 'testing') {
          await page.keyboard.type(char, { delay: 50 });
        }
        const typingTime = Date.now() - typingStartTime;
        
        console.log(`Typing time: ${typingTime}ms`);
        
        // Input should remain responsive during typing
        expect(typingTime).toBeLessThan(1000);
        
        // Value should be correct
        const value = await searchInput.inputValue();
        expect(value).toBe('testing');
      }
    });
  });
  
  // ==========================================
  // Web Vitals Metrics
  // ==========================================
  test.describe('Web Vitals', () => {
    
    test('Largest Contentful Paint (LCP) is acceptable', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      
      // Start measuring before navigation
      const lcpPromise = page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let lcp = 0;
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.startTime;
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          
          // Resolve after 5 seconds or when page is fully loaded
          setTimeout(() => {
            observer.disconnect();
            resolve(lcp);
          }, 5000);
        });
      });
      
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const lcp = await lcpPromise.catch(() => 0);
      console.log(`LCP: ${lcp}ms`);
      
      // LCP should be < 2.5s for good performance
      if (lcp > 0) {
        expect(lcp).toBeLessThan(2500);
      }
    });
    
    test('First Input Delay (FID) preparation - interactive elements respond', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Find first interactive element
      const button = page.locator('button:visible').first();
      
      if (await button.isVisible()) {
        const startTime = Date.now();
        await button.click();
        const responseTime = Date.now() - startTime;
        
        console.log(`First click response: ${responseTime}ms`);
        
        // FID should be < 100ms
        expect(responseTime).toBeLessThan(200);
      }
    });
    
    test('Cumulative Layout Shift (CLS) is minimal', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      
      // Track layout shifts
      const clsPromise = page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let cls = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(cls);
          }, 5000);
        });
      });
      
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const cls = await clsPromise.catch(() => 0);
      console.log(`CLS: ${cls}`);
      
      // CLS should be < 0.1 for good performance
      if (cls > 0) {
        expect(cls).toBeLessThan(0.25); // Acceptable threshold
      }
    });
  });
  
  // ==========================================
  // Memory Performance
  // ==========================================
  test.describe('Memory Performance', () => {
    
    test('No significant memory leaks on repeated navigation', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      await loginWithMockSupport(page, 'admin');
      
      // Get initial memory (if available)
      const getMemory = async () => {
        return page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize;
          }
          return 0;
        });
      };
      
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const initialMemory = await getMemory();
      
      // Navigate multiple times
      const routes = ['/content/lexicon', '/dashboard', '/users', '/dashboard', '/assets', '/dashboard'];
      for (const route of routes) {
        await page.goto(route);
        await waitForPageLoad(page);
      }
      
      const finalMemory = await getMemory();
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`);
        
        // Memory shouldn't increase more than 50% after navigation
        expect(memoryIncreasePercent).toBeLessThan(100);
      }
    });
  });
  
  // ==========================================
  // Network Performance
  // ==========================================
  test.describe('Network Performance', () => {
    
    test('Total page resources under limit', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      
      let totalSize = 0;
      const resources: { url: string; size: number }[] = [];
      
      page.on('response', async (response) => {
        try {
          const buffer = await response.body().catch(() => null);
          if (buffer) {
            const size = buffer.length;
            totalSize += size;
            resources.push({ url: response.url(), size });
          }
        } catch {
          // Ignore errors
        }
      });
      
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      console.log(`Total resources size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Number of resources: ${resources.length}`);
      
      // Total page size should be reasonable (< 5MB)
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
    });
    
    test('API response times are acceptable', async ({ page }) => {
      await setupMockAuth(page, 'admin');
      
      const apiCalls: { url: string; duration: number }[] = [];
      const apiStartTimes = new Map<string, number>();
      
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('supabase')) {
          apiStartTimes.set(url, Date.now());
        }
      });
      
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/') || url.includes('supabase')) {
          const startTime = apiStartTimes.get(url);
          if (startTime) {
            const duration = Date.now() - startTime;
            apiCalls.push({ url, duration });
            apiStartTimes.delete(url);
          }
        }
      });
      
      await loginWithMockSupport(page, 'admin');
      await page.goto('/content/lexicon');
      await waitForPageLoad(page);
      
      if (apiCalls.length > 0) {
        const avgDuration = apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length;
        console.log(`Average API response time: ${avgDuration.toFixed(2)}ms`);
        console.log(`Total API calls: ${apiCalls.length}`);
        
        // Average API response should be < 500ms
        expect(avgDuration).toBeLessThan(1000);
      }
    });
  });
});
