import { LoginPage } from '../pages/LoginPage';
import { Given, When, Then, Before, After, ITestCaseHookParameter } from '@cucumber/cucumber';
import { CustomWorld } from '../hooks/hooks';
import { getEnvConfig } from '../utils/envConfig';
import { BrowserManager } from '../utils/browserManager';

// This holds the page instance between steps
let loginPage: LoginPage;
const config = getEnvConfig();

Before({ tags: '@login' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🟢 BEFORE: "${scenario.pickle.name}" — creating new context`);
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context         = context;
  this.page            = page;
  this.baseUrl         = config.baseUrl;
  this.currentUser     = null;
  this.loginPage   = new LoginPage(page);
  console.log(`   Page state: ${this.page.isClosed() ? 'CLOSED ❌' : 'OPEN ✅'}`);
});

After({ tags: '@login' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🔴 AFTER: "${scenario.pickle.name}" — closing context`);
  await this.page.waitForTimeout(1000);
  // ...
});

// ─── Background ────────────────────────────────────────────────────────────────

Given('I am on the login page', async function(this: CustomWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.navigateToLoginPage(this.baseUrl);
  await this.loginPage.verifyLoginPageLoaded();
});

// ─── When Steps ────────────────────────────────────────────────────────────────

function resolveEnvVar(value: string): string {
  const match = value.match(/^\$\{(\w+)\}$/);
  if (match) {
    const envValue = process.env[match[1]];
    if (!envValue) throw new Error(`Environment variable "${match[1]}" is not set`);
    return envValue;
  }
  return value;
}

When('I enter username {string}', async function (this: CustomWorld, username: string)  {
  this.loginPage = new LoginPage(this.page);
  const resolved = resolveEnvVar(username);
  console.log(`Resolved username: ${resolved}`);
  await this.loginPage.enterUsername(resolved);
});

When('I enter password {string}', async function (this: CustomWorld, password: string) {
  this.loginPage = new LoginPage(this.page);
  const resolved = resolveEnvVar(password);
  console.log(`Resolved password: ${'*'.repeat(resolved.length)}`);
  await this.loginPage.enterPassword(resolved);
});

When('I click the login button', async function (this: CustomWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.clickLoginButton();
});

// ─── Then Steps ────────────────────────────────────────────────────────────────

Then('I should be redirected to the dashboard', async function (this: CustomWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.verifySuccessfulLogin();
});


Then('I should see the welcome page', async function (this: CustomWorld) {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.verifyWelcomeMessage();
});

/*
Then('I should see an error message {string}', async ({ loginPage: lp }, message: string) => {
  await lp.verifyErrorMessage(message);
});

Then('I should see a validation message', async ({ loginPage: lp }) => {
  await lp.verifyValidationMessage();
});
*/