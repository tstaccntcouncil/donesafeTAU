import { Given, When, Then, Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../hooks/hooks';
import { SearchPage } from '../pages/SearchPage';
import { BrowserManager } from '../utils/browserManager';
import { UserDetailsPage } from '../pages/UserDetailsPage';
import { testData, UserRecord } from '../data/testDataLoader';
import { getEnvConfig } from '../utils/envConfig';


let searchPage: SearchPage;
const config = getEnvConfig();
let userDetailsPage: UserDetailsPage;

Before({ tags: '@search' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🟢 BEFORE: "${scenario.pickle.name}" — creating new context`);
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context         = context;
  this.page            = page;
  this.baseUrl         = config.baseUrl;
  this.currentUser     = null;
  this.searchPage      = new SearchPage(page);
  this.userDetailsPage = new UserDetailsPage(page);
  console.log(`   Page state: ${this.page.isClosed() ? 'CLOSED ❌' : 'OPEN ✅'}`);
});

After({ tags: '@search' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🔴 AFTER: "${scenario.pickle.name}" — closing context`);
  await this.page.waitForTimeout(1000);
  // ...
});

function resolveUser(world: CustomWorld): UserRecord {
  if (!world.currentUser) {
    throw new Error('No current user set in world. Call a search step first.');
  }
  return world.currentUser;
}


// ── Given ────────────────────────────────────────────────────────────────────

Given('I am on the search page', async function (this: CustomWorld) {
  this.searchPage = new SearchPage(this.page);
  //await this.searchPage.navigateToSearchPage(this.baseUrl);
  console.log(`✅ Search page is shown`);
});

// ── When ─────────────────────────────────────────────────────────────────────

When('I search for the default fullname', async function (this: CustomWorld) {
  this.currentUser = testData.getDefaultUser();

  console.log(`📂 Test data loaded — fullname: ${this.currentUser.fullName}`);
  await this.searchPage.enterSearchFullName(this.currentUser.fullName);
  console.log(`✅ Entered fullname: ${this.currentUser.fullName}`);

});


When('I see the default fullname in the results', async function (this: CustomWorld) {
  const user = resolveUser(this);
  await this.searchPage.waitForTableToLoad(user.fullName);
  
  const isVisible = await this.searchPage.isFullNameInResults(user.fullName);
  
  if (!isVisible) {
    throw new Error(`Full name "${user.fullName}" was not found in the search results`);
  }
});

// ── Then ─────────────────────────────────────────────────────────────────────


Then('I click the fullname link', async function (this: CustomWorld) {
  const user = resolveUser(this);
  await this.searchPage.clickEditForRecord(user.email);
  console.log(`✅ Clicked Edit for: ${user.email}`);
});


Then('I should see the user details', async function (this: CustomWorld) {
  const isDetailPageLoaded = await this.userDetailsPage.isPageLoaded();
  console.log(`🔍 User Details page loaded: ${isDetailPageLoaded}`);
});
