import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * For Admin Console UI - Cross-Platform Acceptance Testing
 * 
 * Supports:
 * - Desktop Browsers: Chrome, Firefox, Safari (WebKit), Edge
 * - Mobile Devices: Pixel 5 (Android), iPhone 12 (iOS)
 * - Tablet: iPad (gen 7)
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'on-first-retry',
    
    // Timeout for each action
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },
  
  // Test timeout
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 10000,
  },
  
  // Configure projects for browsers and devices
  projects: [
    // ==========================================
    // Setup project - run authentication setup before tests
    // ==========================================
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // ==========================================
    // Desktop Browsers
    // ==========================================
    
    // Chrome (Chromium)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Safari (WebKit)
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Microsoft Edge
    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge',
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // ==========================================
    // Mobile Devices
    // ==========================================
    
    // Android - Pixel 5 (Chrome)
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // iOS - iPhone 12 (Safari)
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // ==========================================
    // Tablet Devices
    // ==========================================
    
    // iPad Portrait
    {
      name: 'iPad',
      use: { 
        ...devices['iPad (gen 7)'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // iPad Landscape
    {
      name: 'iPad Landscape',
      use: { 
        ...devices['iPad (gen 7) landscape'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  
  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  // Output folder for test artifacts
  outputDir: 'test-results',
});
