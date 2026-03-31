import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrganizationSearchPage extends BasePage {

    readonly profileMenuItem: Locator;
    readonly settingsMenuItem: Locator;
    readonly organizationsMenuItem: Locator;
    readonly searchInput: Locator;

  constructor(page: Page) {
    super(page)

    this.profileMenuItem = page.locator('li > a#header-profile-dropdown-link');
    this.settingsMenuItem = page.locator('li[tabindex="-1"] > a[href="/admin/settings"]');
    this.organizationsMenuItem = page.locator('a[href="/admin/settings/organizations"]');
    this.searchInput = page.locator('input[placeholder="Search Organizations"]');

  }

    // ─── Actions ────────────────────────────────────────────────────────────────

  async navigateToProfile(): Promise<void> {
    await this.profileMenuItem.click();
  }

  async navigateToSettings(): Promise<void> {
      await this.settingsMenuItem.click();
  }

  async navigateToOrganizations(): Promise<void> {
    await this.organizationsMenuItem.isVisible();
    await this.organizationsMenuItem.click();
  }

  async enterSearchOrganizationName(organizationName: string): Promise<void> {
    await this.waitForElement(this.searchInput);
    await this.fillInput(this.searchInput, organizationName);
  }

  async waitForTableToLoad(text?: string): Promise<void> {
   await this.page.waitForLoadState('networkidle');

  console.log(`✅ Text to find in table: "${text}"`);
   
  if (text) {
    await this.page.locator('a', { hasText: text }).first().waitFor({ state: 'visible' });
    console.log(`✅ Organization name "${text}" found in table`);
  } else {
    console.log(`✅ Organization name "${text}" not found in table`);
  }
}


  // ─── Assertions ─────────────────────────────────────────────────────────────

  async verifyAccountProfileExists(): Promise<void> {
  await expect(this.profileMenuItem).toBeVisible();
  }

  async verifySettingsPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*settings.*/);
  }

  async verifyOrganizationsPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*organizations.*/);
  }

  async isOrganizationNameInResults(organizationName: string): Promise<boolean> {

  const organizationNameCells = this.page.locator('a', { hasText: organizationName });
  const count = await organizationNameCells.count();
  console.log('Matching count:', count);
  return count > 0;
  }

  async clickEditForRecord(organizationName?: string): Promise<void> {
  let record: Locator;

    if (organizationName) {
     
     await this.page.locator('.simple-grid-td-name a', { hasText: organizationName }).first().click();
      
    } else {
      
    }

      await this.waitForPageLoad();
  }

}