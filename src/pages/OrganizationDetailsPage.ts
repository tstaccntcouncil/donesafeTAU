import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class OrganizationDetailsPage extends BasePage {

  //readonly organizationDetailsForm: Locator;

  // Locators - Location Fields
  
  readonly nameField: Locator;
  readonly levelField: Locator;
  readonly parentField: Locator;
  readonly hoursWorkedField: Locator;
  readonly externalUuidField: Locator;

  private readonly fieldMap:  Record<string, Locator>;

  constructor(page: Page) {
    super(page);


    //this.organizationDetailsForm = page.locator('#ctl00_ContentPlaceHolder1_DetailsView1');

    this.nameField            = page.locator('input[placeholder="Name"]');
    this.levelField           = page.locator('input[placeholder="Level"]');
    this.parentField          = page.locator('#organisation-form-parent-organisation');
    this.hoursWorkedField     = page.locator('input[placeholder="Hours Worked per Month"]');
    this.externalUuidField     = page.locator('input[placeholder="External UUID"]');


    // Dynamic lookup maps
    this.fieldMap = {
      name: this.nameField,
      level: this.levelField, 
      parent:this.parentField,
      hoursWorked: this.hoursWorkedField,
      externalUuid: this.externalUuidField
    };

  }

  
    async isPageLoaded(): Promise<boolean> {
    try {
     
      const url = this.getCurrentUrl();
      console.log(`Checking page load — current URL: ${url}`);
      return url.includes('/organizations') || url.includes('/edit') || url.includes('/edit');
    } catch {
      return false;
    }
  }

   async assertFieldValue(fieldName: string, expectedValue: string): Promise<void> {
    const actual = await this.getFieldValue(fieldName);
    expect(actual, `Field "${fieldName}" value mismatch`).toBe(expectedValue);
  }

    async getFieldValue(fieldName: string): Promise<string> {
    return (await this.getField(fieldName).inputValue()).trim();
  }


    getField(fieldName: string): Locator {
    const locator = this.fieldMap[fieldName];
    if (!locator) throw new Error(`Unknown field: "${fieldName}". Valid fields: ${Object.keys(this.fieldMap).join(', ')}`);
    return locator;
  }
  




}


