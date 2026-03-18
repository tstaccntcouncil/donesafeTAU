import { Browser, BrowserContext, Page, chromium, firefox, webkit } from 'playwright';

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export class BrowserManager {
  private static browser: Browser;
  private static context: BrowserContext;
  private static page: Page;

  static async launchBrowser(browserType: BrowserType = 'chromium'): Promise<void> {
    const browserMap = { chromium, firefox, webkit };
    const isHeadless = process.env.HEADLESS === 'true';
    const slowMo = process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0;

    this.browser = await browserMap[browserType].launch({ headless: isHeadless, slowMo });
  }

  // ── Reuse the same context + page across scenarios ────────────────────
static async newScenarioPage(): Promise<{ context: BrowserContext; page: Page }> {
  if (!this.browser) {
    throw new Error('Browser not launched. Call launchBrowser() first.');
  }

  // ✅ Reuse existing context and page across scenarios
  if (!this.context) {
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720},
      ignoreHTTPSErrors: true,
      recordVideo:
        process.env.RECORD_VIDEO === 'true' ? { dir: 'reports/videos/' } : undefined,
    });
  }

  if (!this.page || this.page.isClosed()) {
    this.page = await this.context.newPage();
  }

  return { context: this.context, page: this.page };
}

  static async closeBrowser(): Promise<void> {
    if (this.browser) await this.browser.close();
  }
}