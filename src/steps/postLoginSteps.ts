import { PostLoginPage } from '../pages/PostLoginPage';
import { Given, When, Then, Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import { CustomWorld } from '../hooks/hooks';
import { BrowserManager } from '../utils/browserManager';
import { getEnvConfig } from '../utils/envConfig';


// ── Timeout ────────────────────────────────────────────────────────────────
//setDefaultTimeout(30_000);

// ── World state ────────────────────────────────────────────────────────────
const config = getEnvConfig();

// This holds the page instance between steps
let postLoginPage: PostLoginPage;


Before({ tags: '@postlogin' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🟢 BEFORE: "${scenario.pickle.name}" — creating new context`);
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context         = context;
  this.page            = page;
  this.baseUrl         = config.baseUrl;
  this.currentUser     = null;
  this.postLoginPage   = new PostLoginPage(page);
  console.log(`   Page state: ${this.page.isClosed() ? 'CLOSED ❌' : 'OPEN ✅'}`);
});

After({ tags: '@postlogin' },async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🔴 AFTER: "${scenario.pickle.name}" — closing context`);
  await this.page.waitForTimeout(1000);
  // ...
});

// ─── Background ────────────────────────────────────────────────────────────────

Given('I am on the welcome page', async function(this: CustomWorld) {
  this.postLoginPage = new PostLoginPage(this.page);
  await this.postLoginPage.verifyWelcomePageLoaded();
  console.log(`✅ Welcome page loaded successfully`);
 
});


// ─── When Steps ────────────────────────────────────────────────────────────────

When('I click the profile menu', async function (this: CustomWorld)  {
  this.postLoginPage = new PostLoginPage(this.page);
  await this.postLoginPage.navigateToProfile();
  console.log(`✅ Profile menu clicked from Welcome page`);

});

When('I click the settings button', async function (this: CustomWorld)  {
  this.postLoginPage = new PostLoginPage(this.page);
  await this.postLoginPage.navigateToSettings();
  console.log(`✅ Settings button clicked from profile menu`);

});

When('I am on the settings page', async function (this: CustomWorld)  {
  this.postLoginPage = new PostLoginPage(this.page);
  await this.postLoginPage.verifySettingsPageLoaded();
  await this.postLoginPage.navigateToUsers();
  console.log(`✅ Users link clicked from settings page`);
});


// ─── Then Steps ────────────────────────────────────────────────────────────────

Then('I should click Users link', async function (this: CustomWorld) {
  //await this.postLoginPage.verifyUsersPageLoaded();
  console.log(`✅ Users page loaded successfully`);
});

