import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class UserDetailsPage extends BasePage {

 readonly userDetailsForm: Locator;

  // Locators - User Fields
  readonly employeeIdField: Locator;
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly emailField: Locator;
  readonly roleField: Locator;
  readonly managerField: Locator;
  readonly locationField: Locator;
  readonly organizationField: Locator;
  readonly userTypeField: Locator;

  private readonly fieldMap:  Record<string, Locator>;

  constructor(page: Page) {
    super(page);


    this.userDetailsForm = page.locator('#ctl00_ContentPlaceHolder1_DetailsView1');


    this.employeeIdField = page.locator('input[id*="user-external-id"]');
    this.firstNameField  = page.locator('input[placeholder="First Name"]');
    this.lastNameField   = page.locator('input[placeholder="Last Name"]');
    this.emailField      = page.locator('input[placeholder="Email Address"]');
    this.roleField       = page.locator('#role-selector');
    this.managerField    = page.locator('#tab-user-select-manager');
    this.locationField   = page.locator('#tab-user-select-location');
    this.organizationField = page.locator('#tab-user-select-select-home-organisation');
    this.userTypeField = page.locator('#user-details-user-type');


        // Dynamic lookup maps
    this.fieldMap = {
      employeeId:this.employeeIdField,
      firstName: this.firstNameField,
      lastName:  this.lastNameField,
      email:     this.emailField,
      role:      this.roleField,
      manager:   this.managerField,
      location:  this.locationField,
      organization: this.organizationField,
      userType: this.userTypeField
    };

  }

  
  
  async getUserEmail(): Promise<string> {
    return await this.emailField.inputValue();
  }

  async getUserFirstName(): Promise<string> {
    return await this.firstNameField.inputValue();
  }

  async getUserLastName(): Promise<string> {
    return await this.lastNameField.inputValue();
  }

    async isPageLoaded(): Promise<boolean> {
    try {
     
      const url = this.getCurrentUrl();
      console.log(`Checking page load — current URL: ${url}`);
      return url.includes('/user') || url.includes('/edit') || url.includes('/details');
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
    await expect(this.page).toHaveURL(/users/);
  }



}


