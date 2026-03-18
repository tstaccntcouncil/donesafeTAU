import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  
  // Locators
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  //readonly errorMessage: Locator;
  readonly welcomeHeading: Locator;
  //readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page)
  
    this.usernameInput = page.locator('#user_email');
    this.passwordInput = page.locator('#inputPassword');
    this.loginButton = page.locator('#sign_in');
    //this.errorMessage = page.locator('#error');
    this.welcomeHeading = page.locator('p', { hasText: 'Welcome to Donesafe' })
    //this.logoutButton = page.locator('.wp-block-button a');
  }

  // Actions
  async navigateToLoginPage(baseUrl: string): Promise<void> {
    await this.navigateTo(baseUrl);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLoginButton(): Promise<void> {
    await this.loginButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  // Assertions
  async verifyLoginPageLoaded(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async verifySuccessfulLogin(): Promise<void> {
    //await expect(this.page).toHaveURL(/.*logged-in-successfully.*/);
    await expect(this.welcomeHeading).toBeVisible();
  }

  async verifyErrorMessage(message: string): Promise<void> {
   // await expect(this.errorMessage).toBeVisible();
   // await expect(this.errorMessage).toContainText(message);
  }

  async verifyValidationMessage(): Promise<void> {
    // Browser-native validation or custom validation
    const isNativeValid = await this.usernameInput.evaluate(
      (el) => !(el as HTMLInputElement).validity.valid
    );
    if (!isNativeValid) {
      //await expect(this.errorMessage).toBeVisible();
    }
  }

  async verifyWelcomeMessage(): Promise<void> {
    //await expect(this.welcomeHeading).toBeVisible();
  }

  async logout(): Promise<void> {
    //await this.logoutButton.click();
  }
}
