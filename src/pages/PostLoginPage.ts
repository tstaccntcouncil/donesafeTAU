import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostLoginPage extends BasePage {

    readonly profileMenuItem: Locator;
    readonly settingsMenuItem: Locator;
    readonly usersMenuItem: Locator;
    readonly welcomeHeading: Locator;

  constructor(page: Page) {
    super(page)

    this.profileMenuItem = page.locator('li > a#header-profile-dropdown-link');
    this.settingsMenuItem = page.locator('li[tabindex="-1"] > a[href="/admin/settings"]');
    this.usersMenuItem = page.locator('a[href="/admin/settings/users"]');
    this.welcomeHeading = page.locator('p', { hasText: 'Incidents or Hazards' })

  }

    // ─── Actions ────────────────────────────────────────────────────────────────

  async navigateToProfile(): Promise<void> {
    await this.profileMenuItem.click();
    //await this.page.waitForLoadState('domcontentloaded');
  }

  async navigateToSettings(): Promise<void> {
    // Click a "Settings" link that exists in the post-login nav
    await this.settingsMenuItem.click();
    //await this.page.waitForLoadState('domcontentloaded');
  }

  async navigateToUsers(): Promise<void> {
    await this.usersMenuItem.isVisible();
    await this.usersMenuItem.click();
      //await this.page.waitForLoadState('domcontentloaded');
  }

  
  // ─── Assertions ─────────────────────────────────────────────────────────────

  async verifyWelcomePageLoaded(): Promise<void> {
  await expect(this.welcomeHeading).toBeVisible();
  }

  async verifySettingsPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*settings.*/);
  }

  async verifyUsersPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*users.*/);
  }
}