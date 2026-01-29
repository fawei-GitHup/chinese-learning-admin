import { test as base, expect, Page, Browser } from '@playwright/test';
import { 
  loginWithMockSupport, 
  setupMockAuth, 
  clearAuthState,
  waitForPageLoad,
  UserRole,
} from './auth';

/**
 * Extended test fixtures for role-based testing
 * 
 * Usage:
 * import { test, expect } from './helpers/fixtures';
 * 
 * test('admin can do something', async ({ adminPage }) => {
 *   // adminPage is already logged in as admin
 * });
 */

// Define custom fixtures types
interface CustomFixtures {
  adminPage: Page;
  editorPage: Page;
  viewerPage: Page;
  authenticatedPage: Page;
}

/**
 * Extended test with role-based page fixtures
 */
export const test = base.extend<CustomFixtures>({
  // Admin role page - logged in as admin
  adminPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Setup mock auth and login
    await page.goto('/admin/login');
    await setupMockAuth(page, 'admin');
    await loginWithMockSupport(page, 'admin');
    await waitForPageLoad(page);
    
    await use(page);
    
    // Cleanup
    await clearAuthState(page);
    await context.close();
  },
  
  // Editor role page - logged in as editor
  editorPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/admin/login');
    await setupMockAuth(page, 'editor');
    await loginWithMockSupport(page, 'editor');
    await waitForPageLoad(page);
    
    await use(page);
    
    await clearAuthState(page);
    await context.close();
  },
  
  // Viewer role page - logged in as viewer
  viewerPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/admin/login');
    await setupMockAuth(page, 'viewer');
    await loginWithMockSupport(page, 'viewer');
    await waitForPageLoad(page);
    
    await use(page);
    
    await clearAuthState(page);
    await context.close();
  },
  
  // Generic authenticated page (defaults to admin)
  authenticatedPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/admin/login');
    await setupMockAuth(page, 'admin');
    await loginWithMockSupport(page, 'admin');
    await waitForPageLoad(page);
    
    await use(page);
    
    await clearAuthState(page);
    await context.close();
  },
});

// Re-export expect
export { expect };

/**
 * Test data for content management tests
 */
export const TEST_CONTENT = {
  lexicon: {
    valid: {
      term: 'Test Term 测试术语',
      pinyin: 'cè shì shù yǔ',
      definition: 'A test term for E2E testing purposes',
      say_it_like: ['Use it like this', 'Another example'],
      dont_say: ['Avoid this', 'Also avoid this'],
      collocations: ['test + term', 'term + example'],
    },
    invalid: {
      term: '', // Empty term should fail
      pinyin: 'test',
      definition: '',
    },
  },
  
  grammar: {
    valid: {
      title: 'Test Grammar Pattern',
      pattern: 'Subject + Verb + Object',
      explanation: 'Basic sentence structure in Chinese',
      examples: ['我吃饭', '他喝水'],
    },
  },
  
  scenario: {
    valid: {
      title: 'Test Scenario',
      description: 'A test scenario for E2E testing',
      dialogs: [
        { speaker: 'A', text: '你好！' },
        { speaker: 'B', text: '你好！很高兴认识你。' },
      ],
    },
  },
};

/**
 * Test data for publishing settings
 */
export const TEST_PUBLISHING = {
  complete: {
    slug: 'test-complete-slug',
    status: 'draft',
    seo: {
      title: 'SEO Title for Testing',
      description: 'SEO description that is detailed enough for publishing requirements.',
    },
    geo: {
      snippet: 'GEO snippet content for testing purposes.',
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
    },
    faq: [
      { question: 'What is this?', answer: 'This is a test FAQ entry.' },
      { question: 'How does it work?', answer: 'It works for testing.' },
    ],
  },
  
  incomplete: {
    slug: '',
    status: 'draft',
    seo: {
      title: '', // Missing SEO title
      description: '',
    },
    geo: {
      snippet: '', // Missing GEO
      keyPoints: [],
    },
    faq: [],
  },
};

/**
 * Route paths for testing
 */
export const ROUTES = {
  // Public routes (no auth required)
  public: {
    login: '/admin/login',
    forbidden: '/admin/403',
  },
  
  // Protected routes (all roles)
  allRoles: {
    dashboard: '/dashboard',
    content: {
      lexicon: '/content/lexicon',
      grammar: '/content/grammar',
      scenarios: '/content/scenarios',
      medicalLexicon: '/content/medical-lexicon',
      medicalDialogs: '/content/medical-dialogs',
      readings: '/content/readings',
      lessons: '/content/lessons',
    },
    publishCenter: '/publish-center',
    seo: '/seo',
    assets: '/assets',
  },
  
  // Admin only routes
  adminOnly: {
    users: '/users',
    settings: '/settings',
    allowlist: '/settings/allowlist',
  },
};

