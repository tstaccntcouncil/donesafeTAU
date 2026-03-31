import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
  ITestCaseHookParameter,
} from '@cucumber/cucumber';
import { Page, BrowserContext } from '@playwright/test';
import { BrowserManager } from '../utils/browserManager';
import { getEnvConfig } from '../utils/envConfig';
import { UserRecord } from '../data/testDataLoader';
import * as fs from 'fs';
import * as path from 'path';
import { UserDetailsPage } from '../pages/UserDetailsPage';
import { SearchPage } from '../pages/SearchPage';
import { LoginPage } from '../pages/LoginPage';
import { PostLoginPage } from '../pages/PostLoginPage';
import { LocationSearchPage } from '../pages/LocationSearchPage';
import { LocationRecord } from 'src/data/testLocationDataLoader';
import { LocationDetailsPage } from '@pages/LocationDetailsPage';
import * as dotenv from 'dotenv';
import { OrganizationRecord } from 'src/data/testOrganizationDataLoader';
import { OrganizationSearchPage } from '@pages/OrganizationSearchPage';
import { OrganizationDetailsPage } from '@pages/OrganizationDetailsPage';

// Load env vars before anything else
dotenv.config({ override: true });
const config = getEnvConfig();

setDefaultTimeout(config.timeout);

const result = dotenv.config({ override: true });

if (result.error) {
  console.error('❌ Failed to load .env file:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('USERNAME set:', !!process.env.USERNAME);
  console.log('PASSWORD set:', !!process.env.PASSWORD);
}

// State shared between step definitions within a single scenario
export interface CustomWorld {
  page: Page;
  context: BrowserContext;
  baseUrl: string;
  currentUser: UserRecord | null;
  userDetailsPage: UserDetailsPage; 
  searchPage:      SearchPage; 
  loginPage:       LoginPage;
  postLoginPage:   PostLoginPage;
  locationSearchPage: LocationSearchPage;
  locationDetailsPage: LocationDetailsPage;
  currentLocation: LocationRecord | null;
  currentOrganization: OrganizationRecord | null;
  organizationSearchPage: OrganizationSearchPage;
  organizationDetailsPage: OrganizationDetailsPage;
}

// ── Launch browser once for the whole run ───────────────────────────────────
BeforeAll(async function () {
  ['reports', 'reports/screenshots', 'reports/videos'].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  await BrowserManager.launchBrowser(config.browserType);
  console.log(`\n🚀 Browser launched: ${config.browserType} (headless: ${process.env.HEADLESS === 'true'})`);
  console.log(`🌐 Base URL: ${config.baseUrl}`);
});

// ── Fresh context + page for every scenario ─────────────────────────────────
// This guarantees a clean slate (cookies, storage, history) per scenario
// and ensures the browser window actually appears for each test.
Before(async function (this: CustomWorld) {
  const { context, page } = await BrowserManager.newScenarioPage();
  this.context = context;
  this.page = page;
  this.baseUrl = config.baseUrl;
  this.currentUser = null;

  console.log(`\n🔄 New scenario started: ${this.page.url()}`);
});

// ── Screenshot on failure, then close the scenario's context ────────────────
After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result?.status === Status.FAILED) {
    const safeName = scenario.pickle.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    const screenshotPath = path.join(
      'reports', 'screenshots',
      `FAILED_${safeName}_${Date.now()}.png`
    );

    try {
      const screenshot = await this.page.screenshot({ fullPage: true, path: screenshotPath });
      //this.attach(screenshot, 'image/png');
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    } catch (err) {
      console.error('Failed to take screenshot:', err);
    }
  }

 
});

// ── Close the browser after all scenarios finish ─────────────────────────────
AfterAll(async function () {
  await BrowserManager.closeBrowser();
  console.log('\n✅ Browser closed. Test run complete.');
});
