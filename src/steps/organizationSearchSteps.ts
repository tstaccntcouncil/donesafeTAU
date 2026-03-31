import { OrganizationSearchPage } from '../pages/OrganizationSearchPage';
import { Given, When, Then, Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import { CustomWorld } from '../hooks/hooks.js';
import { BrowserManager } from '../utils/browserManager';
import { getEnvConfig } from '../utils/envConfig';
import { testOrganizationData, OrganizationRecord } from '../data/testOrganizationDataLoader';


// ── Timeout ────────────────────────────────────────────────────────────────
//setDefaultTimeout(30_000);

// ── World state ────────────────────────────────────────────────────────────
const config = getEnvConfig();

// This holds the page instance between steps
let organizationSearchPage: OrganizationSearchPage;

Before({ tags: '@organizationSearch' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🟢 BEFORE: "${scenario.pickle.name}" — creating new context`);
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context         = context;
  this.page            = page;
  this.baseUrl         = config.baseUrl;
  this.currentOrganization = null;
  this.organizationSearchPage   = new OrganizationSearchPage(page);
  console.log(`   Page state: ${this.page.isClosed() ? 'CLOSED ❌' : 'OPEN ✅'}`);
});

After({ tags: '@organizationSearch' },  async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🔴 AFTER: "${scenario.pickle.name}" — closing context`);
  await this.page.waitForTimeout(2000);
  // ...
});

function resolveOrganization(world: CustomWorld): OrganizationRecord {
  if (!world.currentOrganization) {
    throw new Error('No current organization set in world. Call a search step first.');
  }
  return world.currentOrganization;
}

// ─── Scenario 1 ────────────────────────────────────────────────────────────────

Given('I am on the DoneSafe page from any previous scenario', async function(this: CustomWorld) {
  //wait this.postLoginPage.verifyWelcomePageLoaded();
  this.organizationSearchPage = new OrganizationSearchPage(this.page);
  await this.organizationSearchPage.verifyAccountProfileExists();
  console.log(`✅ DoneSafe page is shown`);
 
});


// ─── When Steps ────────────────────────────────────────────────────────────────

When('I click profile account menu', async function (this: CustomWorld)  {
  this.organizationSearchPage = new OrganizationSearchPage(this.page);
  await this.organizationSearchPage.navigateToProfile();
  console.log(`✅ Profile menu clicked`);

});


When('I click settings menu item', async function (this: CustomWorld)  {
  this.organizationSearchPage = new OrganizationSearchPage(this.page);
  await this.organizationSearchPage.navigateToSettings();
  console.log(`✅ Settings button clicked from profile menu`);

});


Then('I should click the Organizations link on the settings webpage', async function (this: CustomWorld)  {
  await this.organizationSearchPage.verifySettingsPageLoaded();
  await this.organizationSearchPage.navigateToOrganizations();
  console.log(`✅ Organizations link clicked from settings page`);
});


// ─── Scenario 2 ────────────────────────────────────────────────────────────────


Given('I am on the Organization Search page', async function(this: CustomWorld) {
  this.organizationSearchPage = new OrganizationSearchPage(this.page);
  await this.organizationSearchPage.verifyOrganizationsPageLoaded();
  console.log(`✅ Organization Search page is shown`);
 
});



When('I search for the default organization name', async function (this: CustomWorld) {
  this.organizationSearchPage = new OrganizationSearchPage(this.page);
  this.currentOrganization = testOrganizationData.getDefaultOrganization();

  console.log(`📂 Test organization data loaded — name: ${this.currentOrganization.name}`);
  await this.organizationSearchPage.enterSearchOrganizationName(this.currentOrganization.name);
  console.log(`✅ Entered organization name: ${this.currentOrganization.name}`);


});

When('I see the default organization name in the results', async function (this: CustomWorld) {
  this.organizationSearchPage = new OrganizationSearchPage(this.page);
  const organization = resolveOrganization(this);
  await this.organizationSearchPage.waitForTableToLoad(organization.name);

  const isVisible = await this.organizationSearchPage.isOrganizationNameInResults(organization.name);
  
  if (!isVisible) {
    throw new Error(`Organization name "${organization.name}" was not found in the search results`);
  }
});

Then('I should click the organization name link to view details', async function (this: CustomWorld) {
  this.organizationSearchPage = new OrganizationSearchPage(this.page);
  const organization = resolveOrganization(this);
  await this.organizationSearchPage.clickEditForRecord(organization.name);
  console.log(`✅ Clicked Edit for: ${organization.name}`);
});
