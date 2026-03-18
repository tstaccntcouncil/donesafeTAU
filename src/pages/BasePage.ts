import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  protected defaultTimeout: number;

  constructor(page: Page, timeout = 30000) {
    this.page = page;
    this.defaultTimeout = timeout;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async waitForElement(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: timeout ?? this.defaultTimeout });
  }

  async clickElement(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.click();
  }

  async fillInput(locator: Locator, value: string): Promise<void> {
    await this.waitForElement(locator);
    await locator.clear();
    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    await this.waitForElement(locator);
    return (await locator.textContent()) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async assertVisible(locator: Locator, message?: string): Promise<void> {
    await expect(locator, message).toBeVisible({ timeout: this.defaultTimeout });
  }

  async assertText(locator: Locator, expectedText: string): Promise<void> {
    await expect(locator).toContainText(expectedText, { timeout: this.defaultTimeout });
  }

  async assertUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl, { timeout: this.defaultTimeout });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