/**
 * Permission matrix for testing
 * Defines what each role can do
 */
export const PERMISSIONS: Record<UserRole, {
  canView: string[];
  canCreate: string[];
  canEdit: string[];
  canDelete: string[];
  canPublish: string[];
  canManageUsers: boolean;
  canManageAllowlist: boolean;
}> = {
  admin: {
    canView: ['dashboard', 'content', 'users', 'settings', 'publish-center', 'assets'],
    canCreate: ['lexicon', 'grammar', 'scenario', 'medical-lexicon'],
    canEdit: ['lexicon', 'grammar', 'scenario', 'medical-lexicon'],
    canDelete: ['lexicon', 'grammar', 'scenario', 'medical-lexicon', 'asset'],
    canPublish: ['lexicon', 'grammar', 'scenario', 'medical-lexicon'],
    canManageUsers: true,
    canManageAllowlist: true,
  },
  editor: {
    canView: ['dashboard', 'content', 'publish-center', 'assets'],
    canCreate: ['lexicon', 'grammar', 'scenario', 'medical-lexicon'],
    canEdit: ['lexicon', 'grammar', 'scenario', 'medical-lexicon'],
    canDelete: [],
    canPublish: ['lexicon', 'grammar', 'scenario', 'medical-lexicon'],
    canManageUsers: false,
    canManageAllowlist: false,
  },
  viewer: {
    canView: ['dashboard', 'content', 'publish-center', 'assets'],
    canCreate: [],
    canEdit: [],
    canDelete: [],
    canPublish: [],
    canManageUsers: false,
    canManageAllowlist: false,
  },
};

/**
 * UI selectors for common elements
 */
export const SELECTORS = {
  // Navigation
  sidebar: '[data-testid="sidebar"], nav',
  topbar: '[data-testid="topbar"], header',
  
  // Buttons
  createButton: 'button:has-text("新建"), button:has-text("New"), button:has-text("Create")',
  editButton: 'button:has-text("编辑"), button:has-text("Edit")',
  deleteButton: 'button:has-text("删除"), button:has-text("Delete")',
  publishButton: 'button:has-text("发布"), button:has-text("Publish")',
  saveButton: 'button:has-text("保存"), button:has-text("Save")',
  cancelButton: 'button:has-text("取消"), button:has-text("Cancel")',
  
  // Forms
  form: 'form',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  checkbox: 'input[type="checkbox"]',
  
  // Table
  table: 'table',
  tableRow: 'tr',
  tableCell: 'td',
  
  // Dialog
  dialog: '[role="dialog"]',
  dialogTitle: '[role="dialog"] h2, [role="alertdialog"] h2',
  dialogConfirm: '[role="dialog"] button:has-text("确认"), [role="dialog"] button:has-text("Confirm")',
  dialogCancel: '[role="dialog"] button:has-text("取消"), [role="dialog"] button:has-text("Cancel")',
  
  // Status
  loadingSpinner: '[data-loading], .animate-spin',
  successToast: '[data-sonner-toast][data-type="success"]',
  errorToast: '[data-sonner-toast][data-type="error"]',
  
  // Content specific
  contentDrawer: '[role="dialog"]',
  publishingPanel: '[data-testid="publishing-panel"]',
};

/**
 * Helper to wait for toast message
 */
export async function waitForToast(page: Page, type: 'success' | 'error' = 'success') {
  const selector = type === 'success' ? SELECTORS.successToast : SELECTORS.errorToast;
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 10000 });
}

/**
 * Helper to close any open dialogs
 */
export async function closeAllDialogs(page: Page) {
  const closeButtons = page.locator(`${SELECTORS.dialog} button[aria-label="Close"]`);
  const count = await closeButtons.count();
  
  for (let i = 0; i < count; i++) {
    await closeButtons.nth(i).click().catch(() => {});
  }
  
  // Also try pressing Escape
  await page.keyboard.press('Escape').catch(() => {});
}

/**
 * Helper to check button state
 */
export async function isButtonEnabled(page: Page, buttonSelector: string): Promise<boolean> {
  const button = page.locator(buttonSelector).first();
  const isDisabled = await button.isDisabled().catch(() => true);
  return !isDisabled;
}

/**
 * Helper to check if element is visible
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  return page.locator(selector).first().isVisible({ timeout: 5000 }).catch(() => false);
}
