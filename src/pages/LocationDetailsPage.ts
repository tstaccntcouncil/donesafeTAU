import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LocationDetailsPage extends BasePage {

 readonly locationDetailsForm: Locator;

  // Locators - Location Fields
  readonly parentLocationField: Locator;
  readonly nameField: Locator;
  readonly addressLn1Field: Locator;
  readonly addressLn2Field: Locator;
  readonly suburbField: Locator;
  readonly stateField: Locator;
  readonly countryField: Locator;
  readonly postCodeField: Locator;
  readonly hoursWorkedField: Locator;
  readonly externalIdField: Locator;

  private readonly fieldMap:  Record<string, Locator>;

  constructor(page: Page) {
    super(page);


    this.locationDetailsForm = page.locator('#ctl00_ContentPlaceHolder1_DetailsView1');


    this.parentLocationField  = page.locator('#user-document-location-id');
    this.nameField            = page.locator('input[placeholder="Name"]');
    this.addressLn1Field      = page.locator('input[placeholder="Address Line 1"]');
    this.addressLn2Field      = page.locator('input[placeholder="Address Line 2"]');
    this.suburbField          = page.locator('input[placeholder="Suburb"]');
    this.stateField           = page.locator('input[placeholder="State"]');
    this.countryField         = page.locator('input[placeholder="Country"]');
    this.postCodeField        = page.locator('input[placeholder="Postcode"]');
    this.hoursWorkedField     = page.locator('input[placeholder="Hours Worked per Month"]');
    this.externalIdField      = page.locator('input[name="external_uuid"]');


    // Dynamic lookup maps
    this.fieldMap = {
      parentLocation:this.parentLocationField,
      name: this.nameField,
      addressLn1: this.addressLn1Field,
      addressLn2: this.addressLn2Field,
      suburb: this.suburbField,
      state: this.stateField,
      country: this.countryField,
      postCode: this.postCodeField,
      hoursWorked: this.hoursWorkedField,
      externalId: this.externalIdField
    };

  }

  
    async isPageLoaded(): Promise<boolean> {
    try {
     
      const url = this.getCurrentUrl();
      console.log(`Checking page load — current URL: ${url}`);
      return url.includes('/locations') || url.includes('/edit') || url.includes('/details');
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
  
    async navigate(): Promise<void> {
    await expect(this.page).toHaveURL(/locations/);
  }



}


