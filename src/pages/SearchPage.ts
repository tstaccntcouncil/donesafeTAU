import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';


export class SearchPage extends BasePage {
  // Locators - Search Form
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);

    // Search form elements
    this.searchInput = page.locator('input[placeholder="Search Users"]');
   
   }

  async navigateToSearchPage(baseUrl: string): Promise<void> {
    await this.navigateTo(baseUrl);
    await this.waitForPageLoad();
  }

  async enterSearchEmail(email: string): Promise<void> {
    await this.waitForElement(this.searchInput);
    await this.fillInput(this.searchInput, email);
  }

  async enterSearchId(id: string): Promise<void> {
    await this.waitForElement(this.searchInput);
    await this.fillInput(this.searchInput, id);
  }

  async enterSearchFullName(fullName: string): Promise<void> {
    await this.waitForElement(this.searchInput);
    await this.fillInput(this.searchInput, fullName);
  }


  async waitForTableToLoad(text?: string): Promise<void> {
   await this.page.waitForLoadState('networkidle');
   
  if (text) {
    // Wait specifically for the email to appear in the table
    await this.page.locator('span', { hasText: text }).first().waitFor({ state: 'visible', timeout: 5000 });
    console.log(`✅ Full name "${text}" found in table`);
  } else {
    console.log(`✅ Full name "${text}" not found in table`);
  }

}


 async isEmailInResults(email: string): Promise<boolean> {

  const allCells = await this.page.locator('td > span > a').allInnerTexts();
  console.log('All td > span > a texts:', allCells);
  console.log('Looking for email:', email);

  const emailCells = this.page.locator(`td > span > a:has-text("${email}")`);
  console.log('Matching count:', await emailCells.count());

  return await emailCells.count() > 0;
}

 async isIdInResults(id: string): Promise<boolean> {

  const idCells = this.page.locator('td > span').filter({ hasText: id });
  const count = await idCells.count();
  console.log('Matching count:', count);
  return count > 0;
}

 async isFullNameInResults(fullName: string): Promise<boolean> {

  const fullNameCells = this.page.locator('span', { hasText: fullName });
  const count = await fullNameCells.count();
  console.log('Matching count:', count);
  return count > 0;
}


  async clickEditForRecord(fullName?: string): Promise<void> {
    let record: Locator;

    if (fullName) {
     
      await this.page.locator('div.simple-grid-td.simple-grid-td-full-name a').first().click()
      
    } else {
      
    }

      await this.waitForPageLoad();
  }

 


}
