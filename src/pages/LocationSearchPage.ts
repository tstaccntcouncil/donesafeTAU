import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LocationSearchPage extends BasePage {

    readonly profileMenuItem: Locator;
    readonly settingsMenuItem: Locator;
    readonly locationsMenuItem: Locator;
    readonly searchInput: Locator;

  constructor(page: Page) {
    super(page)

    this.profileMenuItem = page.locator('li > a#header-profile-dropdown-link');
    this.settingsMenuItem = page.locator('li[tabindex="-1"] > a[href="/admin/settings"]');
    this.locationsMenuItem = page.locator('a[href="/admin/settings/locations"]');
    this.searchInput = page.locator('input[placeholder="Search Locations"]');

  }

    // ─── Actions ────────────────────────────────────────────────────────────────

  async navigateToProfile(): Promise<void> {
    await this.profileMenuItem.click();
  }

  async navigateToSettings(): Promise<void> {
    // Click a "Settings" link that exists in the post-login nav
    await this.settingsMenuItem.click();
  }

  async navigateToLocations(): Promise<void> {
    await this.locationsMenuItem.isVisible();
    await this.locationsMenuItem.click();
  }

  async enterSearchLocationName(locationName: string): Promise<void> {
    await this.waitForElement(this.searchInput);
    await this.fillInput(this.searchInput, locationName);
  }

  async waitForTableToLoad(text?: string): Promise<void> {
   await this.page.waitForLoadState('networkidle');

  console.log(`✅ Text to find in table: "${text}"`);
   
  if (text) {
    // Wait specifically for the email to appear in the table
    await this.page.locator('a', { hasText: text }).first().waitFor({ state: 'visible' });
    console.log(`✅ Location name "${text}" found in table`);
  } else {
    console.log(`✅ Location name "${text}" not found in table`);
  }
}


  // ─── Assertions ─────────────────────────────────────────────────────────────

  async verifyAccountProfileExists(): Promise<void> {
  await expect(this.profileMenuItem).toBeVisible();
  }

  async verifySettingsPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*settings.*/);
  }

  async verifyLocationsPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*locations.*/);
  }

  async isLocationNameInResults(locationName: string): Promise<boolean> {

  const locationNameCells = this.page.locator('a', { hasText: locationName });
  const count = await locationNameCells.count();
  console.log('Matching count:', count);
  return count > 0;
  }

  async clickEditForRecord(locationName?: string): Promise<void> {
  let record: Locator;

    if (locationName) {
     
     await this.page.locator('.simple-grid-td-name a', { hasText: locationName }).first().click();
      
    } else {
      
    }

      await this.waitForPageLoad();
  }

}