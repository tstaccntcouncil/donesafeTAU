import { LocationSearchPage } from '../pages/LocationSearchPage';
import { LoginPage } from '../pages/LoginPage';
import { Given, When, Then, Before, After, setDefaultTimeout, ITestCaseHookParameter } from '@cucumber/cucumber';
import { CustomWorld } from '../hooks/hooks.js';
import { BrowserManager } from '../utils/browserManager';
import { getEnvConfig } from '../utils/envConfig';
import { testLocationData, LocationRecord } from '../data/testLocationDataLoader';


// ── Timeout ────────────────────────────────────────────────────────────────
//setDefaultTimeout(30_000);

// ── World state ────────────────────────────────────────────────────────────
const config = getEnvConfig();

// This holds the page instance between steps
let locationSearchPage: LocationSearchPage;
let loginPage: LoginPage;


Before({ tags: '@locationSearch' }, async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🟢 BEFORE: "${scenario.pickle.name}" — creating new context`);
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context         = context;
  this.page            = page;
  this.baseUrl         = config.baseUrl;
  this.currentLocation = null;
  this.locationSearchPage   = new LocationSearchPage(page);
  console.log(`   Page state: ${this.page.isClosed() ? 'CLOSED ❌' : 'OPEN ✅'}`);
});

After({ tags: '@locationSearch' },  async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  console.log(`🔴 AFTER: "${scenario.pickle.name}" — closing context`);
  await this.page.waitForTimeout(2000);
  // ...
});

function resolveLocation(world: CustomWorld): LocationRecord {
  if (!world.currentLocation) {
    throw new Error('No current location set in world. Call a search step first.');
  }
  return world.currentLocation;
}

// ─── Scenario 1 ────────────────────────────────────────────────────────────────

Given('I am on the DoneSafe page', async function(this: CustomWorld) {
  //wait this.postLoginPage.verifyWelcomePageLoaded();
  await this.locationSearchPage.verifyAccountProfileExists();
  console.log(`✅ DoneSafe page is shown`);
 
});


// ─── When Steps ────────────────────────────────────────────────────────────────

When('I click the profile account menu', async function (this: CustomWorld)  {

  await this.locationSearchPage.navigateToProfile();
  console.log(`✅ Profile menu clicked`);

});


When('I click the settings menu item', async function (this: CustomWorld)  {
  await this.locationSearchPage.navigateToSettings();
  console.log(`✅ Settings button clicked from profile menu`);

});


Then('I should click the Locations link on the settings webpage', async function (this: CustomWorld)  {
  await this.locationSearchPage.verifySettingsPageLoaded();
  await this.locationSearchPage.navigateToLocations();
  console.log(`✅ Locations link clicked from settings page`);
});


// ─── Scenario 2 ────────────────────────────────────────────────────────────────


Given('I am on the Location Search page', async function(this: CustomWorld) {
  //wait this.postLoginPage.verifyWelcomePageLoaded();
  await this.locationSearchPage.verifyLocationsPageLoaded();
  console.log(`✅ Location Search page is shown`);
 
});



When('I search for the default location name', async function (this: CustomWorld) {
  //await this.postLoginPage.verifyUsersPageLoaded();
  
    this.currentLocation = testLocationData.getDefaultLocation();
  
    console.log(`📂 Test location data loaded — name: ${this.currentLocation.name}`);
    await this.locationSearchPage.enterSearchLocationName(this.currentLocation.name);
    console.log(`✅ Entered location name: ${this.currentLocation.name}`);


});

When('I see the default location name in the results', async function (this: CustomWorld) {
  const location = resolveLocation(this);
  await this.locationSearchPage.waitForTableToLoad(location.name);
  
  const isVisible = await this.locationSearchPage.isLocationNameInResults(location.name);
  
  if (!isVisible) {
    throw new Error(`Location name "${location.name}" was not found in the search results`);
  }
});

Then('I should click the location name link to view details', async function (this: CustomWorld) {
  const location = resolveLocation(this);
  await this.locationSearchPage.clickEditForRecord(location.name);
  console.log(`✅ Clicked Edit for: ${location.name}`);
});
